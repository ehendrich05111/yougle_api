var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();
const bcrypt = require("bcrypt");
const { checkPassword } = require("../utils/auth");

router.post("/", async function (req, res, next) {
  //validate password format on front end
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please log in first!",
      });
    }

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "Incorrect old password",
      });
    }

    if (
      !checkPassword(newPassword, user.email, user.firstName, user.lastName)
    ) {
      return res.status(400).json({
        status: "error",
        data: null,
        message:
          "Invalid password. Must be 8 characters or longer, contain a mix of letters, numbers, and symbols, and not contain email or name.",
      });
    }

    if (bcrypt.compareSync(newPassword, user.password)) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "New password can not be the same as old password",
      });
    }

    const newHashedPassword = bcrypt.hashSync(newPassword, 10);

    const result = await userModel.updateOne(
      { _id: user._id },
      {
        password: newHashedPassword,
      }
    );

    if (result.modifiedCount) {
      return res.status(200).json({
        status: "success",
        data: user,
        message: null,
      });
    } else {
      return res.status(500).json({
        status: "error",
        data: null,
        message: "Error connecting to DB",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

module.exports = router;
