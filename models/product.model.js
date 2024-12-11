const { default: mongoose } = require("mongoose");
var db = require("./db");

const productSchema = new mongoose.Schema(
  {
    name: String,
    image: String,
    description: String,
    realPrice: {
      type: Number,
      required: true,
      min: 0
    },
    category: String,
    isHide: { type: Boolean, default: false },
    likeCount: {
      type: Number,
      default: 0,
    },
    totalEvaluate: { type: Number, default: 0 },
    totalStar: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    restaurantId: { type: mongoose.Schema.ObjectId, ref: "restaurantModel" },
  },
  {
    collection: "products",
    timestamps: true,
  }
);
productModel = db.mongoose.model("productModel", productSchema);
module.exports = {
  productModel,
};
