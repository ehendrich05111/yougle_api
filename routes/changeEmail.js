var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  //validate email format on front end
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
    }

    const userWithNewEmail = await userModel.findOne({ email: newEmail });

    let user = req.user;

    if (!user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    if (userWithNewEmail) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "A user with that email already exists",
      });
    }

    const result = await userModel.updateOne(
      { _id: user._id },
      {
        email: newEmail,
      }
    );

    if (result.modifiedCount) {
      user.email = newEmail;
      return res.status(200).json({
        status: "success",
        data: {
          user,
        },
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
