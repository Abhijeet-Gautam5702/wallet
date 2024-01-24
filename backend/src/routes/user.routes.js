import { Router } from "express";
import { userRegister } from "../controllers/user.controllers.js";

const userRouter = Router();

userRouter.route("/register").post(userRegister);

export default userRouter;
