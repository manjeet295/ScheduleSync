
// // Time ko 12-hour format me convert karne ke liye function
// function formatTime(timeStr) {
//   const [hour, minute] = timeStr.split(":"); // Hour aur minute split kar rahe hain
//   let h = parseInt(hour);
//   const suffix = h >= 12 ? "PM" : "AM"; // 12 ke baad PM, warna AM
//   h = h % 12 || 12; // 0 ko 12 bana do (midnight/noon)
//   return `${h}:${minute} ${suffix}`; // Final formatted string
// }


// // Form ko reset karne ke liye function
// function resetForm() {
//   document.getElementById("scheduleForm").reset();
// }


// // Jab admin schedule form submit kare, tab yeh event listener chalega
// document.getElementById("scheduleForm").addEventListener("submit", async function (e) {
//   e.preventDefault(); // Form submit hone se page reload na ho

//   // Form ke sare input values nikal rahe hain
//   const subject = document.getElementById("subject").value;
//   const room = document.getElementById("room").value;
//   const day = document.getElementById("day").value;
//   const startTime = document.getElementById("startTime").value;
//   const endTime = document.getElementById("endTime").value;
//   const lectureNumber = document.getElementById("lectureNumber").value;
//   // Slot ko formatted time ke sath bana rahe hain
//   const slot = `${formatTime(startTime)}–${formatTime(endTime)}`;

//   // Naya schedule object bana rahe hain
//   const newSchedule = { subject, room, day, slot, lectureNumber };



//   // Server ko bhejne ke liye payload bana rahe hain
//   const payload = {
//     email: selectedTeacher.email,
//     scheduleItem: newSchedule
//   };

//   try {
//     // Server pe POST request bhej rahe hain
//     const response = await fetch("/admin/form", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(payload)
//     });

//     if (response.ok) {
//       // Agar response sahi aaya toh success alert aur page redirect
//       alert("Schedule added successfully.");
//       window.location.href = 'admin.html'; 
//       resetForm();
//     } else {
//       // Agar server ne error bheja toh uska message alert me dikhaye
//       const err = await response.json();
//       alert("Failed: " + err.message);
//     }
//   } catch (error) {
//     // Network ya koi aur error aayi toh console aur alert me dikhaye
//     console.error(error);
//     alert("Error occurred while sending schedule.");
//   }
// });



