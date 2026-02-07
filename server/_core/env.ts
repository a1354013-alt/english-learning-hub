

// Only validate in production/development, not in tests
if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
  const errors: string[] = [];
  
  if (!process.env.VITE_APP_ID) errors.push("VITE_APP_ID is required");
  if (!process.env.DATABASE_URL) errors.push("DATABASE_URL is required");
  if (!process.env.OAUTH_SERVER_URL) errors.push("OAUTH_SERVER_URL is required");
  if (!process.env.VITE_OAUTH_PORTAL_URL) errors.push("VITE_OAUTH_PORTAL_URL is required");
  
  if (errors.length > 0) {
    const errorMessage = `[ENV] Production validation failed:\n${errors.map(e => `  - ${e}`).join("\n")}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export const ENV = {
  appId: process.env.VITE_APP_ID || "test-app-id",
  cookieSecret: process.env.JWT_SECRET || "test-secret-key-for-testing-purposes",
  databaseUrl: process.env.DATABASE_URL || "mysql://localhost/test",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL || "http://localhost:8080",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "http://localhost:8080",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "test-key",
};
