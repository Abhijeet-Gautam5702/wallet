import asyncHandler from "../utils/asyncHandler.js";
import customError from "../utils/customError.js";
import customResponse from "../utils/customResponse.js";

const userRegister = asyncHandler(async (req, res) => {
  if(1<3){
    
  throw new customError(400, "sorry")
  }
  res.json(new customResponse(200,"hello"))
});

export { userRegister };
