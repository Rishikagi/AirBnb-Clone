const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// console.log(cloudinary.config());
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'airbnb_DEV',
      allowed_Formats: ["png","jpg","jpeg"],
     
    },
  });

  // console.log("Cloudinary Config:", cloud_name, api_key , api_secret);

  module.exports ={
    cloudinary, 
    storage,
  };