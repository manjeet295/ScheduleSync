import { collection, LeaveRequest } from '../models/config.js';

// Returns the logged-in teacher's info and schedule
export const getCurrentTeacher = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'teacher') {
    res.redirect('/');
  }
  try {
    const teacher = await collection.findOne(
      { email: req.session.user.email, role: 'teacher' },
      { name: 1, email: 1, role: 1, schedule: 1, _id: 0 }
    );
    if(!teacher) return res.status(404).json({ message: 'Teacher not found' });


    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch teacher data' });
  }
};
export const serveTeacherPage = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'teacher') {
    return res.redirect('/');
  }
  res.render('teacher');
};




