var express = require("express");
var router = express.Router();
const userModel = require("../schemas/user");

router.post("/", async function (req, res, next) {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      res.status(400).json({
        status: "error",
        data: null,
        message: "Error with request information",
      });
      return;
    }
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "Please log in first!",
      });
    }

    let removed = false;
    user.credentials.forEach((credential, i, allCredentials) => {
      if (credential._id.toString() === serviceId) {
        allCredentials.splice(i, 1);
        removed = true;
      }
    });
    if (removed) {
      const result = await userModel.updateOne(
        { _id: user._id },
        { $pull: { credentials: { _id: serviceId } } }
      );
      if (result.modifiedCount) {
        res.status(200).json({
          status: "success",
          data: user,
          message: "Service Disconnected",
        });
        return;
      } else {
        res.status(500).json({
          status: "error",
          data: null,
          message: "Error connecting with DB",
        });
        return;
      }
    } else {
      res.status(400).json({
        status: "error",
        data: null,
        message: "Attempted to disconnect a non-connected service",
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

module.exports = router;
