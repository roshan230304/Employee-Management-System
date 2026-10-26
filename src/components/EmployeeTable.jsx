import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const EmployeeTable = ({
  employees = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  departmentFilter = 'All',
  onDepartmentFilterChange,
  onDeleteClick,
  onResetPassword
}) => {
  // Extract unique departments for the filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return ['All', ...Array.from(set).sort()];
  }, [employees]);

  // Filter employees based on search query and department
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        String(emp.id).includes(q);

      const matchesDept =
        departmentFilter === 'All' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  // Format currency
  const formatSalary = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '—';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Number(amount));
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'EM';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="employee-table-wrapper">
      {/* Controls Bar: Search & Department Filter */}
      <div className="table-controls-card">
        <div className="search-box">
          <svg className="search-box-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by employee ID, name, email, or department..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="filter-box">
          <label htmlFor="dept-filter" className="filter-label">
            Department:
          </label>
          <select
            id="dept-filter"
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="filter-select"
          >
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="table-results-summary">
        <span>
          Showing <strong>{filteredEmployees.length}</strong> of{' '}
          <strong>{employees.length}</strong> records in MySQL database
        </span>
        {(searchTerm || departmentFilter !== 'All') && (
          <button
            type="button"
            className="btn-link-reset"
            onClick={() => {
              onSearchChange('');
              onDepartmentFilterChange('All');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="table-container-card">
        {loading ? (
          <div className="table-loading-container">
            <div className="spinner-large"></div>
            <p className="loading-label">Fetching employees from MySQL database...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="table-empty-container">
            <div className="empty-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="8" x2="23" y2="14" />
                <line x1="23" y1="8" x2="17" y2="14" />
              </svg>
            </div>
            {employees.length === 0 ? (
              <>
                <h3 className="empty-title">No employees in the database yet</h3>
                <p className="empty-description">
                  The MySQL <code>employees</code> table is currently empty. Get started by adding your first employee record.
                </p>
                <Link to="/add-employee" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add First Employee</span>
                </Link>
              </>
            ) : (
              <>
                <h3 className="empty-title">No matching employee records</h3>
                <p className="empty-description">
                  No records match your search query or department filter. Try modifying your search criteria.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    onSearchChange('');
                    onDepartmentFilterChange('All');
                  }}
                  style={{ marginTop: '1rem' }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="responsive-table-scroll">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Salary</th>
                  <th>Login</th>
                  <th style={{ textAlign: 'right', minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="table-data-row">
                    {/* ID */}
                    <td className="cell-id">
                      <span className="id-badge">#{emp.id}</span>
                    </td>

                    {/* Name */}
                    <td>
                      <div className="employee-identity">
                        <div className="employee-avatar">{getInitials(emp.name)}</div>
                        <Link to={`/employees/${emp.id}`} className="employee-name-text">{emp.name}</Link>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="cell-email">
                      <a href={`mailto:${emp.email}`} className="email-link" title={`Email ${emp.name}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cell-icon">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{emp.email}</span>
                      </a>
                    </td>

                    {/* Phone */}
                    <td className="cell-phone">
                      {emp.phone ? (
                        <span className="phone-text">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cell-icon">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{emp.phone}</span>
                        </span>
                      ) : (
                        <span className="cell-muted">—</span>
                      )}
                    </td>

                    {/* Department */}
                    <td>
                      <span className={`dept-pill dept-${(emp.department || 'general').toLowerCase().replace(/\s+/g, '-')}`}>
                        {emp.department || 'General'}
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="cell-salary">
                      <strong>{formatSalary(emp.salary)}</strong>
                    </td>
                    <td>{emp.has_login ? 'Enabled' : 'Not set'}</td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-container">
                        <Link
                          to={`/employees/${emp.id}`}
                          className="action-btn"
                          title={`View ${emp.name}`}
                          aria-label={`View ${emp.name}`}
                        >
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => onResetPassword(emp)}
                          title={`Set or reset login password for ${emp.name}`}
                          aria-label={`Set or reset login password for ${emp.name}`}
                        >
                          <span>{emp.has_login ? 'Reset Password' : 'Set Password'}</span>
                        </button>
                        <Link
                          to={`/edit-employee/${emp.id}`}
                          className="action-btn edit-action-btn"
                          title={`Edit ${emp.name}`}
                          aria-label={`Edit ${emp.name}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </Link>

                        <button
                          type="button"
                          className="action-btn delete-action-btn"
                          onClick={() => onDeleteClick(emp)}
                          title={`Delete ${emp.name} from MySQL`}
                          aria-label={`Delete ${emp.name}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTable;
