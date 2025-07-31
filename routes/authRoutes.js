
import express from 'express';
import path from 'path';
import { login, signup } from '../controllers/authController.js';


const router = express.Router();


router.get('/', (req, res) => {
  // if(req.session.user){
  //   if(req.session.user.role === 'admin') {
  //     return res.redirect('/admin');
  //   }
  //   else if(req.session.user.role === 'teacher') {
  //     return res.redirect('/teacher');
  //   }
  // }
  res.render('\signin');
});



router.get('/signup', (req, res) => {
  // if(req.session.user){
  //   if(req.session.user.role === 'admin') {
  //     return res.redirect('/admin');
  //   }
  //   else if(req.session.user.role === 'teacher') {
  //     return res.redirect('/teacher');
  //   }
  // }
  res.render('\signup');
});



router.post('/', login);

router.post('/signup', signup);



export default router;
