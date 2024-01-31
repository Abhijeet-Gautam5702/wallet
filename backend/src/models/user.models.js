import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import customError from "../utils/customError.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: false,
      trim: true,
    },
    refreshToken: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// MONGOOSE PRE-MIDDLEWARE: Hash the password (only if it was newly created or modified) before any document gets saved
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

// MONGOOSE CUSTOM METHOD: Method for comaparing the pasword given by the user and the encrypted password stored in the database.
userSchema.methods.validatePassword = async function (password) {
  if (!password) {
    throw new customError(401, "Password not provided");
  }
  const isPasswordCorrect = await bcrypt.compare(password, this.password);
  return isPasswordCorrect;
};

// MONGOOSE CUSTOM METHOD: Method for generating access token
userSchema.methods.generateAccessToken = async function () {
  const accessToken = await jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
  return accessToken;
};

// MONGOOSE CUSTOM METHOD: Method for generating refresh token
userSchema.methods.generateRefreshToken = async function () {
  const refreshToken = await jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
  return refreshToken;
};

const User = mongoose.model("User", userSchema);

export default User;
