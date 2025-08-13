// ---------------------- DOM ELEMENTS ----------------------

const userName = document.querySelector('#User-name');
const userRole = document.querySelector('#User-role');
const selectTeacher = document.querySelector('#select-tag');
const addBtn = document.querySelector('#add-btn');
const side3 = document.querySelector('.add-lec-modal');
const side1 = document.querySelector('.side1');
const appleave = document.querySelector('#app-leave');
const adreq = document.getElementById('adjustment-requests');
adreq.style.display = 'none';


// ---------------------- ON LOAD ----------------------

window.onload = () => {
  side3.style.display = 'none';
  side1.style.display = 'flex';
  side1.style.width = '100%';
  info();
  updateClock();
  setInterval(updateClock, 1000);
};


// ---------------------- CLOCK ----------------------

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  document.getElementById('clock').textContent =
    `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
}


// ---------------------- FORMAT TIME ----------------------

function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}


// ---------------------- RESET FORM ----------------------

function resetForm() {
  document.getElementById("scheduleForm").reset();
}


// ---------------------- FETCH TEACHERS & INITIAL TIMETABLE ----------------------

async function info() {
  try {
    const response = await fetch('/admin/teachers', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch teachers');

    const teachers = await response.json();
    if (!Array.isArray(teachers) || teachers.length === 0) {
      alert('No teachers found.');
      return;
    }

    selectTeacher.innerHTML = '';
    teachers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.email;
      option.textContent = `${user.name} - ${user.email}`;
      selectTeacher.appendChild(option);
    });

    await renderTimetable(teachers[0].email);

    selectTeacher.onchange = async () => {
      await renderTimetable(selectTeacher.value);
    };
  } catch (err) {
    console.error('Error loading teachers:', err);
    alert('Teachers load nahi ho paayi.');
  }
}


// ---------------------- RENDER TIMETABLE ----------------------
// Timetable grid render karta hai (selected teacher ke lectures show karta hai)
/* ---------- helpers ---------- */
function toUTCDateOnly(date) {
  // normalize a Date to UTC midnight (00:00:00) — returns a Date object in UTC midnight
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getStartOfWeekUTC(now) {
  // Monday as start of week (UTC)
  const utcNow = toUTCDateOnly(now);
  const dow = utcNow.getUTCDay(); // 0=Sun,1=Mon...
  const diff = (dow + 6) % 7;     // days since Monday
  const start = new Date(utcNow);
  start.setUTCDate(utcNow.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeekUTC(startOfWeek) {
  // Monday + 5 days = Saturday (inclusive)
  const end = new Date(startOfWeek);
  end.setUTCDate(startOfWeek.getUTCDate() + 5);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function weekdayNameFromUTC(date) {
  const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return names[date.getUTCDay()];
}

/* ---------- main ---------- */
async function renderTimetable(email) {
  if (!email) return;

  try {
    const res = await fetch('/admin/dash', { method: 'GET', credentials: 'include' });
    if (!res.ok) {
      if (res.status !== 401) {
        const text = await res.text();
        alert('Timetable load nahi hua.\nStatus: ' + res.status + '\n' + text);
        console.error('Dashboard fetch failed:', res.status, text);
      }
      return;
    }

    const teachers = await res.json();
    const teacher = teachers.find(t => t.email === email);
    if (!teacher || !Array.isArray(teacher.schedule)) {
      alert('No schedule found for this teacher.');
      return;
    }

    // Clear timetable cells (expecting ids like monday1 .. saturday8)
    const days = ["monday","tuesday","wednesday","thursday","friday","saturday"];
    for (const d of days) {
      for (let i=1; i<=8; i++) {
        const el = document.getElementById(d + i);
        if (el) el.innerHTML = "";
      }
    }

    const now = new Date();
    const startOfWeek = getStartOfWeekUTC(now);
    const endOfWeek = getEndOfWeekUTC(startOfWeek);

    // DEBUG: show week range in UTC
    console.log('Week range (UTC):', startOfWeek.toISOString(), '->', endOfWeek.toISOString());

    let hasLecturesThisWeek = false;

    for (const item of teacher.schedule) {
      const { date, day, lectureNumber, subject, room, slot } = item;
      if (!date) {
        console.warn('Skipping schedule item with no date:', item);
        continue;
      }

      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.warn('Invalid date, skipping:', date);
        continue;
      }

      // Normalize schedule date to UTC midnight
      const jsDate = toUTCDateOnly(parsed);

      // DEBUG each lecture's date
      console.log('Lecture raw:', date, 'parsed UTC:', parsed.toISOString(), 'normalized UTC:', jsDate.toISOString());

      // Filter: must be inside current week (Monday..Saturday)
      if (jsDate < startOfWeek || jsDate > endOfWeek) {
        console.log('Skipping (outside week):', jsDate.toISOString());
        continue;
      }

      // Determine day string (use provided day if valid otherwise derive from date)
      let dayStr = (typeof day === 'string' && day.trim()) ? day.trim().toLowerCase() : weekdayNameFromUTC(jsDate);
      dayStr = dayStr.toLowerCase(); // safety

      // Only accept monday..saturday
      if (!['monday','tuesday','wednesday','thursday','friday','saturday'].includes(dayStr)) {
        console.warn('Skipping lecture with unsupported day:', dayStr, 'item:', item);
        continue;
      }

      // lectureNumber safety
      if (!lectureNumber) {
        console.warn('Skipping lecture with no lectureNumber:', item);
        continue;
      }

      const cellId = dayStr + lectureNumber;
      const cell = document.getElementById(cellId);
      if (!cell) {
        console.warn('No cell element for id:', cellId, '— check your HTML ids.');
        continue;
      }

      hasLecturesThisWeek = true;
      const formattedDate = jsDate.toLocaleDateString('en-GB'); // dd/mm/yyyy

      cell.innerHTML = `
        <div class="lecture-cell">
          <div class="lecture-subject">${subject || ''}</div>
          <div class="lecture-room">${room || ''}</div>
          <div class="lecture-time">${slot || ''}</div>
          <div class="lecture-date">${formattedDate}</div>
        </div>
      `;
    }

    if (!hasLecturesThisWeek) {
      // optional: chrome will keep spamming alerts, consider showing toast instead
      console.log('No lectures this week for', email);
      // alert('Is hafte koi lecture schedule nahi hai.');
    }

  } catch (err) {
    console.error('Error rendering timetable:', err);
    alert('Timetable load nahi hua.\n' + err);
  }
}


// ---------------------- ADD SCHEDULE BUTTON ----------------------

addBtn.addEventListener('click', async () => {
  side1.style.display = 'none';
  side3.style.display = 'block';

  const selectedEmail = selectTeacher.value;
  try {
    const response = await fetch('/admin/teacher-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: selectedEmail }),
      credentials: 'include'
    });

    const teacherData = await response.json();
    if (!teacherData || !Array.isArray(teacherData.schedule)) {
      alert('Invalid schedule.');
      return;
    }

    const cleanSchedule = teacherData.schedule.filter(item =>
      typeof item === 'object' && item !== null && !Array.isArray(item)
    );
  } catch (err) {
    console.error("Error sending schedule:", err);
    alert("Something went wrong.");
  }
});


// ---------------------- SUBMIT NEW SCHEDULE ----------------------

document.getElementById("scheduleForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const subject = document.getElementById("subject").value;
  const room = document.getElementById("room").value;
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const lectureNumber = document.getElementById("lectureNumber").value;

  // Validation: Past date allowed nahi hai
  const today = new Date();
  today.setHours(0,0,0,0);
  const jsDate = new Date(date);
  jsDate.setHours(0,0,0,0);
  if (jsDate < today) {
    alert("Past date pe lecture store nahi ho sakta. Sahi date select karo.");
    return;
  }

  // Get day name from date
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = dayNames[jsDate.getDay()];
  console.log(day);
  

  const slot = `${formatTime(startTime)}–${formatTime(endTime)}`;
  const newSchedule = { subject, room, date, day, slot, lectureNumber };
  const payload = {
    email: selectTeacher.value,
    scheduleItem: newSchedule
  };
  try {
    const response = await fetch("/admin/form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (response.ok) {
      alert("Schedule added successfully.");
      resetForm();
      window.location.href = '/admin';
    } else {
      const err = await response.json();
      alert("Failed: " + err.message);
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    alert("Error occurred while sending schedule.");
  }
});


//  HANDLE LEAVE REQUESTS 

appleave.addEventListener('click', () => {
  adreq.style.display = 'block';
  document.querySelector('.main').style.display = 'none';
  fetchLeaveRequests();
});

async function fetchLeaveRequests() {
  const res = await fetch('/admin/leave-requests');
  const data = await res.json();
  const container = document.getElementById('requestsList');
  container.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<p>No leave requests.</p>';
    return;
  }

  data.forEach(req => {
    // Date se day nikalna
    const jsDate = new Date(req.date);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[jsDate.getDay()];
    const div = document.createElement('div');
    div.className = 'leave-request';
    div.innerHTML = `
      <b>${req.teacherName}</b> (${req.email})<br>
      <b>Date:</b> ${jsDate.toLocaleDateString()}<br>
      <b>Day:</b> ${day}<br>
      <b>Reason:</b> ${req.reason}<br>
      <b>Status:</b> <span id="status-${req._id}">${req.status}</span><br>
      <button onclick="handleLeaveAction('${req._id}','Rejected')">Reject</button>
      <button onclick="handleLeaveAction('${req._id}','Adjust')">Adjust</button>
      <hr>
    `;
    container.appendChild(div);
  });
}


// ADJUST/REJECT ACTION HANDLER

window.handleLeaveAction = async function (id, action) {
  const modal = document.getElementById('adjust-modal');
  let feedbackDiv = document.getElementById('adjust-feedback-msg');

  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'adjust-feedback-msg';
    feedbackDiv.style = 'margin-bottom:10px;color:#1976d2;font-weight:bold;text-align:center;';
    modal.insertBefore(feedbackDiv, modal.children[1] || null);
  }

  feedbackDiv.textContent = '';

  if (action === 'Rejected') {
    await fetch(`/admin/delete-leave/${id}`, { method: 'DELETE' });
    fetchLeaveRequests();
    return;
  }

  if (action === 'Adjust') {
    const resLeave = await fetch('/admin/leave-requests');
    const leaveList = await resLeave.json();
    const leave = leaveList.find(l => l._id === id);
    if (!leave) return alert('Leave request not found.');

    // Date se day nikalna
    const jsDate = new Date(leave.date);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[jsDate.getDay()];

    const teacherRes = await fetch('/admin/teacher-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: leave.email })
    });

    const teacherData = await teacherRes.json();
    // Only lectures for that day
    const lectures = teacherData.schedule.filter(l => {
      if (!l.date) return false;
      const lecDate = new Date(l.date);
      return dayNames[lecDate.getDay()] === day;
    });

    const listDiv = document.getElementById('adjust-lectures-list');
    listDiv.innerHTML = '';

    if (lectures.length === 0) {
      listDiv.innerHTML = '<p>No lectures found for this day.</p>';
    } else {
      lectures.forEach(lec => {
        const lecDiv = document.createElement('div');
        lecDiv.className = 'adjust-lecture-item';
        lecDiv.style = 'margin-bottom:14px; padding:10px; border-bottom:1px solid #eee;';
        lecDiv.innerHTML = `
          <b>Lecture ${lec.lectureNumber}:</b> ${lec.subject} (${lec.room || ''}) <span style="color:#888;">${lec.slot || ''}</span>
          <button style="margin-left:12px;" class="assign-btn" data-day="${day}" data-date="${lec.date}" data-lec="${lec.lectureNumber}" data-id="${id}">Assign</button>
        `;
        listDiv.appendChild(lecDiv);
      });
    }

    modal.style.display = 'block';
    document.querySelector('.main').style.display = 'none';
    window.currentAdjustLeaveId = id;

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.onclick = window.closeAdjustModal;

    const assignBtns = listDiv.querySelectorAll('.assign-btn');
    assignBtns.forEach(btn => {
      btn.onclick = function () {
        const lecDay = btn.getAttribute('data-day');
        const lecDate = btn.getAttribute('data-date');
        const lecNum = Number(btn.getAttribute('data-lec'));
        const leaveId = btn.getAttribute('data-id');
        window.adjustLecture(leaveId, lecDay, lecNum, btn, lecDate);
      };
    });
    return;
  }

  const res = await fetch('/admin/leave-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: action })
  });

  if (res.ok) {
    document.getElementById(`status-${id}`).textContent = action;
  }

  fetchLeaveRequests();
};


// ---------------------- ASSIGN SUBSTITUTE TO LECTURE ----------------------

window.adjustLecture = async function (leaveId, day, lectureNumber, btn, date) {
  btn.disabled = true;
  btn.textContent = 'Assigning...';

  let feedbackDiv = document.getElementById('adjust-feedback-msg');
  if (!feedbackDiv) {
    feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'adjust-feedback-msg';
    feedbackDiv.style = 'margin-bottom:10px;color:#1976d2;font-weight:bold;text-align:center;';
    document.getElementById('adjust-modal').appendChild(feedbackDiv);
  }

  feedbackDiv.textContent = '';

  try {
    // Use date for free teacher API
    const freeRes = await fetch(`/admin/free-teachers?date=${encodeURIComponent(date)}&lectureNumber=${lectureNumber}`);
    const freeTeachers = await freeRes.json();

    if (!Array.isArray(freeTeachers) || freeTeachers.length === 0) {
      feedbackDiv.textContent = 'Koi bhi teacher free nahi hai is slot mein!';
      btn.disabled = false;
      btn.textContent = 'Assign';
      return;
    }

    const substitute = freeTeachers[0];
    const res = await fetch('/admin/leave-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leaveId, status: 'Adjusted', substituteEmail: substitute.email, date, lectureNumber })
    });

    if (res.ok) {
      btn.textContent = `Assigned (${substitute.name})`;
      btn.style.background = '#4caf50';
      btn.style.color = '#fff';

      feedbackDiv.textContent = `Lecture assigned! Substitute: ${substitute.name}`;
      const allBtns = document.getElementById('adjust-lectures-list').querySelectorAll('button');
      const allAdjusted = [...allBtns].every(b => b.disabled || b.textContent.startsWith('Assigned'));

      if (allAdjusted) {
        await fetch(`/admin/delete-leave/${leaveId}`, { method: 'DELETE' });
        feedbackDiv.textContent = 'All lectures assigned! Leave request deleted.';
        setTimeout(() => {
          feedbackDiv.textContent = '';
          window.closeAdjustModal();
        }, 1200);
      }

      fetchLeaveRequests();
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Adjustment failed!');
    }
  } catch (err) {
    feedbackDiv.textContent = err.message || 'Assignment failed!';
    btn.disabled = false;
    btn.textContent = 'Assign';
  }
};


// ---------------------- CLOSE MODAL ----------------------

window.closeAdjustModal = function () {
  const modal = document.getElementById('adjust-modal');
  if (modal) modal.style.display = 'none';
  window.currentAdjustLeaveId = null;

  const feedbackDiv = document.getElementById('adjust-feedback-msg');
  if (feedbackDiv) feedbackDiv.textContent = '';

  const mainSection = document.querySelector('.main');
  if (mainSection){ mainSection.style.display = 'block';
    info();
  }

  const adreq = document.getElementById('adjustment-requests');
  if (adreq) adreq.style.display = 'none';
};
