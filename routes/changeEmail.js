var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  //validate email format on front end
  try {
    const { userID, newEmail } = req.body;
    if (!userID || !newEmail) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
    }

    const [user, userWithNewEmail] = await Promise.all([
      userModel.findOne({
        _id: userID,
      }),
      userModel.findOne({
        email: newEmail,
      }),
    ]);

    if (!user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "No user with that ID",
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
      { _id: userID },
      {
        email: newEmail,
      }
    );

    if (result.modifiedCount) {
      return res.status(200).json({
        status: "success",
        data: {
          newEmail,
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
