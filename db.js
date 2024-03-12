// mongoose
const mongoose = require("mongoose");
require("dotenv").config();
const userName = process.env.dbUser;
const password = process.env.dbPass;
mongoose.connect(
  `mongodb+srv://${userName}:${password}@100xdevs.uisiqme.mongodb.net/paytm`
);

//user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
});

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  contact: {
    type: String,
    required: true,
    minLength: 6,
  },
  age: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  currentAcademicLevel: {
    type: String,
    required: true,
  },
  currentSchool: {
    type: String,
    required: true,
  },
  fieldOfStudy: {
    type: String,
    required: true,
  },
  desireStudyDestination: {
    type: String,
    required: true,
  },
  expectedYear: {
    type: String,
    require: true,
  },
  languageProficiency: {
    type: String,
    require: true,
  },

  anySpecificQuestion: {
    type: String,
    require: true,
  },
});

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
});

//create model from schema
const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);
const Student = mongoose.model("Student", studentSchema);
module.exports = {
  User,
  Account,
  Student,
};
