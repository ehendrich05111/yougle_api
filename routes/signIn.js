var express = require("express");
let userModel = require("../schemas/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ConnectionStates } = require("mongoose");
var router = express.Router();

router.post("/", async function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Error with request information",
    });
  }

  let response = await userModel.findOne({
    email: email,
  });

  if (!response || !bcrypt.compareSync(password, response.password)) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Incorrect email or password.",
    });
  }

  //clear local storage to show tour for new user
  var firstSignIn = true;
  if (response.lastSignIn != null) {
    firstSignIn = false;
  }

  //update lastSignIn field
  const newSignIn = Date();
  const previousSignIn = response.lastSignIn;
  const result = await userModel.updateOne(
    { _id: response._id },
    { lastSignIn: newSignIn },
  );
  result.lastSignIn = newSignIn;

  //calculate days since last sign in
  const daysDifference = (Date.parse(newSignIn) - Date.parse(previousSignIn)) / (1000 * 3600 * 24);

  return res.status(200).json({
    status: "success",
    data: {
      token: jwt.sign({ _id: response._id }, process.env.SECRET_KEY),
      hasServices: response.credentials.length > 0 ? true : false,
      daysSinceLastSignIn: daysDifference,
      firstSignIn: firstSignIn,
    },
    message: null,
  });
});

module.exports = router;
