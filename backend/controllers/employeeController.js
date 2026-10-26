const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;

function validateEmployee(body, creating = true) {
  const { name, email, phone, department, salary, password } = body;
  const errors = {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name is required and must be 2-100 characters.';
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 150) {
    errors.email = 'A valid email address (up to 150 characters) is required.';
  }
  if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.trim().length > 15)) {
    errors.phone = 'Phone must be text with at most 15 characters.';
  }
  if (department !== undefined && department !== null && (typeof department !== 'string' || department.trim().length > 100)) {
    errors.department = 'Department must be text with at most 100 characters.';
  }
  if (salary !== undefined && salary !== null && salary !== '') {
    const parsedSalary = Number(salary);
    if (!Number.isFinite(parsedSalary) || parsedSalary < 0 || parsedSalary > 99999999.99 || Number(parsedSalary.toFixed(2)) !== parsedSalary) {
      errors.salary = 'Salary must be non-negative and have no more than two decimal places.';
    }
  }
  if (creating && (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > 72)) {
    errors.password = `Employee password must be ${MIN_PASSWORD_LENGTH}-72 characters.`;
  }
  return errors;
}

function employeeQuery(search = '') {
  const params = [];
  let whereClause = '';
  if (search) {
    whereClause = 'WHERE CAST(e.id AS CHAR) LIKE ? OR e.name LIKE ? OR e.email LIKE ? OR e.department LIKE ?';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  return { whereClause, params };
}

async function getAllEmployees(req, res) {
  try {
    const { whereClause, params } = employeeQuery(typeof req.query.search === 'string' ? req.query.search.trim() : '');
    const [rows] = await pool.query(
      `SELECT e.id, e.name, e.email, e.phone, e.department,
              CAST(e.salary AS DOUBLE) AS salary,
              (a.id IS NOT NULL) AS has_login
       FROM employees e
       LEFT JOIN user_accounts a ON a.employee_id = e.id
       ${whereClause}
       ORDER BY e.id DESC`,
      params
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[Employees] List failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve employees.' });
  }
}

async function getEmployeeById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.name, e.email, e.phone, e.department,
              CAST(e.salary AS DOUBLE) AS salary,
              (a.id IS NOT NULL) AS has_login
       FROM employees e
       LEFT JOIN user_accounts a ON a.employee_id = e.id
       WHERE e.id = ?`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: `Employee ${id} was not found.` });
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Employees] Read failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employee details.' });
  }
}

async function createEmployee(req, res) {
  const body = req.body || {};
  const errors = validateEmployee(body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Validation failed.', errors });

  const connection = await pool.getConnection();
  try {
    const passwordHash = await bcrypt.hash(body.password, 12);
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO employees (name, email, phone, department, salary)
       VALUES (?, ?, ?, ?, ?)`,
      [
        body.name.trim(),
        body.email.trim().toLowerCase(),
        body.phone?.trim() || null,
        body.department?.trim() || null,
        body.salary === '' || body.salary === undefined ? null : body.salary
      ]
    );
    await connection.query(
      `INSERT INTO user_accounts (username, password_hash, role, employee_id)
       VALUES (?, ?, 'employee', ?)`,
      [body.email.trim().toLowerCase(), passwordHash, result.insertId]
    );
    const [rows] = await connection.query(
      'SELECT id, name, email, phone, department, CAST(salary AS DOUBLE) AS salary FROM employees WHERE id = ?',
      [result.insertId]
    );
    await connection.commit();
    return res.status(201).json({ success: true, message: 'Employee and login account created.', data: rows[0] });
  } catch (error) {
    await connection.rollback();
    console.error('[Employees] Create failed:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.', errors: { email: 'Email is already registered.' } });
    }
    return res.status(500).json({ success: false, message: 'Failed to create employee and login account.' });
  } finally {
    connection.release();
  }
}

async function updateEmployee(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
  const body = req.body || {};
  const errors = validateEmployee(body, false);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Validation failed.', errors });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `UPDATE employees SET name = ?, email = ?, phone = ?, department = ?, salary = ?
       WHERE id = ?`,
      [
        body.name.trim(),
        body.email.trim().toLowerCase(),
        body.phone?.trim() || null,
        body.department?.trim() || null,
        body.salary === '' || body.salary === undefined ? null : body.salary,
        id
      ]
    );
    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Employee ${id} was not found.` });
    }
    await connection.query(
      `UPDATE user_accounts SET username = ? WHERE employee_id = ?`,
      [body.email.trim().toLowerCase(), id]
    );
    const [rows] = await connection.query(
      'SELECT id, name, email, phone, department, CAST(salary AS DOUBLE) AS salary FROM employees WHERE id = ?',
      [id]
    );
    await connection.commit();
    return res.status(200).json({ success: true, message: 'Employee updated.', data: rows[0] });
  } catch (error) {
    await connection.rollback();
    console.error('[Employees] Update failed:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Another employee already uses this email.', errors: { email: 'Email is already registered.' } });
    }
    return res.status(500).json({ success: false, message: 'Failed to update employee.' });
  } finally {
    connection.release();
  }
}

async function resetEmployeePassword(req, res) {
  const id = Number(req.params.id);
  const { password } = req.body || {};
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: `Password must be ${MIN_PASSWORD_LENGTH}-72 characters.` });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [employees] = await connection.query('SELECT id, email FROM employees WHERE id = ? FOR UPDATE', [id]);
    if (!employees[0]) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: `Employee ${id} was not found.` });
    }
    const username = employees[0].email.toLowerCase();
    const [conflicts] = await connection.query(
      'SELECT id, employee_id, role FROM user_accounts WHERE username = ? FOR UPDATE',
      [username]
    );
    if (conflicts[0] && (conflicts[0].role !== 'employee' || Number(conflicts[0].employee_id) !== id)) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'This email is already used by another login account.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    if (conflicts[0]) {
      await connection.query('UPDATE user_accounts SET password_hash = ? WHERE id = ?', [passwordHash, conflicts[0].id]);
    } else {
      await connection.query(
        `INSERT INTO user_accounts (username, password_hash, role, employee_id)
         VALUES (?, ?, 'employee', ?)`,
        [username, passwordHash, id]
      );
    }
    await connection.commit();
    return res.status(200).json({ success: true, message: 'Employee password reset successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('[Employees] Password reset failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset employee password.' });
  } finally {
    connection.release();
  }
}

async function deleteEmployee(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
  try {
    const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: `Employee ${id} was not found.` });
    return res.status(200).json({ success: true, message: 'Employee and linked account deleted; existing task/attendance cascade behavior is preserved.' });
  } catch (error) {
    console.error('[Employees] Delete failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete employee.' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [[metrics]] = await pool.query(`
      SELECT COUNT(*) AS totalEmployees,
             COALESCE(SUM(salary), 0) AS totalPayroll,
             COALESCE(AVG(salary), 0) AS avgSalary
      FROM employees
    `);
    const [departments] = await pool.query(`
      SELECT COALESCE(NULLIF(department, ''), 'Unassigned') AS department,
             COUNT(*) AS count, COALESCE(AVG(salary), 0) AS avgSalary
      FROM employees GROUP BY department ORDER BY count DESC
    `);
    const [recentEmployees] = await pool.query(`
      SELECT id, name, email, phone, department, CAST(salary AS DOUBLE) AS salary
      FROM employees ORDER BY id DESC LIMIT 5
    `);
    const [attendanceRows] = await pool.query(
      'SELECT status, COUNT(*) AS cnt FROM attendance WHERE attendance_date = UTC_DATE() GROUP BY status'
    );
    const attendanceSummary = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    attendanceRows.forEach((row) => { attendanceSummary[row.status] = Number(row.cnt); });
    const [taskRows] = await pool.query('SELECT status, COUNT(*) AS cnt FROM tasks GROUP BY status');
    const taskSummary = { Pending: 0, 'In Progress': 0, Completed: 0 };
    taskRows.forEach((row) => { taskSummary[row.status] = Number(row.cnt); });
    const [[overdue]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM tasks WHERE due_date < UTC_DATE() AND status <> 'Completed'`
    );
    const [[unmarked]] = await pool.query(`
      SELECT COUNT(*) AS cnt
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.attendance_date = UTC_DATE()
      WHERE a.id IS NULL OR a.status <> 'Present'
    `);
    const [[totalTasks]] = await pool.query('SELECT COUNT(*) AS cnt FROM tasks');
    const [recentAttendance] = await pool.query(`
      SELECT a.id, a.employee_id, e.name AS employee_name, e.department,
             a.attendance_date, a.status, a.check_in
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ORDER BY a.attendance_date DESC, a.id DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalEmployees: Number(metrics.totalEmployees),
        totalPayroll: Number(metrics.totalPayroll),
        avgSalary: Number(metrics.avgSalary),
        departmentStats: departments.map((row) => ({
          department: row.department,
          count: Number(row.count),
          avgSalary: Number(row.avgSalary)
        })),
        recentEmployees,
        attendanceSummary,
        employeesNotMarkedPresentToday: Number(unmarked.cnt),
        taskSummary,
        totalTasks: Number(totalTasks.cnt),
        overdueTasks: Number(overdue.cnt),
        recentAttendance
      }
    });
  } catch (error) {
    console.error('[Dashboard] Admin statistics failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute dashboard statistics.' });
  }
}

async function getEmployeeDashboard(req, res) {
  try {
    const employeeId = req.user.employeeId;
    const [[employeeRows], [attendanceRows], [taskRows], [taskCounts]] = await Promise.all([
      pool.query(
        `SELECT id, name, email, phone, department, CAST(salary AS DOUBLE) AS salary
         FROM employees WHERE id = ?`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, attendance_date, status, DATE_FORMAT(check_in, '%H:%i:%s') AS check_in
         FROM attendance WHERE employee_id = ? AND attendance_date = UTC_DATE() LIMIT 1`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, title, description, status, priority, assigned_date, due_date
         FROM tasks WHERE employee_id = ? ORDER BY id DESC LIMIT 5`,
        [employeeId]
      ),
      pool.query('SELECT status, COUNT(*) AS cnt FROM tasks WHERE employee_id = ? GROUP BY status', [employeeId])
    ]);
    if (!employeeRows[0]) return res.status(404).json({ success: false, message: 'Employee profile was not found.' });
    const taskSummary = { Pending: 0, 'In Progress': 0, Completed: 0 };
    taskCounts.forEach((row) => { taskSummary[row.status] = Number(row.cnt); });
    return res.status(200).json({
      success: true,
      data: {
        employee: employeeRows[0],
        attendanceToday: attendanceRows[0] || null,
        taskSummary,
        totalTasks: Object.values(taskSummary).reduce((total, count) => total + count, 0),
        recentTasks: taskRows
      }
    });
  } catch (error) {
    console.error('[Dashboard] Employee statistics failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to load your dashboard.' });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee,
  getDashboardStats,
  getEmployeeDashboard
};
