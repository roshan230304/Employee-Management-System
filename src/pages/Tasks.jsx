import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, getEmployees, createTask, updateTask, deleteTask } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_COLORS = {
  'Pending': '#f59e0b',
  'In Progress': '#3b82f6',
  'Completed': '#10b981'
};

const PRIORITY_COLORS = {
  'Low': '#6b7280',
  'Medium': '#f59e0b',
  'High': '#ef4444'
};

const getLocalDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const EMPTY_FORM = {
  employee_id: '',
  title: '',
  description: '',
  status: 'Pending',
  priority: 'Medium',
  assigned_date: getLocalDate(),
  due_date: ''
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Delete modal
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksRes, empRes] = await Promise.all([getTasks(), getEmployees()]);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (empRes.success) setEmployees(empRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAddForm = () => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, assigned_date: getLocalDate() });
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setForm({
      employee_id: String(task.employee_id),
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_date: task.assigned_date ? task.assigned_date.slice(0, 10) : '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : ''
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.employee_id) errors.employee_id = 'Please select an employee.';
    if (!form.title.trim()) errors.title = 'Task title is required.';
    if (!form.assigned_date) errors.assigned_date = 'Assigned date is required.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      const payload = { ...form, employee_id: Number(form.employee_id) };
      let res;
      if (editingTask) {
        res = await updateTask(editingTask.id, payload);
        showSuccess(`Task "${form.title}" updated successfully.`);
      } else {
        res = await createTask(payload);
        showSuccess(`Task "${form.title}" created successfully.`);
      }
      if (res.success) {
        setShowForm(false);
        await loadData();
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      if (Object.keys(serverErrors).length > 0) {
        setFormErrors(serverErrors);
      } else {
        setError(err.response?.data?.message || 'Operation failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteTask(taskToDelete.id);
      if (res.success) {
        showSuccess(`Task "${taskToDelete.title}" deleted successfully.`);
        await loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = !searchTerm ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchPriority = !filterPriority || t.priority === filterPriority;
    const matchEmployee = !filterEmployee || String(t.employee_id) === filterEmployee;
    const matchDueDate = !filterDueDate || String(t.due_date || '').slice(0, 10) === filterDueDate;
    return matchSearch && matchStatus && matchPriority && matchEmployee && matchDueDate;
  });

  const today = getLocalDate();

  return (
    <div className="tasks-page fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-heading">Task Management</h1>
          <p className="page-sub-heading">Manage and track all employee tasks from MySQL</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary action-refresh-btn" onClick={loadData} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'spinning' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
          <button className="btn btn-primary action-add-btn" onClick={openAddForm}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert-banner-box alert-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg"><polyline points="20 6 9 17 4 12" /></svg>
          <div className="alert-text-wrap"><strong>Success:</strong> {successMessage}</div>
          <button className="alert-dismiss-btn" onClick={() => setSuccessMessage('')}>&times;</button>
        </div>
      )}
      {error && (
        <div className="alert-banner-box alert-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <div className="alert-text-wrap"><strong>Error:</strong> {error}</div>
          <button className="alert-dismiss-btn" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          className="form-input filter-search-input"
          placeholder="Search by title or employee..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select className="form-select filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <select className="form-select filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select className="form-select filter-select" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
          <option value="">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
          ))}
        </select>
        <input type="date" aria-label="Filter by due date" className="form-input filter-date-input" value={filterDueDate} onChange={e => setFilterDueDate(e.target.value)} />
        {(filterStatus || filterPriority || filterEmployee || filterDueDate || searchTerm) && (
          <button className="btn btn-ghost" onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterEmployee(''); setFilterDueDate(''); setSearchTerm(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Tasks Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-placeholder">Loading tasks from MySQL...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-sub-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 1rem', display: 'block', opacity: 0.4 }}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <p>{tasks.length === 0 ? 'No tasks found. Click "Add Task" to create the first one.' : 'No tasks match your filters.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const isOverdue = task.due_date && task.due_date.slice(0, 10) < today && task.status !== 'Completed';
                  return (
                    <tr key={task.id} className={isOverdue ? 'row-overdue' : ''}>
                      <td className="td-id">#{task.id}</td>
                      <td>
                        <div className="td-title-wrap">
                          <span className="td-title">{task.title}</span>
                          {isOverdue && <span className="badge badge-overdue">Overdue</span>}
                          {task.description && <span className="td-description">{task.description}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="td-employee-name">{task.employee_name || '—'}</span>
                        {task.department && <span className="td-dept-small">{task.department}</span>}
                      </td>
                      <td>
                        <span className="status-pill" style={{ '--status-color': STATUS_COLORS[task.status] || '#6b7280' }}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <span className="priority-pill" style={{ '--priority-color': PRIORITY_COLORS[task.priority] || '#6b7280' }}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="td-date">{task.assigned_date ? task.assigned_date.slice(0, 10) : '—'}</td>
                      <td className="td-date" style={{ color: isOverdue ? '#ef4444' : 'inherit' }}>
                        {task.due_date ? task.due_date.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <div className="action-btn-group">
                          <button className="btn-icon btn-edit" onClick={() => openEditForm(task)} title="Edit task">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => setTaskToDelete(task)} title="Delete task">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div className="table-footer-info">
            Showing {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="task-employee">
                  Assign To Employee <span className="required-star">*</span>
                </label>
                <select
                  id="task-employee"
                  name="employee_id"
                  className={`form-select ${formErrors.employee_id ? 'input-error' : ''}`}
                  value={form.employee_id}
                  onChange={handleFormChange}
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'No Dept'})</option>
                  ))}
                </select>
                {formErrors.employee_id && <span className="field-error-msg">{formErrors.employee_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-title">
                  Task Title <span className="required-star">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  name="title"
                  className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={handleFormChange}
                  maxLength={150}
                />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  name="description"
                  className="form-textarea"
                  placeholder="Optional task description..."
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-status">Status</label>
                  <select id="task-status" name="status" className="form-select" value={form.status} onChange={handleFormChange}>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" name="priority" className="form-select" value={form.priority} onChange={handleFormChange}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-assigned">
                    Assigned Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="task-assigned"
                    type="date"
                    name="assigned_date"
                    className={`form-input ${formErrors.assigned_date ? 'input-error' : ''}`}
                    value={form.assigned_date}
                    onChange={handleFormChange}
                  />
                  {formErrors.assigned_date && <span className="field-error-msg">{formErrors.assigned_date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    name="due_date"
                    className="form-input"
                    value={form.due_date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (editingTask ? 'Updating...' : 'Creating...') : (editingTask ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {taskToDelete && (
        <ConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete task "${taskToDelete.title}"? This cannot be undone.`}
          confirmText={deleting ? 'Deleting...' : 'Yes, Delete Task'}
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
};

export default Tasks;
