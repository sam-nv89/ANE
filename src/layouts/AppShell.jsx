import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AppShell.css';
import {
  LayoutDashboard, ShoppingCart, TrendingUp, User,
  ChevronRight, Zap, LogOut,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import './AppShell.css';

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Рацион' },
  { to: '/app/shopping',  icon: ShoppingCart,    label: 'Покупки' },
  { to: '/app/progress',  icon: TrendingUp,       label: 'Прогресс' },
  { to: '/app/profile',   icon: User,             label: 'Профиль' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { profile, resetProfile } = useUserStore();

  const handleLogout = () => {
    resetProfile();
    navigate('/');
  };

  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className="shell__sidebar" aria-label="Боковое меню">
        {/* Logo */}
        <div className="shell__logo">
          <div className="shell__logo-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="url(#shell-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="shell-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00f5a0" />
                  <stop offset="1" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="shell__logo-text gradient-text">ANE</span>
        </div>

        {/* User card */}
        {profile && (
          <div className="shell__user">
            <div className="shell__user-avatar" aria-hidden="true">
              {profile.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="shell__user-info">
              <div className="shell__user-name">{profile.name}</div>
              <div className="shell__user-goal">{profile.goalLabel}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="shell__nav" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `shell__nav-link ${isActive ? 'shell__nav-link--active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
              <ChevronRight size={14} className="shell__nav-arrow" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="shell__sidebar-bottom">
          <button
            className="shell__nav-link shell__logout"
            onClick={handleLogout}
            aria-label="Выйти на главную"
          >
            <LogOut size={18} strokeWidth={1.75} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="shell__body">
        {/* Topbar */}
        <header className="shell__topbar">
          <div className="shell__topbar-left">
            <Zap size={14} className="shell__topbar-icon" aria-hidden="true" />
            <span className="shell__topbar-tag">Beta</span>
          </div>
          <button
            className="shell__topbar-cta btn-primary"
            onClick={() => navigate('/app/dashboard')}
          >
            Пересчитать рацион
          </button>
        </header>

        {/* Page outlet */}
        <main className="shell__main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
