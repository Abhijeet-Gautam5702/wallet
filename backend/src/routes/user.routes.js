import { Router } from "express";
import { userSignin, userSignup } from "../controllers/user.controllers.js";

const userRouter = Router();

userRouter.route("/signup").post(userSignup);
userRouter.route("/signin").post(userSignin)

export default userRouter;
