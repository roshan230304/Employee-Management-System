const pool = require('../config/db');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * GET /api/tasks
 * Returns all tasks joined with employee name. Supports ?employee_id, ?status, ?priority filters.
 */
async function getAllTasks(req, res) {
  try {
    const { employee_id, status, priority, due_date } = req.query;
    const conditions = [];
    const params = [];

    if (employee_id) {
      if (!Number.isSafeInteger(Number(employee_id)) || Number(employee_id) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid employee ID filter.' });
      }
      conditions.push('t.employee_id = ?');
      params.push(Number(employee_id));
    }
    if (status) {
      if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid task status filter.' });
      }
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      if (!['Low', 'Medium', 'High'].includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid task priority filter.' });
      }
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (due_date) {
      if (!isValidDate(due_date)) return res.status(400).json({ success: false, message: 'Invalid due date filter.' });
      conditions.push('t.due_date = ?');
      params.push(due_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT t.id, t.employee_id, e.name AS employee_name, e.department,
              t.title, t.description, t.status, t.priority,
              t.assigned_date, t.due_date, t.completed_at
       FROM tasks t
       LEFT JOIN employees e ON t.employee_id = e.id
       ${whereClause}
       ORDER BY t.id DESC`,
      params
    );

    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[Error] getAllTasks:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tasks.' });
  }
}

/**
 * GET /api/tasks/:id
 */
async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const [rows] = await pool.query(
      `SELECT t.id, t.employee_id, e.name AS employee_name, e.department,
              t.title, t.description, t.status, t.priority,
              t.assigned_date, t.due_date, t.completed_at
       FROM tasks t
       LEFT JOIN employees e ON t.employee_id = e.id
       WHERE t.id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Task with ID ${id} not found.` });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Error] getTaskById:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch task.' });
  }
}

/**
 * POST /api/tasks
 */
async function createTask(req, res) {
  try {
    const { employee_id, title, description, status, priority, assigned_date, due_date } = req.body;

    const errors = {};
    if (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0) errors.employee_id = 'A valid employee must be selected.';
    if (typeof title !== 'string' || !title.trim()) errors.title = 'Task title is required.';
    else if (title.trim().length > 150) errors.title = 'Title cannot exceed 150 characters.';
    if (!isValidDate(assigned_date)) errors.assigned_date = 'A valid assigned date is required.';
    if (description !== undefined && description !== null && typeof description !== 'string') errors.description = 'Description must be text.';
    if (due_date && !isValidDate(due_date)) errors.due_date = 'Due date must be a valid date.';

    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    const validPriorities = ['Low', 'Medium', 'High'];
    if (status && !validStatuses.includes(status)) errors.status = 'Invalid status value.';
    if (priority && !validPriorities.includes(priority)) errors.priority = 'Invalid priority value.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    const [emp] = await pool.query('SELECT id FROM employees WHERE id = ?', [Number(employee_id)]);
    if (emp.length === 0) {
      return res.status(404).json({ success: false, message: `Employee with ID ${employee_id} not found.` });
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (employee_id, title, description, status, priority, assigned_date, due_date, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(employee_id),
        title.trim(),
        description ? description.trim() : null,
        status || 'Pending',
        priority || 'Medium',
        assigned_date,
        due_date || null,
        status === 'Completed' ? new Date() : null
      ]
    );

    const [newTask] = await pool.query(
      `SELECT t.id, t.employee_id, e.name AS employee_name, t.title, t.description,
              t.status, t.priority, t.assigned_date, t.due_date, t.completed_at
       FROM tasks t LEFT JOIN employees e ON t.employee_id = e.id WHERE t.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Task created successfully.', data: newTask[0] });
  } catch (error) {
    console.error('[Error] createTask:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
}

/**
 * PUT /api/tasks/:id
 */
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const [existing] = await pool.query('SELECT id FROM tasks WHERE id = ?', [Number(id)]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Task with ID ${id} not found.` });
    }

    const { employee_id, title, description, status, priority, assigned_date, due_date } = req.body;

    const errors = {};
    if (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0) errors.employee_id = 'A valid employee must be selected.';
    if (typeof title !== 'string' || !title.trim()) errors.title = 'Task title is required.';
    else if (title.trim().length > 150) errors.title = 'Title cannot exceed 150 characters.';
    if (!isValidDate(assigned_date)) errors.assigned_date = 'A valid assigned date is required.';
    if (description !== undefined && description !== null && typeof description !== 'string') errors.description = 'Description must be text.';
    if (due_date && !isValidDate(due_date)) errors.due_date = 'Due date must be a valid date.';

    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    const validPriorities = ['Low', 'Medium', 'High'];
    if (status && !validStatuses.includes(status)) errors.status = 'Invalid status value.';
    if (priority && !validPriorities.includes(priority)) errors.priority = 'Invalid priority value.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }

    let completedAt = null;
    if (status === 'Completed') {
      const [cur] = await pool.query('SELECT status, completed_at FROM tasks WHERE id = ?', [Number(id)]);
      completedAt = cur[0].status === 'Completed' ? cur[0].completed_at : new Date();
    }

    await pool.query(
      `UPDATE tasks SET employee_id=?, title=?, description=?, status=?, priority=?, 
       assigned_date=?, due_date=?, completed_at=? WHERE id=?`,
      [
        Number(employee_id),
        title.trim(),
        description ? description.trim() : null,
        status || 'Pending',
        priority || 'Medium',
        assigned_date,
        due_date || null,
        completedAt,
        Number(id)
      ]
    );

    const [updated] = await pool.query(
      `SELECT t.id, t.employee_id, e.name AS employee_name, t.title, t.description,
              t.status, t.priority, t.assigned_date, t.due_date, t.completed_at
       FROM tasks t LEFT JOIN employees e ON t.employee_id = e.id WHERE t.id = ?`,
      [Number(id)]
    );

    return res.status(200).json({ success: true, message: 'Task updated successfully.', data: updated[0] });
  } catch (error) {
    console.error('[Error] updateTask:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
}

/**
 * DELETE /api/tasks/:id
 */
async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }

    const [existing] = await pool.query('SELECT id, title FROM tasks WHERE id = ?', [Number(id)]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Task with ID ${id} not found.` });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [Number(id)]);

    return res.status(200).json({
      success: true,
      message: `Task "${existing[0].title}" (ID: ${id}) was deleted successfully.`
    });
  } catch (error) {
    console.error('[Error] deleteTask:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
}

async function getMyTasks(req, res) {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status filter.' });
  }
  try {
    const params = [req.user.employeeId];
    const statusFilter = status ? 'AND status = ?' : '';
    if (status) params.push(status);
    const [rows] = await pool.query(
      `SELECT id, title, description, status, priority, assigned_date, due_date
       FROM tasks WHERE employee_id = ? ${statusFilter} ORDER BY id DESC`,
      params
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[Tasks] Employee list failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your tasks.' });
  }
}

async function updateMyTaskStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid task ID.' });
  if (!['In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Task status must be In Progress or Completed.' });
  }
  try {
    const [existing] = await pool.query(
      'SELECT status FROM tasks WHERE id = ? AND employee_id = ?',
      [id, req.user.employeeId]
    );
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Task was not found for your account.' });
    }
    if (existing[0].status === 'Completed') {
      return res.status(409).json({ success: false, message: 'Completed tasks cannot be reopened.' });
    }
    await pool.query(
      `UPDATE tasks
       SET status = ?,
           completed_at = CASE
             WHEN ? = 'Completed' THEN COALESCE(completed_at, UTC_TIMESTAMP())
             ELSE NULL
           END
       WHERE id = ? AND employee_id = ? AND status <> 'Completed'`,
      [status, status, id, req.user.employeeId]
    );
    const [rows] = await pool.query(
      `SELECT id, title, description, status, priority, assigned_date, due_date
       FROM tasks WHERE id = ? AND employee_id = ?`,
      [id, req.user.employeeId]
    );
    return res.status(200).json({ success: true, message: 'Task status updated.', data: rows[0] });
  } catch (error) {
    console.error('[Tasks] Employee status update failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getMyTasks, updateMyTaskStatus };
