var express = require("express");
let userModel = require("../schemas/user");
var router = express.Router();

router.post("/", async function (req, res, next) {
  try {
    const { _id, searchResult } = req.body;
    if (_id && searchResult) {
      const user = await userModel.findOne({ _id });
      if (!user) {
        res.status(400).json({
          status: "error",
          data: null,
          message: "No user with that ID",
        });
        return;
      }
      const result = await userModel.updateOne(
        { _id },
        { $push: { savedMessages: searchResult } }
      );
      if (result.modifiedCount) {
        res
          .status(200)
          .json({ status: "success", data: null, message: "Message saved" });
        return;
      } else {
        res.status(500).json({
          status: "error",
          data: null,
          message: "Error connecting to DB",
        });
        return;
      }
    } else {
      res.status(400).json({
        status: "error",
        data: null,
        message: "Error with user information",
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

module.exports = router;
