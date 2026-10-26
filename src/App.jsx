import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ViewEmployees from './pages/ViewEmployees';
import AddEmployee from './pages/AddEmployee';
import EditEmployee from './pages/EditEmployee';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import EmployeeDetails from './pages/EmployeeDetails';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import MyTasks from './pages/MyTasks';
import MyAttendance from './pages/MyAttendance';
import MyProfile from './pages/MyProfile';
import './App.css';

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/' : '/employee'} replace />;
  return children;
}

function AppContent() {
  const { user, loading, sessionError } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <div className="form-loading-state"><div className="spinner-large"></div><p>Checking your session…</p></div>;
  }

  if (!user) {
    return (
      <>{sessionError && <div className="alert-banner-box alert-danger session-error" role="alert">{sessionError}</div>}<Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes></>
    );
  }

  const home = user.role === 'admin' ? '/' : '/employee';
  return (
    <div className="app-layout-root">
      <Navbar
        user={user}
        onToggleSidebar={() => setIsSidebarOpen((previous) => !previous)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="app-body-container">
        <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="app-main-viewport">
          <div className="main-content-inner">
            <Routes>
              <Route path="/login" element={<Navigate to={home} replace />} />
              <Route path="/" element={<RoleRoute role="admin"><Dashboard /></RoleRoute>} />
              <Route path="/employees" element={<RoleRoute role="admin"><ViewEmployees /></RoleRoute>} />
              <Route path="/employees/:id" element={<RoleRoute role="admin"><EmployeeDetails /></RoleRoute>} />
              <Route path="/add-employee" element={<RoleRoute role="admin"><AddEmployee /></RoleRoute>} />
              <Route path="/edit-employee/:id" element={<RoleRoute role="admin"><EditEmployee /></RoleRoute>} />
              <Route path="/attendance" element={<RoleRoute role="admin"><Attendance /></RoleRoute>} />
              <Route path="/tasks" element={<RoleRoute role="admin"><Tasks /></RoleRoute>} />
              <Route path="/employee" element={<RoleRoute role="employee"><EmployeeDashboard /></RoleRoute>} />
              <Route path="/my-tasks" element={<RoleRoute role="employee"><MyTasks /></RoleRoute>} />
              <Route path="/my-attendance" element={<RoleRoute role="employee"><MyAttendance /></RoleRoute>} />
              <Route path="/profile" element={<RoleRoute role="employee"><MyProfile /></RoleRoute>} />
              <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
          </div>
          <footer className="app-main-footer">
            <div className="footer-content">
              <p>&copy; {new Date().getFullYear()} <strong>StaffSync</strong> &bull; Employee Management System.</p>
              <div className="footer-badges">
                <span className="footer-badge">{user.role === 'admin' ? 'Administrator' : 'Employee Portal'}</span>
                <span className="footer-badge mysql">MySQL Database (react_db)</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
