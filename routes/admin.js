const express = require("express");
const User = require("../schemas/user");

var router = express.Router();

router.get("/", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "You must be an administrator to access this page.",
    });
  }

  return res.status(200).json({
    status: "success",
    data: null,
    message: null,
  });
});

router.get("/accounts", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "You must be an administrator to access this",
    });
  }

  try {
    const { start, end } = req.query;
    //start and end are seconds since the epoch
    //if they are provided in the body, then we search between
    //the start and end dates, otherwise we just return all
    //docs

    let numAccounts;
    if (start !== undefined || end !== undefined) {
      numAccounts = await User.countDocuments({
        accountCreated: {
          $gte: start ? new Date(start * 1000) : undefined,
          $lte: end ? new Date(end * 1000) : undefined,
        },
      });
    } else {
      numAccounts = await User.countDocuments();
    }

    return res.status(200).json({
      status: "success",
      data: numAccounts,
      message: "Successfully retrieved the number of accounts",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      data: null,
      message: "Unknown error",
    });
  }
});

router.get("/active", async function (req, res, next) {
  if (req.user === undefined) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "Please log in first!",
    });
  }

  if (!req.user.isAdmin) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "You must be an administrator to access this page.",
    });
  }

  const { from, to } = req.query;
  if ((from && isNaN(parseInt(from))) || (to && isNaN(parseInt(to)))) {
    return res.status(400).json({
      status: "error",
      data: null,
      message: "Invalid from/to timestamps",
    });
  }

  const query = {};
  if (from || to) {
    query.lastSignIn = {};
    if (from) {
      query.lastSignIn.$gte = new Date(parseInt(from) * 1000);
    }
    if (to) {
      query.lastSignIn.$lte = new Date(parseInt(to) * 1000);
    }
  }

  const lastSignIns = await User.countDocuments(query);

  return res.status(200).json({
    status: "success",
    data: lastSignIns,
    message: null,
  });
});

module.exports = router;
