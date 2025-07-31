import express from 'express';
import {collection,LeaveRequest} from '../models/config.js';
import {
  addScheduleItem,
  // saveFullSchedule,
  getteacherdata,
  freeTeachers,
  getAllLeaveRequests
} from '../controllers/adminController.js';

const router = express.Router();

// Free teachers nikalne ka route (adjustment ke liye)

//  Leave request ko delete karne ka route
router.delete('/delete-leave/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await LeaveRequest.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete leave request' });
  }
});

router.get('/free-teachers', freeTeachers);
  





// Sabhi teachers ke leave requests admin ko dikhane ke liye

router.get('/leave-requests', getAllLeaveRequests);


// Leave request par action lene ke liye

router.post('/leave-action', async (req, res) => {
  const { id, status, substituteEmail, date, lectureNumber } = req.body; // adjustment info
  try {
    let update = { status };
    if (status === 'Adjusted' && substituteEmail) {
      update.substituteEmail = substituteEmail;
      update.adjustmentDate = date;
      update.adjustmentLectureNumber = lectureNumber;
      //  Pehle original teacher ke schedule se lecture hatao
      const leaveReq = await LeaveRequest.findById(id);
      let lectureItem = null;
      if (leaveReq && leaveReq.email) {
        // Pehle original teacher ke schedule se lecture find karo
        // Schedule field ko explicitly select karo
        const originalTeacher = await collection.findOne({ email: leaveReq.email, role: 'teacher' }, { schedule: 1 });
        if (originalTeacher && Array.isArray(originalTeacher.schedule)) {
          // Match only by date and lectureNumber
          lectureItem = originalTeacher.schedule.find(l => {
            const lDate = new Date(l.date).toISOString();
            const reqDate = new Date(date).toISOString();
            return lDate === reqDate && Number(l.lectureNumber) === Number(lectureNumber);
          });
        }
        // Schedule se lecture hatao
        await collection.updateOne(
          { email: leaveReq.email, role: 'teacher' },
          { $pull: { schedule: { date: new Date(date), lectureNumber: Number(lectureNumber) } } }
        );
      }
      // Ab substitute teacher ke schedule mein lecture add karo
      const substitute = await collection.findOne({ email: substituteEmail, role: 'teacher' });
      if (!lectureItem) {
        // Agar original teacher ke schedule mein lecture nahi mila, adjustment mat karo
        return res.status(400).json({ message: 'Original teacher ke schedule mein lecture nahi mila, adjustment failed.' });
      }
      if (substitute) {
        // Ab lecture ka pura data substitute teacher ko de do
        await collection.updateOne(
          { email: substituteEmail, role: 'teacher' },
          { $push: { schedule: lectureItem } }
        );
      }
    }
    const result = await LeaveRequest.findByIdAndUpdate(id, update, { new: true });
    if (!result) return res.status(404).json({ message: 'Leave request not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Leave action error:', err);
    res.status(500).json({ message: 'Failed to update leave request' });
  }
});




// Hinglish: Teacher ka schedule nikalne ke liye POST route
router.post('/teacher-schedule', async (req, res) => {
  const { email } = req.body; // Teacher ka email frontend se aata hai
  console.log('Fetching teacher schedule for email:', email);

  if (!email) return res.status(400).json({ message: 'Missing email' });

  try {
    // DB se teacher ka schedule nikal rahe hain
    const user = await collection.findOne(
      { email: email.toLowerCase(), role: 'teacher' },
      { name: 1, email: 1, schedule: 1, _id: 0 }
    );

    if (!user) return res.status(404).json({ message: 'Teacher not found' });

    res.json({
      name: user.name,
      email: user.email,
      schedule: Array.isArray(user.schedule) ? user.schedule : []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch teacher schedule' });
  }
});


router.get('/teachers', async (req, res) => {
  console.log('Fetching teachers list');

  try {
    const teachers = await collection.find(
      { role: 'teacher' },
      { name: 1, email: 1, _id: 0 }
    );

    res.json(teachers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch teacher list' });
  }
});


router.get('/dash', getteacherdata);

router.post('/form', addScheduleItem);



router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/'); 
  }
  let username = req.session.user.name;
  res.render('admin',{username}); 
});



export default router;
