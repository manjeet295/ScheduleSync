
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';

import authRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import teacherRouter from './routes/teacherRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// View engine ko sahi tarike se set karo (EJS ya jo bhi use ho)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));



app.use(session({
  secret: 'kuch-bhi-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure:false,maxAge: 1000 * 60 * 60 * 24 }
}));


app.use('/', authRouter);
app.use('/admin', adminRouter); 
app.use('/teacher',teacherRouter);
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.redirect('/');
  });
});

app.use((req, res) => {
  res.redirect('/');
});


app.listen(port,()=>{
  console.log(`server running at http://localhost:${port}`);
});
