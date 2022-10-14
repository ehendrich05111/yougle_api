var express = require("express");

let userModel = require("../schemas/user");

var router = express.Router();

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
