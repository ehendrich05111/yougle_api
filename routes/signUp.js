var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const { checkPassword } = require("../utils/auth");
const userModel = require("../schemas/user");
const { Settings } = require("../schemas/settings");

router.post("/", async function (req, res, next) {
  const { firstName, lastName, email, password } = req.body;
  if (firstName && lastName && email && password) {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "A user with that email already exists",
      });
    }

    if (!checkPassword(password, email, firstName, lastName)) {
      return res.status(400).json({
        status: "error",
        data: null,
        message:
          "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.",
      });
    }

    const encrypted_password = bcrypt.hashSync(password, 10);

    const creationDate = Date();
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: encrypted_password,
      history: [],
      credentials: [],
      accountCreated: creationDate,
      lastSignIn: null,
      isAdmin: false,
      settings: Settings({
        trackHistory: 0,
        staySignedIn: false,
        deepSearch: true,
        darkMode: false,
      }),
      numSearches: 0,
    });
    try {
      await newUser.save();
    } catch (error) {
      console.error(error.message);
      return res.status(500).send({
        status: "error",
        data: null,
        message: "There was an error with the DB. Please try again.",
      });
    }
    return res.status(200).send({
      status: "success",
      data: null,
      message: "Account created succesfully",
    });
  } else {
    return res.status(400).send({
      status: "error",
      data: null,
      message: "Please provide all required information",
    });
  }
});

module.exports = router;
