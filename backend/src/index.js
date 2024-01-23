import dotenv from "dotenv";
import connectDatabase from "./db/db.js";
import { PORT } from "./constants.js";
import app from "./app.js";

dotenv.config();

const port = PORT || 8000;

await connectDatabase();
try {
  app.on("error", (error) => {
    console.log(`EXPRESS APP ERROR\n ${error}`);
  });

  app.listen(port, () => {
    console.log(`EXPRESS APP RUNNING SUCCESSFULLY ON PORT: ${port}`);
  });
} catch (error) {
  console.log(`EXPRESS APP ERROR\n ${error}`);
  throw error;
}
