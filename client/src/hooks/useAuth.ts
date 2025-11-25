// useAuth hook for accessing authentication state
// Guest mode: Stubbed to eliminate network requests during hackathon build
import type { User } from "@shared/schema";

export function useAuth() {
  // Stubbed for guest mode - no API calls
  // Original implementation used useQuery to fetch from /api/auth/user
  const user: User | null = null;
  const isLoading = false;
  const isAuthenticated = false;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
