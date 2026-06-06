require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'YOUR_OTHER_EMAIL@gmail.com',
  subject: 'Portfolio Email Test',
  text: 'Email sending is working!',
})
.then(() => console.log('Email sent'))
.catch(console.error);