import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Navbar = ({ user, onToggleSidebar, isSidebarOpen }) => {
  const { signOut } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const handleLogout = async () => {
    setLogoutError('');
    try {
      await signOut();
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Server logout failed. The browser session was cleared.');
    }
  };
  return (
    <header className="app-navbar">
      <div className="navbar-left">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar navigation' : 'Open sidebar navigation'}
          title="Toggle Navigation Menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Brand Link */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="brand-text-wrap">
            <span className="brand-main-title">StaffSync</span>
            <span className="brand-sub-title">Employee Portal</span>
          </div>
        </Link>
      </div>

      <div className="navbar-right">
        <span className="navbar-account">{user?.employee?.name || user?.username} <small>{user?.role}</small></span>
        {user?.role === 'admin' && (
          <Link to="/add-employee" className="btn-quick-add" title="Add a new employee record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Employee</span>
          </Link>
        )}
        {logoutError && <span className="navbar-logout-error" role="status">{logoutError}</span>}
        <button className="btn-logout" type="button" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
};

export default Navbar;
