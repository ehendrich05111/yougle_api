const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { checkPassword } = require("../utils/auth");
const userModel = require("../schemas/user");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

router.post("/requestReset", async function (req, res, next) {
  // TODO: include a link to the reset password page in the email, with pre-filled code
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        status: "failure",
        data: null,
        message: "Error with users information",
      });
      return;
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(400).json({
        status: "failure",
        data: null,
        message: "A user with that email does not exist",
      });
      return;
    }
    const tempKey = crypto.randomBytes(5).toString("hex");

    let updateResult = await userModel.updateOne(
      { email },
      { tempKey: { code: tempKey } }
    );
    if (!updateResult.modifiedCount) {
      res.status(500).json({
        status: "failure",
        data: null,
        message: "Error connecting to DB, please try again",
      });
      return;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      from: "support@yougle5.info",
      template_id: "d-2149c8bbaae54755ad2b4665a3e5f343",
      personalizations: [
        {
          to: { email },
          dynamic_template_data: {
            name: user.firstName,
            code: tempKey,
          },
        },
      ],
    };
    sgMail
      .send(msg)
      .then(() => {
        res.status(200).json({
          status: "success",
          data: null,
          message: "Password reset email sent",
        });
      })
      .catch((error) => {
        console.log(error.response.body);
        res.status(500).json({
          status: "failure",
          data: null,
          message: "Error with email API, please try again",
        });
      });
  } catch {
    res.status(500).json({
      status: "failure",
      data: null,
      message: "Something unexplainable went wrong on our side",
    });
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({
        status: "failure",
        data: null,
        message: "Error with user information",
      });
      return;
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(400).json({
        status: "failure",
        data: null,
        message: "A user with that email does not exist",
      });
      return;
    }

    if (user.tempKey.code !== code) {
      return res.status(400).json({
        status: "failure",
        data: null,
        message: "Incorrect reset code",
      });
    }
    if (new Date() > user.tempKey.expiresAt) {
      return res.status(400).json({
        status: "failure",
        data: null,
        message: "Reset code has expired",
      });
    }

    if (!checkPassword(newPassword, email, user.firstName, user.lastName)) {
      return res.status(400).json({
        status: "error",
        data: null,
        message:
          "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.",
      });
    }

    await userModel.updateOne(
      { email },
      { password: bcrypt.hashSync(newPassword, 10) }
    );

    await userModel.updateOne({ email }, { $unset: { tempKey: "" } });
    res.status(200).json({
      status: "success",
      data: null,
      message: "Password reset successful",
    });
    return;
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      status: "failure",
      data: null,
      message: "Something unexplainable went wrong on our side",
    });
  }
});

module.exports = router;
