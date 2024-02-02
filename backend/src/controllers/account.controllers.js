import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import customError from "../utils/customError.js";
import customResponse from "../utils/customResponse.js";
import User from "../models/user.models.js";
import Account from "../models/account.models.js";

const getCurrentUserAccountBalance = asyncHandler(async (req, res) => {
  // Authorization: Check whether the current user is authorized to hit this secured-route

  // Get the userId from req.user
  const userId = req.user._id;

  // Get user details (for sending response to the user)
  const user = await User.findById(userId).select(
    "_id firstname lastname email"
  );

  // Find the userId in the account model and get the balance
  const userBankAccount = await Account.findOne({ userId }).select(
    "_id balance"
  );
  if (!userBankAccount) {
    throw new customError(
      404,
      "Bank account linked with this user-Id not found"
    );
  }

  // Send success response
  res.status(200).json(
    new customResponse(
      200,
      {
        "User-details": user,
        "Linked-Bank-Account": userBankAccount,
      },
      "User bank account data fetched successfully"
    )
  );
});

const transferMoneyToAnotherAccount = asyncHandler(async (req, res) => {
  // Authorization: Check whether the current user is authorized to hit this secured-route

  // MONGOOSE SESSIONS
  /*
    MONGOOSE SESSIONS:
    Mongoose sessions are used in cases where multiple databases calls which are dependent on each other (inter-related operations such as money transfers in this case) need to be executed.
    Mongoose sessions ensure that the database calls take place atomically, i.e., either all of the operations will occur or none of them will occur at all.

    We need to do the following things to use a mongoose session
    - Start session
    - Start a transaction
    - Set the current ongoing session as part of all the desired database queries (If any error occurs in the queries chained with .session(sessionName) => The whole transaction aborts)
    - Commit the transaction if everything goes well
    - Abort the transaction if error is encountered
    - End the session finally
  */

  // Start session
  const session = await mongoose.startSession();

  // Start transaction
  session.startTransaction();

  try {
    // Get details from the user
    const { recipientId, transferAmount } = req.body;

    // Check if all the required fields are provided
    if (!recipientId) {
      throw new customError(
        422,
        "Recipient must be specified before sending money | Recipient-ID not provided"
      );
    }
    if (!transferAmount || transferAmount < 0) {
      throw new customError(422, "Invalid tranfer amount");
    }
    if (recipientId == req.user._id) {
      throw new customError(400, "You cannot send money to youself");
    }

    // Verify whether the recipient account exists
    const isRecipientExist = await User.findById(recipientId).session(session);
    if (!isRecipientExist) {
      throw new customError(
        404,
        "Specified recipient account doesn't exist | Recipient-ID not found in the database"
      );
    }

    // Check whether the current user (Sender) account has enough balance
    let currUser = await Account.findOne({ userId: req.user._id }).session(
      session
    );
    const currUserBalance = currUser.balance;
    if (currUserBalance < transferAmount) {
      throw new customError(400, "Your account doesn't have enough money");
    }

    // Update the balance in the sender bank account
    await Account.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          balance: -transferAmount,
        },
      }
    ).session(session);

    // Update the balance in the reciever bank account
    await Account.findOneAndUpdate(
      { userId: recipientId },
      {
        $inc: {
          balance: transferAmount,
        },
      }
    ).session(session);

    // Commit the transaction if everything goes right
    await session.commitTransaction();

    // Send success response to the user
    res.status(200).json(
      new customResponse(
        200,
        {
          "updated balance": currUser.balance - transferAmount,
        },
        "Amount transferred successfully"
      )
    );
  } catch (error) {
    // Abort the transaction if any error is encountered
    await session.abortTransaction();

    // Send server error
    throw new customError(
      500,
      `An error occured while completing the transaction | ${error.message}`
    );
  } finally {
    // End session
    session.endSession();
  }
});

export { getCurrentUserAccountBalance, transferMoneyToAnotherAccount };
