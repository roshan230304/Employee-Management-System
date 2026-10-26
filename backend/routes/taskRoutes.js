const express = require('express');
const router = express.Router();
const { getMyTasks, updateMyTaskStatus } = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, authorize('employee'), getMyTasks);
router.patch('/:id/status', authenticate, authorize('employee'), updateMyTaskStatus);

const { getAllTasks, getTaskById, createTask, updateTask, deleteTask } = require('../controllers/taskController');
router.use(authenticate, authorize('admin'));
router.route('/').get(getAllTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

module.exports = router;
