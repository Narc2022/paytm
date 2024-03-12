const express = require("express");
const { Student } = require("../db");
const zod = require("zod");
const twilio = require("twilio");
const router = express.Router();
require("dotenv").config();

// otp testing
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const twilioPhoneNumber = process.env.twilioPhoneNumber;
const client = twilio(accountSid, authToken);

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

const studentSchema = zod.object({
  fullName: zod.string(),
  email: zod.string().email(),
  contact: zod.string(),
  age: zod.string(),
  gender: zod.string(),
  address: zod.string(),
  currentAcademicLevel: zod.string(),
  currentSchool: zod.string(),
  fieldOfStudy: zod.string(),
  desireStudyDestination: zod.string(),
  expectedYear: zod.string(),
  languageProficiency: zod.string(),
  anySpecificQuestion: zod.string(),
});

// Mobile OTP
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

//Email Routes

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

router.post("/create", async (req, res) => {
  const body = req.body;

  const { success } = studentSchema.safeParse(req.body);
  if (!success) {
    return res.status(403).json({
      message: "Incorrect inputs",
    });
  }
  const existingUser = await Student.findOne({
    email: body.email,
  });

  if (existingUser) {
    return res.json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const dbUser = await Student.create(body);
  res.json({
    message: "Student created successfully",
  });
});

module.exports = router;
