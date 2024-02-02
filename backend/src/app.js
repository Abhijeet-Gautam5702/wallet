import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(cookieParser());

// IMPORT ROUTES
import userRouter from "./routes/user.routes.js";
import accountRouter from "./routes/account.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/accounts", accountRouter);

export default app;
