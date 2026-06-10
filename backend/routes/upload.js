const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

const router = express.Router();

const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, path.join(__dirname, '../uploads'));
},
filename: (req, file, cb) => {
cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
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

```
if (allowed.includes(file.mimetype)) {
  cb(null, true);
} else {
  cb(new Error('Only PDF files allowed'));
}
```

},
});

router.post('/', auth, imageUpload.single('image'), (req, res) => {
if (!req.file) {
return res.status(400).json({
message: 'No file uploaded',
});
}

res.json({
url: `/uploads/${req.file.filename}`,
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

```
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  let profile = await Profile.findOne();

  if (!profile) {
    profile = new Profile();
  }

  profile.resume = `/uploads/${req.file.filename}`;

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
```

}
);

router.post(
'/avatar',
auth,
imageUpload.single('avatar'),
async (req, res) => {
try {
console.log('Avatar Upload');
console.log(req.file);

```
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
    });
  }

  let profile = await Profile.findOne();

  if (!profile) {
    profile = new Profile();
  }

  profile.avatar = `/uploads/${req.file.filename}`;

  await profile.save();

  res.json({
    url: profile.avatar,
  });
} catch (err) {
  console.error(err);

  res.status(500).json({
    message: err.message,
  });
}
```

}
);

module.exports = router;
