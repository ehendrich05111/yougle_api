var express = require("express");
var router = express.Router();

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  const connectedServices = req.user.credentials.map((credential) => {
    return {
      isActive: credential.isActive,
      service: credential.service,
      _id: credential._id,
      name: credential.data.teamName || credential.data.name,
    };
  });

  return res.status(200).json({
    status: "success",
    data: connectedServices,
    message: null,
  });
});

module.exports = router;
