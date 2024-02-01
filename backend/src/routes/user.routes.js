import { Router } from "express";
import {
  userSignin,
  userSignout,
  userSignup,
  userAccountUpdate,
} from "../controllers/user.controllers.js";
import authorizeUser from "../middlewares/auth.middlewares.js";

const userRouter = Router();

userRouter.route("/signup").post(userSignup);
userRouter.route("/signin").post(userSignin);

// Secure routes
userRouter.route("/signout").post(authorizeUser, userSignout);
userRouter
  .route("/update-account-details")
  .put(authorizeUser, userAccountUpdate);

export default userRouter;
