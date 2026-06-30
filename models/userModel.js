const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      required: true,
      type: String,
    },
    email: {
      required: true,
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: "user",
    },
    image: {
      type: String
    }
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  const user = this;
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 8);
});

userSchema.pre("findOneAndUpdate" , async function () {
     const update = this.getUpdate()
     if(update.password){
      update.password = await bcrypt.hash(update.password, 8)
     }
})


const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
