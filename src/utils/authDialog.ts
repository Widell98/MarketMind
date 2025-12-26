/**
 * Utility function to open the auth dialog with the specified mode
 * @param mode - 'login' or 'signup'
 * @param currentPath - Current pathname (optional, will use window.location if not provided)
 */
export const openAuthDialog = (mode: 'login' | 'signup' = 'login', currentPath?: string) => {
  const path = currentPath || window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('auth', mode);
  const newUrl = `${path}?${searchParams.toString()}`;
  window.history.pushState({}, '', newUrl);
  // Trigger popstate event to update React Router
  window.dispatchEvent(new PopStateEvent('popstate'));
};

