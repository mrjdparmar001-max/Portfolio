const express = require('express');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const streamifier = require("streamifier");
const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

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

const result = await uploadToCloudinary(
  req.file.buffer,
  "portfolio/resumes",
  "raw"
);

profile.resume = result.secure_url;

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

  const result = await uploadToCloudinary(
  req.file.buffer,
  "portfolio/avatars",
  "image"
);

profile.avatar = result.secure_url;

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
