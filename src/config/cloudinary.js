const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

console.log('--- Initializing Cloudinary ---');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Defined' : 'MISSING');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Defined' : 'MISSING');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Defined' : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'glossy-treasures/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
