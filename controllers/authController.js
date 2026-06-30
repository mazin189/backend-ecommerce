const User = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");


const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return res.status(400).send("User already exists");
    }
    const user = new User({ name, email, password });
    await user.save();
    const userObj = user.toObject();
    delete userObj.__v;
    delete userObj.password;
    res.status(201).send({
      message: "User created successfully",
      user: userObj,
    });
  }) ;

const login = asyncHandler( async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Password or Email are not correct");
    }
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send("Password or Email are not correct");
    }
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.cookie("access_token", token, {
      httpOnly: true,
      secure : process.env.NODE_ENV === "production" ? true : false,
      sameSite : "None",
      path : "/"
    })
    
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;
    res.status(200).send({
      message: "Logged in succesfully",
      data: {
        token: token,
        user: safeUser,
      },
    });
});

module.exports = {
  login,
  register,
};
