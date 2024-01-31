import asyncHandler from "../utils/asyncHandler.js";
import customError from "../utils/customError.js";
import customResponse from "../utils/customResponse.js";
import {
  UserSignInZodSchema,
  UserSignUpZodSchema,
} from "../models/zod.schema.js";
import User from "../models/user.models.js";
import generateTokens from "../utils/tokenGenerator.js";

// Options for Cookies to make them secure
const cookieOptions = {
  httpOnly: true,
  success: true,
};

const userSignup = asyncHandler(async (req, res) => {
  // Get user data from the client
  const { email, password, firstname, lastname } = req.body;

  // Check whether all required data is provided
  if (
    [email, password, firstname].some((field) => {
      return !field || (field && field.trim() === "");
    })
  ) {
    throw new customError(422, "One or more required field(s) is empty");
  }

  // Check whether all data is in the prescribed format using zod
  const user = { firstname, lastname, email, password };
  const isDataFormatCorrect = UserSignUpZodSchema.safeParse(user).success;
  if (!isDataFormatCorrect) {
    throw new customError(400, "Format of the user data is incorrect");
  }

  // Check if user already exists in the database
  const isUserExists = await User.findOne({ email });
  if (isUserExists) {
    throw new customError(409, "User with the given email already exists");
  }

  // Create a new user in the database with the given details
  const newUser = await User.create({
    email: email,
    firstname: firstname,
    password: password,
    lastname: lastname || "",
  });
  if (!newUser) {
    throw new customError(
      500,
      "User registration could not completed successfully"
    );
  }

  // Obtain the newly created user data excluding sensitive info (password)
  const createdUser = await User.findOne({ email }).select("-password");

  // Send success response to the client
  res
    .status(200)
    .json(new customResponse(200, createdUser, "User registration successful"));
});

const userSignin = asyncHandler(async (req, res) => {
  // Get email and password from the request body
  const { email, password } = req.body;
  if (!email || !password) {
    throw new customError(
      401,
      "Both email and password are required to sign in"
    );
  }

  // Check the format of the data provided by the client
  const isDataFormatCorrect = UserSignInZodSchema.safeParse({
    email,
    password,
  }).success;
  if (!isDataFormatCorrect) {
    throw new customError(400, "Invalid format of data");
  }

  // Check if the user with the given email is present in the database
  const isUserExists = await User.findOne({
    email,
  });
  if (!isUserExists) {
    throw new customError(
      404,
      "User with the given credentials doesn't exist in the database"
    );
  }

  // Check if the correct password is provided by the user
  const isPasswordCorrect = await isUserExists.validatePassword(password);
  if (!isPasswordCorrect) {
    throw new customError(401, "Incorrect password");
  }

  // Create access and refresh tokens
  const { accessToken, refreshToken } = await generateTokens(isUserExists);
  if (!accessToken || !refreshToken) {
    throw new customError(
      500,
      "User could not be signed in | Tokens could not be generated successfully"
    );
  }

  // Give the refresh token to the user in the database
  const updatedUser = await User.findByIdAndUpdate(
    isUserExists._id,
    {
      refreshToken: refreshToken,
    },
    { new: true }
  ).select("-password");

  // Send the tokens to the cookies with the success response
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new customResponse(
        200,
        {
          user: updatedUser,
          accessToken: accessToken,
        },
        "User signed in successfully"
      )
    );
});

const userSignout = asyncHandler(async (req, res) => {
  // Authentication: Verify whether the user is authorized to hit the sign-out route
  // Get the user-id from the req.user object injected by the auth-middleware
  const userId = req.user._id;

  // Clear the refresh token from the user in the database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      refreshToken: "",
    },
    { new: true }
  ).select("-password");
  if (updatedUser.refreshToken) {
    throw new customError(
      500,
      "User could not be signed out | Refresh Token could not be cleared"
    );
  }

  // Clear the access and refresh tokens in the cookies
  // Send success response to the client
  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new customResponse(200, {}, "User signed out successfully"));
});

export { userSignup, userSignin, userSignout };
