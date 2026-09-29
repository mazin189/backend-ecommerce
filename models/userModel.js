const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      required: true,
      type: String,
      select: false,
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
      enum: ["user", "admin"],
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

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.pre("findOneAndUpdate" , async function () {
     const update = this.getUpdate()
     if(update.password){
      update.password = await bcrypt.hash(update.password, 8)
     }
})


const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
