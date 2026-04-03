import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

/**
 * AppGuard — redirects to onboarding if the user hasn't completed their profile.
 * Wraps all /app/* routes that require a profile to exist.
 */
export default function AppGuard({ children }) {
  const profileComplete = useUserStore((s) => s.profileComplete);
  if (!profileComplete) {
    return <Navigate to="/app/onboarding" replace />;
  }
  return children;
}
