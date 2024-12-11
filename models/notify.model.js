const { default: mongoose } = require("mongoose");
var db = require("./db");

const notifySchema = new mongoose.Schema(
  {
    idUser: { type: mongoose.Schema.ObjectId, ref: "userModel" },
    money: Number,
    image: String,
    title: String,
  },
  {
    collection: "notifications",
    timestamps: true,
  }
);
notifyModel = db.mongoose.model("notifyModel", notifySchema);
module.exports = {
  notifyModel,
};
