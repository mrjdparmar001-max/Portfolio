const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log("MAIL ERROR:", error);
  } else {
    console.log("MAIL SERVER READY");
  }
});

router.post('/', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  // Send Email
try {
  console.log("=================================");
  console.log("SENDING EMAIL TO:", msg.email);
  console.log("REPLY TEXT:", req.body.reply);

  const info = await transporter.sendMail({
    from: `"Jaydip Parmar" <${process.env.EMAIL_USER}>`,
    to: msg.email,
    subject: `Reply: ${msg.subject || "Your Message"}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${msg.name},</h2>

        <p>${req.body.reply}</p>

        <br/>

        <p>Best Regards,</p>
        <p><strong>Jaydip Parmar</strong></p>
      </div>
    `,
  });

  console.log("EMAIL SENT SUCCESS");
  console.log("MESSAGE ID:", info.messageId);
  console.log("RESPONSE:", info.response);

} catch (mailError) {
  console.error("EMAIL ERROR:");
  console.error(mailError);
}

router.put('/:id/reply', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Save reply
    msg.adminReply = req.body.reply;
    msg.replied = true;
    msg.read = true;

    await msg.save();

    // Try sending email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: msg.email,
        subject: `Reply: ${msg.subject || 'Your Message'}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Hello ${msg.name},</h2>
            <p>${req.body.reply}</p>
            <br />
            <p>Best Regards,</p>
            <p><strong>Jaydip Parmar</strong></p>
          </div>
        `,
      });

      console.log("EMAIL SENT:", msg.email);

    } catch (mailError) {
      console.error("EMAIL ERROR:", mailError.message);

      // Email failed, but reply is already saved.
      // Do NOT return 500.
    }

    return res.status(200).json({
      success: true,
      message: "Reply saved successfully",
      data: msg,
    });

  } catch (err) {
    console.error("REPLY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}); 
router.delete('/:id', auth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;