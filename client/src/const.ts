export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Get OAuth start URL for login flow
 * This is the unified entry point for all OAuth login flows
 * 
 * @param redirectPath - Path to redirect to after login (default: "/")
 * @returns URL to /api/oauth/start endpoint
 */
export const getOAuthStartUrl = (redirectPath: string = "/"): string => {
  const params = new URLSearchParams();
  params.set("redirect", redirectPath);
  return `/api/oauth/start?${params.toString()}`;
};

/**
 * @deprecated Use getOAuthStartUrl instead
 * This function is kept for backward compatibility but should not be used
 * The server now handles OAuth state signing via /api/oauth/start
 */
export const getLoginUrl = (): string => {
  return getOAuthStartUrl("/");
};

/**
 * @deprecated Use getOAuthStartUrl instead
 * This function is kept for backward compatibility but should not be used
 */
export const signAndRedirect = async (): Promise<void> => {
  window.location.href = getOAuthStartUrl("/");
};
