import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  /** The storefront session (`app_session_id`), or null when signed out. */
  user: User | null;
  /**
   * The operator established by `auth.adminLogin` (`app_admin_session_id`).
   * Null for ordinary visitors — this is what `adminProcedure` keys off, so a
   * Google session with role=admin still cannot reach the console.
   */
  adminUser: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminUser: User | null = null;

  try {
    adminUser = await sdk.authenticateAdminRequest(opts.req);
  } catch {
    // No valid admin cookie — normal for every storefront visitor.
    adminUser = null;
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminUser,
  };
}
