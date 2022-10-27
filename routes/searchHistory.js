var express = require("express");

let userModel = require("../schemas/user");

var router = express.Router();

router.get("/retrieve", async function (req, res, next) {
  if(req.user === undefined){
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!"
    })
  }
  let searchHistory = await userModel.findOne({"email": req.user.email}, "history");
  if(!searchHistory){
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Error with the database: unable to retrieve search history"
    })
  }
  return res.status(200).json({
    status: "success",
    data: searchHistory,
    message: "Successfully retrieved search history"
  })
})

// TODO: remove this, duplicated in search
router.post("/store", async function (req, res, next) {
  const { userID, search } = req.body;

  if (userID && search) {
    try {
      // find user
      const user = await userModel.findOne({
        _id: userID,
      });

      // ensure user found
      if (!user) {
        res.status(400).send("No user with that ID");
        return;
      }

      // update history
      const history_length = user[0]["history"].length;
      let response;
      if (history_length < 100) {
        response = await userModel.updateOne(
          {
            _id: userID,
          },
          {
            $push: { history: search },
          }
        );
      } else {
        const searchHistory = user["history"];
        searchHistory.shift();
        searchHistory.push(search);
        response = await userModel.updateOne(
          {
            _id: userID,
          },
          {
            history: searchHistory,
          }
        );
      }
      // if successful, send 200, else 400
      if (response.ok) {
        res.status(200).send("History updated");
      } else {
        res.status(500).send("Error updating history");
      }
    } catch (err) {
      res.status(500).send("Something unexplainable went wrong");
    }
  } else {
    res.status(400).send("Error with request information");
  }
});

module.exports = router;
