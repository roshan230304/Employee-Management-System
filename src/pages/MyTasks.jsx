import React, { useCallback, useEffect, useState } from 'react';
import { getMyTasks, updateMyTaskStatus } from '../services/api';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyTasks(statusFilter ? { status: statusFilter } : {});
      setTasks(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your tasks.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const changeStatus = async (task, status) => {
    setUpdatingId(task.id);
    setError('');
    setSuccess('');
    try {
      const response = await updateMyTaskStatus(task.id, status);
      setSuccess(response.message);
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this task.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="employee-portal-page fade-in">
      <header className="page-header-row"><div><h1 className="page-main-heading">My Tasks</h1><p className="page-sub-heading">Tasks assigned to your account only.</p></div>
        <select className="form-select filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter tasks by status">
          <option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option>
        </select>
      </header>
      {error && <div className="alert-banner-box alert-danger" role="alert">{error}</div>}
      {success && <div className="alert-banner-box alert-success" role="status">{success}</div>}
      <div className="employee-task-list">
        {loading ? <div className="loading-placeholder">Loading your assigned tasks…</div> : tasks.length === 0 ? <div className="empty-sub-card"><p>No tasks match this filter.</p></div> : tasks.map((task) => (
          <article className="employee-task-card" key={task.id}>
            <div className="employee-task-card-heading"><div><h2>{task.title}</h2><p>{task.description || 'No description provided.'}</p></div><span className="status-pill">{task.status}</span></div>
            <dl className="employee-task-meta"><div><dt>Priority</dt><dd>{task.priority}</dd></div><div><dt>Assigned</dt><dd>{task.assigned_date?.slice(0, 10) || '—'}</dd></div><div><dt>Due</dt><dd>{task.due_date?.slice(0, 10) || '—'}</dd></div></dl>
            {task.status !== 'Completed' && <div className="employee-task-actions">
              {task.status === 'Pending' && <button className="btn btn-secondary" disabled={updatingId === task.id} onClick={() => changeStatus(task, 'In Progress')}>Start task</button>}
              <button className="btn btn-primary" disabled={updatingId === task.id} onClick={() => changeStatus(task, 'Completed')}>{updatingId === task.id ? 'Saving…' : 'Mark completed'}</button>
            </div>}
          </article>
        ))}
      </div>
    </section>
  );
};

export default MyTasks;
