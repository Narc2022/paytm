const express = require("express");
const userRouter = require("./user");
const accountRouter = require("./account");
const studentRouter = require("./student");
const router = express.Router();

router.use("/user", userRouter);
router.use("/Account", accountRouter);
router.use("/student", studentRouter);

module.exports = router;
