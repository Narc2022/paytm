const express = require("express");
const userRouter = require("./user");
const accountRouter = require("./account");

const router = express.Router();

router.use("/user", userRouter);
router.use("/Account", accountRouter);

module.exports = router;
