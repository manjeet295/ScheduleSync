import express from 'express';
import { serveTeacherPage, getCurrentTeacher } from '../controllers/teacherController.js';
import { LeaveRequest, collection } from '../models/config.js';

const router = express.Router();

// API: Get current teacher info and schedule
router.get('/me', getCurrentTeacher);

// Serve Teacher Page
router.get('/', serveTeacherPage);

// POST /teacher/request-leave
router.post('/request-leave', async (req, res) => {
  try {
    const { date, reason } = req.body;

    // Validate input
    if (!date || !reason.trim()) {
      return res.status(400).json({ message: 'Date aur reason required hai.' });
    }

    // Get teacher info from session
    const teacher = req.session.user;
    console.log('LEAVE REQUEST SESSION:', teacher);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const leaveDoc = await LeaveRequest.insertOne({
      teacherId: teacher._id,
      teacherName: teacher.name,
      email: teacher.email,
      date,
      reason,
      status: 'Pending'
    });

    console.log('LEAVE REQUEST SAVED:', leaveDoc);

    res.status(200).json({ message: 'Leave request submitted.' });
  } catch (err) {
    console.error('LEAVE REQUEST ERROR:', err);
    res.status(500).json({ message: 'Failed to submit leave request.' });
  }
});

export default router;
