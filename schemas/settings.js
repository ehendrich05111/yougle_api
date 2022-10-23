const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    trackHistory: {
      type: Number,
      required: true,
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
        delete ret.__v;
      },
    },
  }
);

const Settings = mongoose.model("Settings", SettingsSchema);

module.exports = { Settings, SettingsSchema };
