const mongoose = require("mongoose");

const SignInSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const SignIn = mongoose.model("SignIn", SignInSchema);

module.exports = SignIn;
