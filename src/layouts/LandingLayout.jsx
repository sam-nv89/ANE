import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * LandingLayout — minimal wrapper for the public-facing landing page.
 * No sidebar, no top navigation — just the raw page.
 */
export default function LandingLayout() {
  return <Outlet />;
}
