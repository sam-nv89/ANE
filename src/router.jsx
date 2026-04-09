import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import LandingLayout from './layouts/LandingLayout';
import AppShell from './layouts/AppShell';

// Landing page sections (assembled as one page)
import LandingPage from './pages/Landing/LandingPage';

// App pages
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MealDetailPage from './pages/MealDetail/MealDetailPage';
import ShoppingListPage from './pages/ShoppingList/ShoppingListPage';
import ProgressPage from './pages/Progress/ProgressPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import RecipesPage from './pages/Recipes/RecipesPage';

// Guard — redirect to onboarding if no profile yet
import AppGuard from './components/AppGuard';

export const router = createBrowserRouter([
  // ─── Public: Landing ───
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },

  // ─── App: Onboarding (no shell) ───
  {
    path: '/app/onboarding',
    element: <OnboardingPage />,
  },

  // ─── App: Main (with AppShell sidebar) ───
  {
    path: '/app',
    element: (
      <AppGuard>
        <AppShell />
      </AppGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard',  element: <DashboardPage /> },
      { path: 'meal/:id',   element: <MealDetailPage /> },
      { path: 'shopping',   element: <ShoppingListPage /> },
      { path: 'progress',   element: <ProgressPage /> },
      { path: 'profile',    element: <ProfilePage /> },
      { path: 'settings',   element: <SettingsPage /> },
      { path: 'recipes',    element: <RecipesPage /> },
    ],
  },

  // ─── Fallback ───
  {
    path: '/settings',
    element: <Navigate to="/app/settings" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
