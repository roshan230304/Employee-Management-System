import React from 'react';
import { NavLink } from 'react-router-dom';

const ADMIN_LINKS = [
  ['/', 'Dashboard'],
  ['/employees', 'Employees'],
  ['/add-employee', 'Add Employee'],
  ['/attendance', 'Attendance'],
  ['/tasks', 'Tasks']
];

const EMPLOYEE_LINKS = [
  ['/employee', 'My Dashboard'],
  ['/my-tasks', 'My Tasks'],
  ['/my-attendance', 'My Attendance'],
  ['/profile', 'My Profile']
];

const Sidebar = ({ user, isOpen, onClose }) => {
  const links = user?.role === 'admin' ? ADMIN_LINKS : EMPLOYEE_LINKS;
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-section-title">{user?.role === 'admin' ? 'Admin Panel' : 'Employee Panel'}</div>
          <nav className="sidebar-nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/' || to === '/employee'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}>
                <span className="link-icon" aria-hidden="true">{label.slice(0, 1)}</span>
                <span className="link-text">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer-card">
            <div className="system-status-header">
              <span className="system-live-indicator"></span>
              <span className="system-status-title">Secure session</span>
            </div>
            <div className="system-details">
              <div className="system-row"><span className="system-key">Account:</span><span className="system-val">{user?.username}</span></div>
              <div className="system-row"><span className="system-key">Role:</span><span className="system-val">{user?.role}</span></div>
              <div className="system-row"><span className="system-key">Database:</span><span className="system-val">react_db</span></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
