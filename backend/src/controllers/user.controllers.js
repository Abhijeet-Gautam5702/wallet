import asyncHandler from "../utils/asyncHandler.js";
import customError from "../utils/customError.js";
import customResponse from "../utils/customResponse.js";
import {
  UserSignInZodSchema,
  UserSignUpZodSchema,
} from "../models/zod.schema.js";
import User from "../models/user.models.js";
import generateTokens from "../utils/tokenGenerator.js";
import Account from "../models/account.models.js";

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

  // Create a bank account for the user
  // Give a random balance b/w 1-10000 to the user at signup (similar to sign-up bonus)
  const userId = createdUser._id; // get user-id of the newly created user
  const userBankAccount = await Account.create({
    userId,
    balance: Math.random() * 10000,
  });
  if (!userBankAccount) {
    throw new customError(
      500,
      "User Bank Account could not be created successfully"
    );
  }

  // Send success response to the client
  res
    .status(200)
    .json(
      new customResponse(
        200,
        createdUser,
        "User registration and bank account creation successful"
      )
    );
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
  // Authorization: Verify whether the user is authorized to hit the sign-out route
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

const userAccountUpdate = asyncHandler(async (req, res) => {
  // Authorization: Verify whether the user is authorized to hit this secured-route

  // Get data from the user
  const { email, firstname, lastname, password } = req.body;

  // Get the userId from the req.user object injected by the Auth-Middlware
  const userId = req.user._id;

  // Get the user and update the fields provided by the user
  const user = await User.findByIdAndUpdate(
    userId,
    {
      email: email?.trim() || req.user.email,
      password: password?.trim() || req.user.password,
      firstname: firstname?.trim() || req.user.firstname,
      lastname: lastname?.trim() || req.user.lastname,
    },
    { new: true }
  ).select("-password -refreshToken"); // exclude 'password' and 'refreshToken' field from the instance of the user document returned by this method

  // Send success response to the user
  res
    .status(200)
    .json(
      new customResponse(200, user, "User account details updated successfully")
    );
});

const getFilteredListOfUsers = asyncHandler(async (req, res) => {
  // Authorization: Verify whether the user is authorized to hit this secured-route

  // Get the filter-query from req.params
  const filterName = req.query?.filter?.trim();
  if (!filterName) {
    throw new customError(401, "Please enter a filter to search");
  }

  // Find all the users in the database with firstname or lastname as the filterName
  /*
    NOTE: We wish to filter the users based on the following cases:-
          - The filterName can be present either in the firstname or lastname fields
          - The filterName can be present in the middle of the firstname or lastname fields
          - The filter search results should be case-insensitive, i.e., "abhijeet" and "Abhijeet" should give the same search results
    
    In order to achieve the above situation, we use regular expressions (with case-insensitivity) along with Mongoose Query Chaining
  */
  const filteredUsers = await User.find({
    $or: [
      {
        firstname: {
          $regex: new RegExp(filterName, "i"), //"i" means case-insensitivity
        },
      },
      {
        lastname: {
          $regex: new RegExp(filterName, "i"),
        },
      },
    ],
  }).select("firstname lastname _id"); // Query Projection: only include these fields in the document instances
  if (!filteredUsers.length) {
    throw new customError(404, "No users found with the given filter");
  }

  // Send success response to the user
  res
    .status(200)
    .json(new customResponse(200, filteredUsers, "Users fetched successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // Authorization: Check whether the current user is authorized to hit this secured-route

  // Get the userId from req.user object injected by the Auth-middleware
  const userId = req.user._id;

  // Get the instance of user from the database without sensitive information
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new customError(
      500,
      "User details could not be fetched from the backend"
    );
  }

  // Send success response to the user with the current-user data (without sensitive info)
  res
    .status(200)
    .json(
      new customResponse(
        200,
        user,
        "Currently logged-in user fetched successfully"
      )
    );
});



export {
  userSignup,
  userSignin,
  userSignout,
  userAccountUpdate,
  getFilteredListOfUsers,
  getCurrentUser,
};
