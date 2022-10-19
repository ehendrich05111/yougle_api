var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  try {
    //do not send API request if names do not change
    console.log(req.body);
    const { userID, newFirstName, newLastName } = req.body;
    if (!userID || (!newFirstName && !newLastName)) {
      console.log(newFirstName);
      console.log(newLastName);
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
    }

    const user = await userModel.findOne({
      _id: userID,
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "No user with that ID",
      });
    }

    let result;
    if (newFirstName && newLastName) {
      result = await userModel.updateOne(
        { _id: userID },
        {
          firstName: newFirstName,
          lastName: newLastName,
        }
      );
    } else if (newFirstName) {
      result = await userModel.updateOne(
        { _id: userID },
        {
          firstName: newFirstName,
        }
      );
    } else {
      result = await userModel.updateOne(
        { _id: userID },
        {
          lastName: newLastName,
        }
      );
    }

    if (result.modifiedCount) {
      return res.status(200).json({
        status: "success",
        data: {
          newFirstName,
          newLastName,
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
