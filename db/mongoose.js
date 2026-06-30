const mongoose = require("mongoose");
require("dotenv").config({ path: "../config.env" });

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to database successfully");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = connectToDB;
