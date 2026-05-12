const express = require('express');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  res.json({ url: req.file.path });
});

module.exports = router;
