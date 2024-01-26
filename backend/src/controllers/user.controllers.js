import asyncHandler from "../utils/asyncHandler.js";
import customError from "../utils/customError.js";
import customResponse from "../utils/customResponse.js";
import { UserZodSchema } from "../models/zod.schema.js";
import User from "../models/user.models.js";

const userRegister = asyncHandler(async (req, res) => {
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
  const isDataFormatCorrect = UserZodSchema.safeParse(user).success;
  if (!isDataFormatCorrect) {
    throw new customError(400, "Format of the user data is incorrect");
  }

  // Check if user already exists in the database
  const isUserExists = await User.findOne({ email });
  if (isUserExists) {
    throw new customError(409, "User with the given email already exists");
  }

  // [BUG] :: Create a new user in the database with the given details
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

export { userRegister };
