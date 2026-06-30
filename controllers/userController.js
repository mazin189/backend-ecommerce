const User = require("../models/userModel.js");
const uploadImage = require("../services/cloudinary.service.js")
const asyncHandler = require("express-async-handler");


const getAllUsers = asyncHandler (async(req, res) => {
  try {
    const allUsers = await User.find({
      role: { $ne: "admin" },
    }).select("-password -__v");
    if (allUsers.length === 0) {
      return res.status(200).send({ Users: [] });
    }
    res.status(200).send({ Users: allUsers });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

const getUserById = asyncHandler (async(req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    res.status(200).send({ User: safeUser });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

const updateProfileData = asyncHandler (async(req, res) => {
    const updates = {...req.body}
    const id = req.user._id;
     if(req.file){
    const result = await uploadImage(req.file.buffer, "Users")
      updates.image = result.secure_url
    }
    const user = await User.findByIdAndUpdate(id,updates,{
      new : true,
      runValidators: true
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    res.status(200).send({ User: safeUser });
});

const getProfile = asyncHandler (async(req, res) => {
    const user = req.user;
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    res.status(200).send({ Profile: safeUser });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateProfileData,
  getProfile,
};
