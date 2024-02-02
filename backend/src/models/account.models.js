import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: {
      type: Number,
      /*
        NOTE: In general scenario, you must never store balance as float/decimal. 
        For e.g., If you have balance of 100.56, store it as 10056 (Integer) and support a fixed decimal precision for the entire bank (Here, it is 2 decimal places)
      */
    },
  },
  { timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;
