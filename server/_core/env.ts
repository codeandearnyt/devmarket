export const ENV = {
  /**
   * Scopes session tokens to this app. It is carried in the JWT but never used
   * for authorization, so it falls back to a stable value rather than an empty
   * string — an unset env var must not be able to invalidate every session.
   */
  appId: process.env.VITE_APP_ID || "devmarket",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
