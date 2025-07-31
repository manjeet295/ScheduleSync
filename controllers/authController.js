import {collection} from '../models/config.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const signup = async (req, res) => {
  const data = {
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    role: req.body.role,
    password: req.body.password,
  };

  if (data.role === "teacher") data.schedule = [];

  try {
    const user = new collection(data);
    await user.save();

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to save user');
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await collection.findOne({ email: email.toLowerCase(), password });

    if (user) {
      req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const currentUserData = {
        name: user.name,
        email: user.email,
        role: user.role
      };

      

      return res.status(200).json({
        message: "Login successful",
        email: user.email,
        role: user.role
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};










// import path from 'path';
// import fs from 'fs/promises';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const filePath = path.join(__dirname, '../models/data.json');


// export const signup = async (req, res) => {
//   const data = {
//     name: req.body.name, 
//     email: req.body.email.toLowerCase(),
//     role: req.body.role, 
//     pass: req.body.password
//   };

//   if (data.role === "teacher") data.schedule = [];

//   try {
//     let fileData = [];

//     try {
//       const fileContent = await fs.readFile(filePath, 'utf-8');
//       fileData = JSON.parse(fileContent);

//       const exists = fileData.find(user => user.email === data.email);
//       if (exists){

//          return res.status(400).send('User already exists');
//     }
//     } catch (err) {
      
//       console.error(err); 
//     }

    
//     fileData.push(data);
    
//     await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
    
//     res.redirect('/');
//   } catch (err) {
    
//     res.status(500).send('Failed to save user');
//   }
// };


// // Login function: User ko login karne ke liye
// export const login = async (req, res) => {
//   // Request body se email aur password nikal rahe hain
//   const { email, password } = req.body;
//   try {
//     let fileData = [];
//     // Data file read kar rahe hain
//     const fileContent = await fs.readFile(filePath, 'utf-8');
//     // Agar file empty hai toh khali array bana lo, warna JSON parse karo
//     fileData = fileContent.trim() ? JSON.parse(fileContent) : [];

//     // Email ko lowercase me convert kar rahe hain, taki login case-insensitive ho
//     const user = fileData.find(u => u.email === email.toLowerCase() && u.pass === password);
//     if (user) {
//       req.session.user = {
//         email: user.email,
//         role: user.role,
//       };
//       // Save current user info to currentUser.json
//       const currentUserPath = path.join(__dirname, '../models/currentUser.json');
//       const currentUserData = {
//         name: user.name,
//         email: user.email,
//         role: user.role
//       };
//       try {
//         await fs.writeFile(currentUserPath, JSON.stringify(currentUserData, null, 2));
//       } catch (err) {
//         // Ignore write error, but log it
//         console.error('Failed to write currentUser.json:', err);
//       }
//       // Agar user mil gaya toh success message bhej rahe hain, role bhi bhejo
//       return res.status(200).json({ message: "Login successful", email: user.email, role: user.role });
//     } else {
//       // Agar user nahi mila toh invalid credentials ka message bhej rahe hain
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
//   } catch (err) {
//     // Agar koi bhi error aayi toh error message bhej rahe hain
//     res.status(500).json({ message: 'Login failed' });
//   }
// }
