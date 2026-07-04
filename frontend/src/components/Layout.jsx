import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HEADER = '#3e1654';
const HOVER = '#e96718';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/abstract', label: 'Abstract' },
  { to: '/view-request', label: 'View Request' },
  { to: '/reports/district-wise', label: 'District Wise Report' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar - matches the original app's Top.ascx */}
      <header style={{ backgroundColor: HEADER }} className="shadow-sm">
        <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2 text-white font-semibold text-lg shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm">
              SP
            </div>
            <span>
              <span className="font-semibold">Safe</span>{' '}
              <span className="font-semibold">Punjab</span>
            </span>
          </a>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} to={item.to} active={location.pathname === item.to}>
                {item.label}
              </NavItem>
            ))}

            {/* District Wise Abstract - dropdown, matches original sub-menu */}
            <div className="relative group px-1">
              <button
                className="text-white/90 text-sm px-3 py-2 rounded-md transition-colors"
                style={{ '--hover-bg': HOVER }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                District Wise Abstract
              </button>
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-20">
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-44 overflow-hidden">
                  <DropdownLink to="/reports/district-wise-abstract?isVdc=0">Safe Punjab</DropdownLink>
                  <DropdownLink to="/reports/district-wise-abstract?isVdc=1">VDC</DropdownLink>
                </div>
              </div>
            </div>

            {/* User profile dropdown */}
            <div className="relative group pl-3 ml-2 border-l border-white/15">
              <button className="flex items-center gap-2 text-white/90 text-sm px-2 py-1.5 rounded-md">
                <span>{user?.name || 'User'}</span>
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-medium">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </button>
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-20">
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-44 overflow-hidden">
                  <DropdownLink to="/my-account">My Account</DropdownLink>
                  <DropdownLink to="/change-password">Change Password</DropdownLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-orange-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {user?.designationId === 1 && (
              <NavItem to="/employees" active={location.pathname === '/employees'}>
                Admin
              </NavItem>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function NavItem({ to, active, children }) {
  return (
    <NavLink
      to={to}
      className="text-sm px-3 py-2 rounded-md transition-colors"
      style={{
        color: active ? HOVER : 'rgba(255,255,255,0.9)',
        borderBottom: active ? `3px solid ${HOVER}` : '3px solid transparent',
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = HOVER;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </NavLink>
  );
}

function DropdownLink({ to, children }) {
  return (
    <NavLink to={to} className="block px-3 py-2 text-sm text-slate-700 hover:bg-orange-50">
      {children}
    </NavLink>
  );
}
