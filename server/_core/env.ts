/**
 * Environment variable validation and configuration
 * All required environment variables must be present and valid at startup
 * Missing or invalid env vars will cause the server to fail immediately
 */

function validateEnvironment(): void {
  const errors: string[] = [];
  const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

  // Required environment variables that must always be present
  const requiredEnvs = {
    JWT_SECRET: {
      value: process.env.JWT_SECRET,
      validate: (val: string | undefined) => {
        if (!val) return "JWT_SECRET is required";
        if (isTestMode) return null; // Allow shorter secrets in test mode
        if (val.length < 32) return "JWT_SECRET must be at least 32 characters long";
        return null;
      },
    },
    DATABASE_URL: {
      value: process.env.DATABASE_URL,
      validate: (val: string | undefined) => {
        if (!val) return "DATABASE_URL is required";
        if (!val.startsWith("mysql://")) {
          return "DATABASE_URL must start with mysql:// (SRV lookup not supported)";
        }
        return null;
      },
    },
  };

  // Conditionally required in production/development (not in tests)
  if (!isTestMode) {
    const productionEnvs = {
      VITE_APP_ID: process.env.VITE_APP_ID,
      OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL,
      VITE_OAUTH_PORTAL_URL: process.env.VITE_OAUTH_PORTAL_URL,
    };

    Object.entries(productionEnvs).forEach(([key, value]) => {
      if (!value) {
        errors.push(`${key} is required in production/development mode`);
      }
    });

    // APP_ORIGIN is required in production, but optional in development
    if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN) {
      errors.push("APP_ORIGIN is required in production mode");
    }
  }

  // Validate required environment variables
  Object.entries(requiredEnvs).forEach(([key, { validate }]) => {
    const error = validate(process.env[key]);
    if (error) {
      errors.push(error);
    }
  });

  // Throw error if validation failed
  if (errors.length > 0) {
    const errorMessage = `[ENV] Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Validate environment variables immediately on module load
validateEnvironment();

/**
 * Validated environment configuration
 * All values are guaranteed to be present and valid
 */
export const ENV = {
  // Core authentication
  appId: process.env.VITE_APP_ID!,
  cookieSecret: process.env.JWT_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,

  // OAuth configuration
  appOrigin: process.env.APP_ORIGIN || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : ""),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL!,
  oAuthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL!,

  // Owner information
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",

  // API configuration
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Analytics configuration
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "",
  analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "",

  // Runtime environment
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test" || process.env.VITEST === "true",
} as const;
