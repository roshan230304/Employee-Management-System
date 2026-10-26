const express = require('express');
const router = express.Router();
const { getAllAttendance, getTodayAttendance, getMyAttendance, markMyAttendance } = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, authorize('employee'), getMyAttendance);
router.post('/mark', authenticate, authorize('employee'), markMyAttendance);
router.use(authenticate, authorize('admin'));
router.get('/today', getTodayAttendance);
router.get('/', getAllAttendance);

module.exports = router;
