import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEmployeeDashboard } from '../services/api';

const EmployeeDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEmployeeDashboard();
      setDashboard(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <div className="form-loading-state"><div className="spinner-large" /><p>Loading your dashboard…</p></div>;
  if (error) return <div className="alert-banner-box alert-danger" role="alert">{error}<button className="btn btn-secondary" onClick={loadDashboard}>Retry</button></div>;
  if (!dashboard) return null;

  return (
    <section className="employee-portal-page fade-in">
      <header className="employee-portal-header">
        <div><span className="badge-welcome">EMPLOYEE PORTAL</span><h1>Welcome, {dashboard.employee.name}</h1><p>Your work profile, attendance, and assigned tasks.</p></div>
        <Link className="btn btn-primary" to="/my-attendance">Mark Attendance</Link>
      </header>
      <div className="employee-portal-metrics">
        <article className="employee-portal-card"><span>Today's attendance</span><strong>{dashboard.attendanceToday?.status || 'Not marked'}</strong><small>{dashboard.attendanceToday ? `Entry ${dashboard.attendanceToday.check_in} UTC` : 'Please record your attendance today.'}</small></article>
        <article className="employee-portal-card"><span>Total assigned tasks</span><strong>{dashboard.totalTasks}</strong><small>Tasks assigned to your account</small></article>
        {Object.entries(dashboard.taskSummary).map(([status, count]) => (
          <article className="employee-portal-card" key={status}><span>{status} tasks</span><strong>{count}</strong><small>Current assignments</small></article>
        ))}
      </div>
      <section className="dashboard-section-card">
        <div className="section-card-header"><div><h2 className="section-title">Recent assigned tasks</h2><p className="section-subtitle">Only tasks assigned to your employee account</p></div><Link to="/my-tasks" className="card-top-link">View all &rarr;</Link></div>
        {dashboard.recentTasks.length === 0 ? <div className="empty-sub-card"><p>You don't have any assigned tasks yet.</p></div> : (
          <div className="table-responsive"><table className="data-table"><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due date</th></tr></thead><tbody>
            {dashboard.recentTasks.map((task) => <tr key={task.id}><td>{task.title}</td><td>{task.status}</td><td>{task.priority}</td><td>{task.due_date?.slice(0, 10) || '—'}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </section>
  );
};

export default EmployeeDashboard;
