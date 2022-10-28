var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.delete("/", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    if (req.user.history.length === 0) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "Search history already empty",
      });
    }

    const result = await userModel.updateOne(
      { _id: req.user._id },
      { $set: { history: [] } }
    );

    if (result.modifiedCount) {
      return res.status(200).json({
        status: "success",
        data: null,
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
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

module.exports = router;
