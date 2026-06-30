const cloudinary = require("../config/cloudinary.js");

const uploadImage = (buffer, folder = "Products") => {
  return new Promise((resolve,reject) => {
   const stream = cloudinary.uploader.upload_stream(
    {folder},
    (error,result)=> {
      if (error) {
        return reject({error : error.message})
      }
     resolve(result)
    }
  )
  stream.end(buffer)
  })
  }

module.exports = uploadImage;