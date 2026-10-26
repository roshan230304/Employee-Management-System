import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const getLocalDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    avgSalary: 0,
    departmentStats: [],
    recentEmployees: [],
    attendanceSummary: { Present: 0, Absent: 0, Late: 0, Leave: 0 },
    taskSummary: { Pending: 0, 'In Progress': 0, Completed: 0 },
    overdueTasks: 0,
    recentAttendance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDashboardStats();
      if (response.success && response.data) {
        setStats(prev => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(
        err.response?.data?.message ||
        'Unable to connect to the backend server. Please ensure the Node.js Express server is running on port 5000 and MySQL is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const today = getLocalDate();

  const ATT_COLORS = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b', Leave: '#8b5cf6' };
  const TASK_COLORS = { 'Pending': '#f59e0b', 'In Progress': '#3b82f6', 'Completed': '#10b981' };

  return (
    <div className="dashboard-page-container fade-in">
      {/* Top Welcome Header */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text-side">
          <span className="badge-welcome">Enterprise Administration</span>
          <h1 className="welcome-heading">
            Employee Management <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="welcome-subheading">
            Real-time analytics from your MySQL <code>react_db</code> database &mdash; employees, attendance &amp; tasks.
          </p>
        </div>

        <div className="welcome-quick-actions">
          <Link to="/employees" className="btn btn-secondary action-pill-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>View Employees</span>
          </Link>
          <Link to="/add-employee" className="btn btn-primary action-pill-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Backend / Database Connection Error Alert */}
      {error && (
        <div className="dashboard-error-banner" role="alert">
          <div className="error-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="error-text-box">
            <h4 className="error-title">Database Connection Issue</h4>
            <p className="error-message">{error}</p>
          </div>
          <button type="button" className="btn-retry" onClick={fetchStats}>Retry Connection</button>
        </div>
      )}

      {/* ── Row 1: Employee + Payroll Stat Cards ── */}
      <div className="stats-cards-grid">
        {/* Total Employees */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Employees</span>
            <div className="metric-icon-circle icon-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="metric-number">{loading || error ? <span className="skeleton-num">--</span> : stats.totalEmployees}</div>
          <div className="metric-footer"><span className="metric-pill success">● Persisted in MySQL</span></div>
        </div>

        {/* Today's Present Employees */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Present Today</span>
            <div className="metric-icon-circle icon-sky">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div className="metric-number">{loading || error ? <span className="skeleton-num">--</span> : stats.attendanceSummary.Present}</div>
          <div className="metric-footer"><span className="metric-note">Attendance recorded today (UTC)</span></div>
        </div>

        {/* Not yet marked present */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Not Marked Present</span>
            <div className="metric-icon-circle icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="metric-number">{loading || error ? <span className="skeleton-num">--</span> : stats.employeesNotMarkedPresentToday}</div>
          <div className="metric-footer"><span className="metric-note">Employees without present status today</span></div>
        </div>

        {/* Total Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Assigned Tasks</span>
            <div className="metric-icon-circle icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div className="metric-number">{loading || error ? <span className="skeleton-num">--</span> : stats.totalTasks}</div>
          <div className="metric-footer"><span className="metric-note">Across all employees</span></div>
        </div>
      </div>

      {/* ── Row 2: Attendance Today + Task Progress ── */}
      <div className="dashboard-content-columns">
        {/* Today's Attendance Summary */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Today's Attendance</h2>
              <p className="section-subtitle">{today} — live from MySQL attendance table</p>
            </div>
            <Link to="/attendance" className="card-top-link">Manage &rarr;</Link>
          </div>

          <div className="attendance-mini-grid">
            {Object.entries(stats.attendanceSummary || {}).map(([status, count]) => (
              <div key={status} className="att-mini-card" style={{ '--att-color': ATT_COLORS[status] || '#6b7280' }}>
                <div className="att-mini-count">{loading || error ? '--' : count}</div>
                <div className="att-mini-label">{status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Summary */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Task Overview</h2>
              <p className="section-subtitle">Live task status from MySQL tasks table</p>
            </div>
            <Link to="/tasks" className="card-top-link">Manage &rarr;</Link>
          </div>

          <div className="task-summary-list">
            {Object.entries(stats.taskSummary || {}).map(([status, count]) => (
              <div key={status} className="task-summary-row">
                <span className="task-summary-label" style={{ color: TASK_COLORS[status] || '#6b7280' }}>
                  ● {status}
                </span>
                <span className="task-summary-count">{loading || error ? '--' : count}</span>
              </div>
            ))}
            {!loading && !error && (stats.overdueTasks > 0) && (
              <div className="task-summary-row overdue-row">
                <span className="task-summary-label" style={{ color: '#ef4444' }}>⚠ Overdue</span>
                <span className="task-summary-count" style={{ color: '#ef4444' }}>{stats.overdueTasks}</span>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content-columns">
          <div className="dashboard-section-card" style={{ gridColumn: '1 / -1' }}>
            <div className="section-card-header">
              <div>
                <h2 className="section-title">Recent Attendance</h2>
                <p className="section-subtitle">Latest records from MySQL</p>
              </div>
              <Link to="/attendance" className="card-top-link">View Attendance &rarr;</Link>
            </div>
            {loading || error ? (
              <div className="loading-placeholder">{error ? 'Recent attendance unavailable.' : 'Loading recent attendance...'}</div>
            ) : stats.recentAttendance?.length ? (
              <div className="table-responsive">
                <table className="recent-attendance-table">
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentAttendance.map((record) => (
                      <tr key={record.id}>
                        <td>{record.employee_name || `Employee #${record.employee_id}`}</td>
                        <td>{record.department || '—'}</td>
                        <td>{record.attendance_date ? record.attendance_date.slice(0, 10) : '—'}</td>
                        <td>{record.status}</td>
                        <td>{record.check_in || '—'}</td>
                        <td>{record.check_out || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-sub-card"><p>No attendance records yet.</p></div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Department Distribution + Recent Employees ── */}
      <div className="dashboard-content-columns">
        {/* Department Breakdown */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Department Distribution</h2>
              <p className="section-subtitle">Staff allocation across organization departments</p>
            </div>
            <span className="section-badge">{stats.departmentStats?.length || 0} Departments</span>
          </div>

          <div className="department-breakdown-list">
            {loading || error ? (
              <div className="loading-placeholder">{error ? 'Department data unavailable.' : 'Loading department data...'}</div>
            ) : !stats.departmentStats || stats.departmentStats.length === 0 ? (
              <div className="empty-sub-card">
                <p>No department data found. Add employees to populate this chart.</p>
              </div>
            ) : (
              stats.departmentStats.map((item) => {
                const percentage = stats.totalEmployees > 0
                  ? Math.round((item.count / stats.totalEmployees) * 100)
                  : 0;
                return (
                  <div key={item.department} className="dept-stat-row">
                    <div className="dept-stat-info">
                      <div className="dept-stat-name-wrap">
                        <span className={`dept-color-tag dept-${item.department.toLowerCase().replace(/\s+/g, '-')}`}></span>
                        <strong className="dept-stat-name">{item.department}</strong>
                      </div>
                      <div className="dept-stat-numbers">
                        <span className="dept-count-badge">
                          {item.count} {item.count === 1 ? 'employee' : 'employees'} ({percentage}%)
                        </span>
                        <span className="dept-salary-badge">Avg: {formatCurrency(item.avgSalary)}</span>
                      </div>
                    </div>
                    <div className="dept-bar-track">
                      <div className="dept-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Employees */}
        <div className="dashboard-section-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-title">Recent Employees</h2>
              <p className="section-subtitle">Latest staff records added to MySQL</p>
            </div>
            <Link to="/employees" className="card-top-link">View All ({stats.totalEmployees}) &rarr;</Link>
          </div>

          <div className="recent-employees-list">
            {loading || error ? (
              <div className="loading-placeholder">{error ? 'Recent employees unavailable.' : 'Loading recent employees...'}</div>
            ) : !stats.recentEmployees || stats.recentEmployees.length === 0 ? (
              <div className="empty-sub-card">
                <p>No recent employees recorded yet.</p>
                <Link to="/add-employee" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
                  Add First Record
                </Link>
              </div>
            ) : (
              stats.recentEmployees.map((emp) => (
                <div key={emp.id} className="recent-employee-item">
                  <div className="recent-avatar">
                    {emp.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="recent-info">
                    <div className="recent-name">{emp.name}</div>
                    <div className="recent-email">{emp.email}</div>
                  </div>
                  <div className="recent-meta">
                    <span className={`dept-pill small dept-${(emp.department || 'general').toLowerCase().replace(/\s+/g, '-')}`}>
                      {emp.department || 'Unassigned'}
                    </span>
                    <span className="recent-salary">{emp.salary === null ? 'Not provided' : formatCurrency(emp.salary)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
