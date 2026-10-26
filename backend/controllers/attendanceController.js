const pool = require('../config/db');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getAllAttendance(req, res) {
  const { employee_id: employeeId, status, date } = req.query;
  const conditions = [];
  const params = [];
  if (employeeId) {
    if (!Number.isSafeInteger(Number(employeeId)) || Number(employeeId) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID filter.' });
    }
    conditions.push('a.employee_id = ?');
    params.push(Number(employeeId));
  }
  if (status) {
    if (!['Present', 'Absent', 'Late', 'Leave'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance status filter.' });
    }
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (date) {
    if (!isValidDate(date)) return res.status(400).json({ success: false, message: 'Invalid attendance date filter.' });
    conditions.push('a.attendance_date = ?');
    params.push(date);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.employee_id, e.name AS employee_name, e.department,
              a.attendance_date, a.status, DATE_FORMAT(a.check_in, '%H:%i:%s') AS check_in
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       ${whereClause}
       ORDER BY a.attendance_date DESC, a.id DESC`,
      params
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows, timezone: 'UTC' });
  } catch (error) {
    console.error('[Attendance] Admin list failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance records.' });
  }
}

async function getTodayAttendance(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT e.id AS employee_id, e.name AS employee_name, e.department,
             a.id AS attendance_id, a.attendance_date, a.status,
             DATE_FORMAT(a.check_in, '%H:%i:%s') AS check_in
      FROM employees e
      LEFT JOIN attendance a
        ON a.employee_id = e.id AND a.attendance_date = UTC_DATE()
      ORDER BY e.name
    `);
    const present = rows.filter((row) => row.status === 'Present').length;
    return res.status(200).json({
      success: true,
      data: {
        date: new Date().toISOString().slice(0, 10),
        timezone: 'UTC',
        present,
        notMarkedPresent: rows.length - present,
        employees: rows
      }
    });
  } catch (error) {
    console.error("[Attendance] Today's attendance failed:", error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve today’s attendance.' });
  }
}

async function getMyAttendance(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, attendance_date, status,
              DATE_FORMAT(check_in, '%H:%i:%s') AS check_in
       FROM attendance
       WHERE employee_id = ?
       ORDER BY attendance_date DESC, id DESC`,
      [req.user.employeeId]
    );
    return res.status(200).json({ success: true, count: rows.length, data: rows, timezone: 'UTC' });
  } catch (error) {
    console.error('[Attendance] Employee history failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your attendance history.' });
  }
}

async function markMyAttendance(req, res) {
  try {
    const [result] = await pool.query(
      `INSERT INTO attendance (employee_id, attendance_date, status, check_in)
       VALUES (?, UTC_DATE(), 'Present', UTC_TIME())`,
      [req.user.employeeId]
    );
    const [rows] = await pool.query(
      `SELECT id, attendance_date, status,
              DATE_FORMAT(check_in, '%H:%i:%s') AS check_in
       FROM attendance WHERE id = ? AND employee_id = ?`,
      [result.insertId, req.user.employeeId]
    );
    return res.status(201).json({
      success: true,
      message: 'Attendance recorded using the current server UTC time.',
      timezone: 'UTC',
      data: rows[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      const [existing] = await pool.query(
        `SELECT id, attendance_date, status,
                DATE_FORMAT(check_in, '%H:%i:%s') AS check_in
         FROM attendance
         WHERE employee_id = ? AND attendance_date = UTC_DATE()
         LIMIT 1`,
        [req.user.employeeId]
      );
      return res.status(409).json({
        success: false,
        message: 'Attendance has already been marked for today.',
        timezone: 'UTC',
        data: existing[0] || null
      });
    }
    console.error('[Attendance] Employee mark failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  }
}

module.exports = { getAllAttendance, getTodayAttendance, getMyAttendance, markMyAttendance };
