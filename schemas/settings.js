const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    trackHistory: {
      type: Boolean,
      required: true,
      default: true,
    },
    staySignedIn: {
      type: Boolean,
      required: true,
    },
    deepSearch: {
      type: Boolean,
      required: true,
    },
    darkMode: {
      type: Boolean,
      required: true,
    },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
      },
    },
  }
);

const Settings = mongoose.model("Settings", SettingsSchema);

module.exports = { Settings, SettingsSchema };
