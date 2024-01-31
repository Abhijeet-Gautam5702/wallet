// Auth middleware: Authenticates the user (using its access token) to ensure it is authorized to hit the secured routes

import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import customError from "../utils/customError.js";
import User from "../models/user.models.js";

const authorizeUser = asyncHandler(async (req, res, next) => {
  // Get the access-token from the cookies or from the authorization header (in case of mobile applications)
  const userAccessToken =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!userAccessToken) {
    throw new customError(401, "Unauthorized request | No access token found");
  }

  // Decode the cookie and obtain the user-id
  const decodedTokenInfo = await jwt.verify(
    userAccessToken,
    process.env.ACCESS_TOKEN_SECRET
  );
  if (!decodedTokenInfo) {
    throw new customError(401, "The user access token has expired or used");
  }

  // Check if user exists in the database
  const user = await User.findById(decodedTokenInfo._id);
  if (!user) {
    throw new customError(
      404,
      "Unauthorized request | User doesn't exist in the database"
    );
  }

  // Inject a `req.user` object to the request object
  req.user = user;

  // Call the next middleware
  next();
});

export default authorizeUser;
