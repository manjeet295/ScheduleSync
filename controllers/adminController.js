import { collection,LeaveRequest } from '../models/config.js';
// Get all leave requests for admin panel
export const getAllLeaveRequests = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const leaves = await LeaveRequest.find({}).sort({ date: 1 });
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ message: 'Failed to fetch leave requests' });
  }
};
export const addScheduleItem = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/'); 
  }
  const { email, scheduleItem } = req.body;
  try {
    // Ensure date is present
    if (!scheduleItem.date) {
      return res.status(400).json({ message: 'Date required' });
    }
    // Validation: Past date allowed nahi hai
    const today = new Date();
    today.setHours(0,0,0,0);
    const jsDate = new Date(scheduleItem.date);
    jsDate.setHours(0,0,0,0);
    if (jsDate < today) {
      return res.status(400).json({ message: 'Past date pe lecture store nahi ho sakta.' });
    }
    // Day ko date se nikaal lo
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    scheduleItem.day = dayNames[jsDate.getDay()];
    const result = await collection.updateOne(
      { email: email.toLowerCase(), role: 'teacher' },
      { $push: { schedule: scheduleItem } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.redirect('/admin');
  } catch (error) {
    console.error("Error in addScheduleItem:", error);
    res.status(500).json({ message: 'Failed to add schedule' });
  }
};



// export const saveFullSchedule = async (req, res) => {
//   if (!req.session.user || req.session.user.role !== 'admin') {
//     return res.status(401).json({ message: 'Not authorized' });
//   }
//   const { email, schedule } = req.body;
//   try {
//     const user = await collection.findOne({ email: email.toLowerCase(), role: 'teacher' });
//     if (!user) return res.status(404).json({ message: "Teacher not found" });
//     // Overwrite the schedule array with the new schedule (no append, no duplicate)
//     user.schedule = schedule;
//     await user.save();
//     return res.json({ message: "Schedule saved successfully" });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Failed to save schedule" });
//   }
// };

export const getteacherdata = async (req, res) => {
  try {
    if(!req.session.user || req.session.user.role !== 'admin') {
      
      return res.redirect('/');
    }
    const teachers = await collection.find({ role: 'teacher' }, { name: 1, email: 1, schedule: 1, _id: 0 });
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve teachers' });
  }
};
export const freeTeachers = async (req, res) => {
  const { date, lectureNumber } = req.query;
  if (!date || !lectureNumber) return res.status(400).json({ message: 'Missing date or lectureNumber' });
  try {
    // Sabhi teachers nikaalo
    const teachers = await collection.find({ role: 'teacher' }, { name: 1, email: 1, schedule: 1 });
    // Date se day nikaal lo
    const jsDate = new Date(date);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[jsDate.getDay()];
    // Jo teachers is slot mein free hain, unko filter karo
    const freeTeachers = teachers.filter(t => {
      // Kya is teacher ka schedule mein is date, is lectureNumber pe koi lecture hai?
      return !t.schedule.find(s => {
        const sDate = new Date(s.date).toISOString();
        const reqDate = jsDate.toISOString();
        return sDate === reqDate && String(s.lectureNumber) === String(lectureNumber);
      });
    }).map(t => {
      // Workload: us din kitne lectures hain
      const lecturesToday = t.schedule.filter(s => {
        const sDate = new Date(s.date).toISOString();
        return sDate === jsDate.toISOString();
      }).length;
      return { name: t.name, email: t.email, lecturesToday };
    });
    // Kam workload wale upar
    freeTeachers.sort((a, b) => a.lecturesToday - b.lecturesToday);
    res.json(freeTeachers);
  } catch (err) {
      console.error('Free teachers error:', err);
      res.status(500).json({ message: 'Failed to fetch free teachers' });
    }
}


