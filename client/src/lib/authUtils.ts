// Auth utility functions
import { useMemo } from "react";

export function useAuth() {
  const user = null;

  return useMemo(
    () => ({
      user,
      isAuthenticated: false,
      isLoading: false,
    }),
    [user],
  );
}
