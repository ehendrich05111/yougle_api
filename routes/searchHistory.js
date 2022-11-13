var express = require("express");

let userModel = require("../schemas/user");

var router = express.Router();

router.post("/deleteSingle", async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Please login first!",
      });
    }

    const { user } = req;
    const { idx } = req.body;

    if (!idx) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "No history element specified",
      });
    }

    if (idx < 0 || idx >= user.history.length) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "Index out of range",
      });
    }

    user.history.splice(idx, 1);
    user.markModified("searchHistory");
    await user.save((err, doc) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          data: null,
          message: "Error connecting to Database",
        });
      }
      return res.status(200).json({
        status: "success",
        data: user.history,
        message: "History item removed",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Something unexplainable went wrong",
    });
  }
});

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

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }
  let searchHistory = await userModel.findOne(
    { email: req.user.email },
    "history"
  );
  if (!searchHistory) {
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Error with the database: unable to retrieve search history",
    });
  }
  return res.status(200).json({
    status: "success",
    data: searchHistory,
    message: "Successfully retrieved search history",
  });
});

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
