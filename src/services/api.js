import axios from 'axios';

// Base API URL pointing to the Node.js Express backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000
});

export const login = async (credentials) => (await api.post('/auth/login', credentials)).data;
export const logout = async () => (await api.post('/auth/logout')).data;
export const getCurrentUser = async () => (await api.get('/auth/me')).data;
export const getEmployeeDashboard = async () => (await api.get('/dashboard/employee')).data;
export const getAdminDashboard = async () => (await api.get('/dashboard/admin')).data;
export const getMyTasks = async (filters = {}) => (await api.get('/tasks/my', { params: filters })).data;
export const updateMyTaskStatus = async (id, status) => (await api.patch(`/tasks/${id}/status`, { status })).data;
export const getMyAttendance = async () => (await api.get('/attendance/my')).data;
export const markMyAttendance = async () => (await api.post('/attendance/mark')).data;
export const getTodayAttendance = async () => (await api.get('/attendance/today')).data;

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────

/** Retrieve all employees from MySQL */
export const getEmployees = async () => {
  const response = await api.get('/employees');
  return response.data;
};

/** Retrieve a single employee by ID */
export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

/** Add a new employee */
export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

/** Update an existing employee */
export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

/** Delete an employee */
export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};
export const resetEmployeePassword = async (id, password) => {
  const response = await api.post(`/employees/${id}/reset-password`, { password });
  return response.data;
};

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────

/**
 * Get all tasks with optional filters
 * @param {Object} filters - { employee_id, status, priority }
 */
export const getTasks = async (filters = {}) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data;
};

/** Get a single task by ID */
export const getTaskById = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

/** Create a new task */
export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

/** Update an existing task */
export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

/** Delete a task */
export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────

/**
 * Get all attendance records with optional filters
 * @param {Object} filters - { employee_id, status, date }
 */
export const getAttendance = async (filters = {}) => {
  const response = await api.get('/attendance', { params: filters });
  return response.data;
};

/** Mark attendance for an employee */
export const createAttendance = async (attendanceData) => {
  const response = await api.post('/attendance', attendanceData);
  return response.data;
};

/** Update an attendance record */
export const updateAttendance = async (id, attendanceData) => {
  const response = await api.put(`/attendance/${id}`, attendanceData);
  return response.data;
};

/** Delete an attendance record */
export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/** Retrieve aggregated dashboard statistics */
export const getDashboardStats = async () => {
  return getAdminDashboard();
};

export default api;
