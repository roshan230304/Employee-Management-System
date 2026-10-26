const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');
const { getDashboardStats, getEmployeeDashboard } = require('./controllers/employeeController');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Body parser middleware
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging in development
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
  }
  return next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date().toISOString(), service: 'Employee Management API' });
});

app.use('/api/auth', authRoutes);

app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/dashboard/admin', authenticate, authorize('admin'), getDashboardStats);
app.get('/api/dashboard/employee', authenticate, authorize('employee'), getEmployeeDashboard);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
  }
  if (typeof process.env.JWT_SECRET !== 'string' || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set in backend/.env and contain at least 32 characters.');
  }
  await pool.verifyDatabaseSchema();
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT);
    server.once('error', reject);
    server.once('listening', resolve);
  });
  console.log(`Employee Management API listening at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}

startServer().catch(async (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[Startup Error] Port ${PORT} is already in use. Stop the identified StaffSync server or set a free PORT in backend/.env. No process was stopped.`);
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('[Startup Error] MySQL rejected the configured credentials. Check DB_USER and DB_PASSWORD in backend/.env.');
  } else if (error.code === 'ER_BAD_DB_ERROR') {
    console.error(`[Startup Error] MySQL database "${process.env.DB_NAME || 'react_db'}" does not exist or is unavailable. Select the existing database in backend/.env; the server will not create it.`);
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    console.error('[Startup Error] Cannot reach MySQL. Start MySQL and check DB_HOST and DB_PORT in backend/.env.');
  } else {
    console.error('[Startup Error] Could not start the API:', error.message);
  }
  process.exitCode = 1;
  await pool.end();
});
