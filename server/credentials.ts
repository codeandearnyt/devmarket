import crypto from "node:crypto";
import { ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { createCredentialUser, getUserByEmail, getUserByOpenId, upsertUser } from "./db";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function deriveKey(password: string, salt: crypto.BinaryLike, keyLength: number, workFactor = { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }) {
  return new Promise<Buffer>((resolve, reject) => crypto.scrypt(password, salt, keyLength, workFactor, (error, derived) => error ? reject(error) : resolve(derived as Buffer)));
}

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function credentialOpenId(email: string) { return `email_${crypto.createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 56)}`; }

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH);
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltText, hashText] = parts;
  if (Number(n) !== SCRYPT_N || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(hashText, "base64url");
  if (!salt.length || expected.length !== KEY_LENGTH) return false;
  const actual = await deriveKey(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return crypto.timingSafeEqual(actual, expected);
}

export async function registerCredentialUser(email: string, name: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) throw new Error("An account with this email already exists");
  const user = await createCredentialUser({ openId: credentialOpenId(normalizedEmail), email: normalizedEmail, name: name.trim(), passwordHash: await hashPassword(password) });
  if (!user) throw new Error("Could not create account");
  return user;
}

export async function authenticateCredentialUser(email: string, password: string) {
  const user = await getUserByEmail(normalizeEmail(email));
  if (!user?.passwordHash || user.isDisabled || !(await verifyPassword(password, user.passwordHash))) throw new Error("Invalid email or password");
  await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
  return getUserByOpenId(user.openId);
}

export async function createCredentialSession(user: { openId: string; name: string | null }) {
  return sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name ?? "" }, { expiresInMs: ONE_YEAR_MS });
}
