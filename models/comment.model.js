const { default: mongoose } = require("mongoose");
var db = require("./db");

const commentSchema = new mongoose.Schema(
  {
    idProduct: { type: mongoose.Schema.ObjectId, ref: "productModel" },
    idUser: { type: mongoose.Schema.ObjectId, ref: "userModel" },
    title: String,
  },
  {
    collection: "comments",
    timestamps: true,
  }
);
commentModel = db.mongoose.model("commentModel", commentSchema);
module.exports = {
  commentModel,
};
