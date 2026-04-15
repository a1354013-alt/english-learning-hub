/**
 * Environment variable validation and configuration.
 * In test mode we provide deterministic defaults so unit tests can import
 * modules without requiring a fully provisioned runtime environment.
 */

type EnvironmentConfig = {
  appId: string;
  cookieSecret: string;
  databaseUrl: string;
  appOrigin: string;
  oAuthServerUrl: string;
  oAuthPortalUrl: string;
  ownerOpenId: string;
  ownerName: string;
  forgeApiUrl: string;
  forgeApiKey: string;
  analyticsEndpoint: string;
  analyticsWebsiteId: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
};

const isTestMode =
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const TEST_DEFAULTS = {
  JWT_SECRET: "test-jwt-secret-with-safe-minimum-length-32",
  DATABASE_URL: "mysql://test:test@localhost:3306/english_learning_hub_test",
  VITE_APP_ID: "test-app-id",
  OAUTH_SERVER_URL: "https://api.example.test",
  VITE_OAUTH_PORTAL_URL: "https://oauth.example.test",
  APP_ORIGIN: "http://localhost:3000",
} as const;

function readEnv(key: keyof typeof TEST_DEFAULTS): string | undefined {
  return process.env[key] ?? (isTestMode ? TEST_DEFAULTS[key] : undefined);
}

function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  const cookieSecret = readEnv("JWT_SECRET");
  const databaseUrl = readEnv("DATABASE_URL");
  const appId = readEnv("VITE_APP_ID");
  const oAuthServerUrl = readEnv("OAUTH_SERVER_URL");
  const oAuthPortalUrl = readEnv("VITE_OAUTH_PORTAL_URL");
  const appOrigin =
    process.env.APP_ORIGIN ??
    (isTestMode
      ? TEST_DEFAULTS.APP_ORIGIN
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "");

  if (!cookieSecret) {
    errors.push("JWT_SECRET is required");
  } else if (!isTestMode && cookieSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }

  if (!databaseUrl) {
    errors.push("DATABASE_URL is required");
  } else if (!databaseUrl.startsWith("mysql://")) {
    errors.push(
      "DATABASE_URL must start with mysql:// (SRV lookup not supported)"
    );
  }

  if (!isTestMode) {
    if (!appId) {
      errors.push("VITE_APP_ID is required in production/development mode");
    }
    if (!oAuthServerUrl) {
      errors.push(
        "OAUTH_SERVER_URL is required in production/development mode"
      );
    }
    if (!oAuthPortalUrl) {
      errors.push(
        "VITE_OAUTH_PORTAL_URL is required in production/development mode"
      );
    }
    if (process.env.NODE_ENV === "production" && !appOrigin) {
      errors.push("APP_ORIGIN is required in production mode");
    }
  }

  if (errors.length > 0) {
    const errorMessage = `[ENV] Environment validation failed:\n${errors
      .map(e => `  - ${e}`)
      .join("\n")}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return {
    appId: appId!,
    cookieSecret: cookieSecret!,
    databaseUrl: databaseUrl!,
    appOrigin,
    oAuthServerUrl: oAuthServerUrl!,
    oAuthPortalUrl: oAuthPortalUrl!,
    ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
    ownerName: process.env.OWNER_NAME ?? "",
    forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
    forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
    analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "",
    analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "",
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    isTest: isTestMode,
  };
}

export const ENV = validateEnvironment();
