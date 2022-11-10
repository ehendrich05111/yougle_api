var express = require("express");
let userModel = require("../schemas/user");
const jwt = require("jsonwebtoken");

var router = express.Router();

router.delete("/profile", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first.",
    });
  }
  let user = await userModel.findOne({
    _id: req.user.id,
  });
  if (!user) {
    return res.status(500).json({
      status: "error",
      data: null,
      message:
        "Issue with the database encountered: Unable to find a user with that ID",
    });
  }

  let deleted = await userModel.deleteOne({
    _id: req.user.id,
  });

  if (!deleted || deleted.deletedCount != 1) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Unable to delete that user",
    });
  }

  return res.status(200).json({
    status: "success",
    data: user,
    message: "Successfully deleted account",
  });
});

module.exports = router;
