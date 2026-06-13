const express = require('express');
const multer = require('multer');
const cloudinaryStorage = require("multer-storage-cloudinary");
console.log("MULTER CLOUDINARY:", cloudinaryStorage);
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "portfolio",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
});

const imageUpload = multer({
storage,
limits: { fileSize: 5 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
if (file.mimetype.startsWith('image/')) {
cb(null, true);
} else {
cb(new Error('Only image files allowed'));
}
},
});

const resumeUpload = multer({
storage,
limits: { fileSize: 10 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
const allowed = [
  'application/pdf',
  'application/x-pdf',
  'application/octet-stream',
];

if (allowed.includes(file.mimetype)) {
  cb(null, true);
} else {
  cb(new Error('Only PDF files allowed'));
}

},
});

router.post('/', auth, imageUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  res.json({
    url: req.file.path,
  });
});

router.post(
'/resume',
auth,
resumeUpload.single('resume'),
async (req, res) => {
try {
console.log('Resume Upload');
console.log(req.file);


  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  let profile = await Profile.findOne();

  if (!profile) {
    profile = new Profile();
  }

profile.resume = req.file.path;

  await profile.save();

  res.json({
    url: profile.resume,
  });
} catch (err) {
  console.error(err);

  res.status(500).json({
    message: err.message,
  });
}

}
);

router.post(
  '/avatar',
  auth,
  imageUpload.single('avatar'),
  async (req, res) => {
    try {
      console.log('========== AVATAR UPLOAD ==========');
      console.log('File:', req.file);
      console.log('Body:', req.body);

      if (!req.file) {
        return res.status(400).json({
          message: 'No file uploaded',
        });
      }

      let profile = await Profile.findOne();

      if (!profile) {
        profile = new Profile();
      }

     profile.avatar = req.file.path;

      await profile.save();

      res.json({
        url: profile.avatar,
      });

    } catch (err) {
      console.error('AVATAR ERROR');
      console.error(err);
      console.error(err.stack);

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;
