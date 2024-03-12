const express = require("express");
const twilio = require("twilio");
const zod = require("zod");
require("dotenv").config();
const { User, Account } = require("../db");
const { JWT_SECRET } = require("../config");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");
const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});
router.post("/signup", async (req, res) => {
  const body = req.body;
  const { success } = signupSchema.safeParse(req.body);
  if (!success) {
    return res.status(403).json({
      message: "Incorrect inputs",
    });
  }
  const existingUser = await User.findOne({
    username: body.username,
  });

  if (existingUser) {
    return res.json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const dbUser = await User.create(body);

  const userId = dbUser._id;
  console.log("userId", userId);
  await Account.create({
    userId,
    balance: 1 + Math.random() * 1000,
  });
  const token = jwt.sign(
    {
      userId: dbUser._id,
    },
    JWT_SECRET
  );
  res.json({
    message: "User created successfully",
    token: token,
  });
});

const signinSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

router.post("/signin", async (req, res) => {
  const body = req.body;
  console.log("body", body);
  const { success } = signinSchema.safeParse(body);

  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET
    );
    res.json({ token: token });
    return;
  }

  res.status(411).json({
    message: "Error while logging in",
  });
});

const updateBody = zod.object({
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }

  await User.updateOne(res.body, {
    id: req.userId,
  });

  res.json({
    message: "Updated Successfully",
  });
});

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

// otp testing

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const twilioPhoneNumber = process.env.twilioPhoneNumber;

const client = twilio(accountSid, authToken);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

const otpMap = new Map();

router.post("/sendotp", (req, res) => {
  const { mobileNumber } = req.body;

  const otp = generateOTP();
  otpMap.set(mobileNumber, otp);

  client.messages
    .create({
      body: `Your OTP for mobile number verification is: ${otp}`,
      from: twilioPhoneNumber,
      to: mobileNumber,
    })
    .then(() => {
      res.json({ success: true, message: "OTP sent successfully" });
    })
    .catch((error) => {
      console.error("Error sending OTP:", error);
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    });
});

router.post("/verify/mobile", (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!otpMap.has(mobileNumber)) {
    return res
      .status(400)
      .json({ success: false, message: "OTP not sent for this mobile number" });
  }

  const storedOTP = otpMap.get(mobileNumber);

  if (otp == storedOTP) {
    otpMap.delete(mobileNumber);
    res.json({
      success: true,
      message: `Mobile number ${mobileNumber} verified successfully`,
    });
  } else {
    res.status(400).json({ success: false, message: "Incorrect OTP" });
  }
});

// Email Verification

const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const userEmail = process.env.userEmail;
const userPass = process.env.userPass;
const transporter = nodemailer.createTransport({
  service: "Gmail", // Change to your email service
  auth: {
    user: userEmail, // Change to your email
    pass: userPass, // Change to your password
  },
});

// Route to generate and send OTP
router.post("/send-otp", (req, res) => {
  const email = req.body.email;

  // Generate OTP
  const otp = randomstring.generate({
    length: 6,
    charset: "numeric",
  });
  otpMap.set(email, otp);

  // Send OTP via email
  const mailOptions = {
    from: "sachinnarofficials@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to send OTP" });
    } else {
      console.log("Email sent: " + info.response);
      res.json({ message: "OTP sent successfully" });
    }
  });
});

// Route to verify OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!otpMap.has(email)) {
    return res
      .status(400)
      .json({ success: false, message: "OTP not sent for this email" });
  }

  const storedOTP = otpMap.get(email);
  console.log("storedOTP", storedOTP);
  if (otp == storedOTP) {
    otpMap.delete(email);
    res.json({
      success: true,
      message: `Email ${email} verified successfully`,
    });
  } else {
    res.status(400).json({ success: false, message: "Incorrect OTP" });
  }
  // In a real-world scenario, you would compare the OTP received with the one stored against the user
  // For simplicity, we're just sending a success response if OTP matches "123456"
});

module.exports = router;
