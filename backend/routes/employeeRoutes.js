const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee
} = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

// /api/employees
router.route('/')
  .get(getAllEmployees)
  .post(createEmployee);

// /api/employees/:id
router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(deleteEmployee);
router.post('/:id/reset-password', resetEmployeePassword);

module.exports = router;
