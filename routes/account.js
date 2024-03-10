const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const { default: mongoose } = require("mongoose");

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });
  console.log("account", account);
  res.json({
    balance: account.balance,
  });
});

// Bad Solution to assume db will be always up
// router.post("/transfer", authMiddleware, async (req, res) => {
//   const { amount, to } = req.body;

//   const account = await Account.findOne({
//     userId: req.userId,
//   });

//   const toAccount = await Account.findOne({
//     userId: to,
//   });

//   if (!toAccount) {
//     return res.status(400).json({
//       message: "Invalid account",
//     });
//   }

//   await Account.updateOne(
//     {
//       userId: req.userId,
//     },
//     {
//       $inc: {
//         balance: -amount,
//       },
//     }
//   );

//   await Account.updateOne(
//     {
//       userId: to,
//     },
//     {
//       $inc: {
//         balance: amount,
//       },
//     }
//   );

//   res.json({
//     message: "Transfer Successful",
//   });
// });

// // Good Solution to assume db will be always up

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount, to } = req.body;
  console.log("amount", amount);
  console.log("to", to);

  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient balance",
    });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Invalid account",
    });
  }

  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);
  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  await session.commitTransaction();
  res.json({
    message: "Transfer Successful",
  });
});
module.exports = router;
