import { Router } from "express";
import {
  getCurrentUserAccountBalance,
  transferMoneyToAnotherAccount,
} from "../controllers/account.controllers.js";
import authorizeUser from "../middlewares/auth.middlewares.js";

const accountRouter = Router();

// SECURED ROUTES
accountRouter
  .route("/balance")
  .get(authorizeUser, getCurrentUserAccountBalance);

accountRouter
  .route("/transfer")
  .post(authorizeUser, transferMoneyToAnotherAccount);

export default accountRouter;
