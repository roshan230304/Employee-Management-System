import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getEmployees, deleteEmployee, resetEmployeePassword } from '../services/api';
import EmployeeTable from '../components/EmployeeTable';
import ConfirmModal from '../components/ConfirmModal';

const ViewEmployees = () => {
  const location = useLocation();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Delete modal state
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [employeeToReset, setEmployeeToReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Fetch employees from Express backend & MySQL database
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEmployees();
      if (response.success && Array.isArray(response.data)) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load employees from MySQL database. Please verify the Express backend is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();

    // Check if redirected with a flash message from Add or Edit
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear after 4 seconds
      const timer = setTimeout(() => setSuccessMessage(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [loadEmployees, location.state]);

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteEmployee(employeeToDelete.id);
      if (response.success) {
        setSuccessMessage(`Employee "${employeeToDelete.name}" was successfully deleted from MySQL.`);
        // Refresh employee list
        await loadEmployees();
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(err.response?.data?.message || 'Failed to delete employee from database.');
    } finally {
      setDeleting(false);
      setEmployeeToDelete(null);
      // Auto-clear message after 4.5 seconds
      setTimeout(() => setSuccessMessage(''), 4500);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!employeeToReset) return;
    setResetting(true);
    setResetError('');
    try {
      await resetEmployeePassword(employeeToReset.id, newPassword);
      setSuccessMessage(`Login password set for ${employeeToReset.name}.`);
      setEmployeeToReset(null);
      setNewPassword('');
      await loadEmployees();
    } catch (requestError) {
      setResetError(requestError.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="view-employees-page fade-in">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-heading">View Employees</h1>
          <p className="page-sub-heading">
            Live records retrieved from MySQL table <code>react_db.employees</code>.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary action-refresh-btn"
            onClick={loadEmployees}
            disabled={loading}
            title="Refresh records from MySQL"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link to="/add-employee" className="btn btn-primary action-add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="alert-banner-box alert-success" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div className="alert-text-wrap">
            <strong>Success:</strong> {successMessage}
          </div>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setSuccessMessage('')}
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="alert-banner-box alert-danger" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-text-wrap">
            <strong>Database Error:</strong> {error}
          </div>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setError('')}
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {/* Employees Table Component */}
      <EmployeeTable
        employees={employees}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        onDeleteClick={(emp) => setEmployeeToDelete(emp)}
        onResetPassword={(emp) => { setEmployeeToReset(emp); setNewPassword(''); setResetError(''); }}
      />

      {employeeToReset && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-box modal-form" onSubmit={handleResetPassword} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{employeeToReset.has_login ? 'Reset login password' : 'Set employee login'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setEmployeeToReset(null)} aria-label="Close">&times;</button>
            </div>
            <p>{employeeToReset.name} will sign in with <strong>{employeeToReset.email}</strong>.</p>
            <label className="form-label" htmlFor="reset-employee-password">New password</label>
            <input id="reset-employee-password" className="form-input" type="password" autoComplete="new-password"
              minLength={12} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <small>Use 12–72 characters. The password is stored as a bcrypt hash.</small>
            {resetError && <div className="alert-banner-box alert-danger" role="alert">{resetError}</div>}
            <div className="form-button-toolbar">
              <button type="button" className="btn btn-secondary" onClick={() => setEmployeeToReset(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={resetting}>{resetting ? 'Saving…' : 'Save password'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {employeeToDelete && (
        <ConfirmModal
          title="Delete Employee Record"
          message={`Permanently delete "${employeeToDelete.name}" (ID #${employeeToDelete.id})? Related attendance and task records will also be deleted by the database. This cannot be undone.`}
          confirmText={deleting ? 'Deleting from MySQL...' : 'Yes, Delete Record'}
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setEmployeeToDelete(null)}
        />
      )}
    </div>
  );
};

export default ViewEmployees;
