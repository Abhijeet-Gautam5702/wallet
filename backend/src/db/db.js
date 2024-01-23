import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDatabase() {
  try {
    const mongoDBconnect = await mongoose.connect(
      `${process.env.MONGO_DB_CONNECTION_URI}/${DB_NAME}`
    );

    console.log(
      `MONGO-DB CONNECTION SUCCESSFUL | Connection Host: ${mongoDBconnect.connection.host}`
    );
  } catch (error) {
    console.log(`MONGO-DB CONNECTION FAILED\n ${error}`);
    throw error;
  }
}

export default connectDatabase;
