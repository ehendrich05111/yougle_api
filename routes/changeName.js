var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  try {
    //do not send API request if names do not change
    const { newFirstName, newLastName } = req.body;
    if (!newFirstName && !newLastName) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
    }

    let user = req.user;

    if (!user) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    let result;
    if (newFirstName && newLastName) {
      result = await userModel.updateOne(
        { _id: user._id },
        {
          firstName: newFirstName,
          lastName: newLastName,
        }
      );
      user.firstName = newFirstName;
      user.lastName = newLastName;
    } else if (newFirstName) {
      result = await userModel.updateOne(
        { _id: user._id },
        {
          firstName: newFirstName,
        }
      );
      user.firstName = newFirstName;
    } else {
      result = await userModel.updateOne(
        { _id: user._id },
        {
          lastName: newLastName,
        }
      );
      user.lastName = newLastName;
    }

    if (result.modifiedCount) {
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
    console.log(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

module.exports = router;
