import mongoose from "mongoose";
const connect = mongoose.connect("mongodb://localhost:27017/timetable");

connect.then(() => {
    console.log("DataBase connected.");
})
.catch(() => {
    console.log("DataBase not connected.");
    
})
const noteSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    room: {
        type: String,
        default: ''
    },
    slot: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    // day field removed, only date used for leave requests
    lectureNumber: {
        type: Number,
        required: true
    }
});

const LoginSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true
    },
    email: {
        type : String,
        required: true,
        unique : true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher'],
        default: 'admin',
        required: true
    },
    password: {
        type : String,
        required: true
    },
    schedule: {
        type: [noteSchema],
        default: function () {
            // Only add empty schedule if role is 'teacher'
            return this.role === 'teacher' ? [] : undefined;
        },
        select: false 
    }
})
const collection = new mongoose.model("users", LoginSchema);

// Leave Request Schema for storing teacher leave requests (teacherId bhi store karo)
const leaveRequestSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    teacherName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    // day field removed, only date used for leave requests
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Rejected', 'Adjusted'],
        default: 'Pending'
    },
    substituteEmail: {
        type: String,
        default: ''
    },
    adjustmentDay: {
        type: String,
        default: ''
    },
    adjustmentLectureNumber: {
        type: Number,
        default: null
    }
});

const LeaveRequest = mongoose.model('leaverequests', leaveRequestSchema);

export { collection, LeaveRequest };