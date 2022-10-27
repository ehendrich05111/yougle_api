var express = require("express");
var router = express.Router();
const userModel = require("../schemas/user");

router.get("/", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "Please log in first!",
      });
    }

    const user = await userModel.findOne({ _id: req.user._id });

    if (!user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Error finding user with that ID in the DB",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user.settings,
      message: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong on our side",
    });
  }
});

module.exports = router;
