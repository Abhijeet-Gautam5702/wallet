// Utility function to generate access and refresh Tokens for the user

import customError from "./customError.js";

async function generateTokens(user) {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new customError(500, "Error in token generation");
  }
}

export default generateTokens;
