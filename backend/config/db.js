const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'react_db';

// Create MySQL connection pool with parameterized support
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  timezone: 'Z',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function verifyDatabaseSchema() {
  const connection = await pool.getConnection();
  try {
    const requiredColumns = {
      employees: ['id', 'name', 'email', 'phone', 'department', 'salary'],
      tasks: ['id', 'employee_id', 'title', 'description', 'status', 'priority', 'assigned_date', 'due_date', 'completed_at'],
      attendance: ['id', 'employee_id', 'attendance_date', 'status', 'check_in', 'check_out'],
      user_accounts: ['id', 'username', 'password_hash', 'role', 'employee_id', 'created_at']
    };
    const [rows] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN (?, ?, ?, ?)`,
      Object.keys(requiredColumns)
    );
    const existingTables = new Set(rows.map(({ TABLE_NAME }) => TABLE_NAME));
    const missingTables = Object.keys(requiredColumns).filter((table) => !existingTables.has(table));
    if (missingTables.length > 0) {
      const migrationNote = missingTables.includes('user_accounts')
        ? ' Apply backend/migrations/001_user_accounts.sql to the existing react_db database.'
        : '';
      throw new Error(`Database schema is missing required tables: ${missingTables.join(', ')}.${migrationNote} Existing business tables are never created automatically.`);
    }
    const availableColumns = new Map();
    rows.forEach(({ TABLE_NAME, COLUMN_NAME }) => {
      if (!availableColumns.has(TABLE_NAME)) availableColumns.set(TABLE_NAME, new Set());
      availableColumns.get(TABLE_NAME).add(COLUMN_NAME);
    });

    const missing = Object.entries(requiredColumns).flatMap(([table, columns]) =>
      columns.filter((column) => !availableColumns.get(table)?.has(column)).map((column) => `${table}.${column}`)
    );
    if (missing.length > 0) {
      throw new Error(`Database schema is missing required columns: ${missing.join(', ')}. No existing tables were modified.`);
    }

    const [attendanceIndexes] = await connection.query(
      `SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS indexed_columns
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND NON_UNIQUE = 0
       GROUP BY INDEX_NAME`
    );
    if (!attendanceIndexes.some((index) => index.indexed_columns === 'employee_id,attendance_date')) {
      throw new Error('attendance requires a unique index on (employee_id, attendance_date) to prevent duplicate daily entries.');
    }

    const [foreignKeys] = await connection.query(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('tasks', 'attendance', 'user_accounts')
         AND REFERENCED_COLUMN_NAME IS NOT NULL`
    );
    const requiredForeignKeys = [
      ['tasks', 'employee_id', 'employees', 'id'],
      ['attendance', 'employee_id', 'employees', 'id'],
      ['user_accounts', 'employee_id', 'employees', 'id']
    ];
    const missingForeignKeys = requiredForeignKeys.filter(([table, column, referencedTable, referencedColumn]) =>
      !foreignKeys.some((key) => key.TABLE_NAME === table && key.COLUMN_NAME === column &&
        key.REFERENCED_TABLE_NAME === referencedTable && key.REFERENCED_COLUMN_NAME === referencedColumn)
    );
    if (missingForeignKeys.length) {
      throw new Error(`Database is missing required employee foreign keys: ${missingForeignKeys.map(([table, column]) => `${table}.${column}`).join(', ')}`);
    }

    console.log(`[Database] Connected to "${DB_NAME}" and verified required tables.`);
  } finally {
    connection.release();
  }
}

pool.verifyDatabaseSchema = verifyDatabaseSchema;

module.exports = pool;
