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
      min: 0 // Giá trị tối thiểu là 0
    },
    category: String,
    trangthai: { type: Number, default: 0 },
    restaurantId: { type: mongoose.Schema.ObjectId, ref: "restaurantModel" },
  },
  {
    collection: "sanphamdangduyet",
    timestamps: true,
  }
);
sanPhamDangDuyetModel = db.mongoose.model(
  "sanPhamDangDuyetModel",
  productSchema
);
module.exports = {
  sanPhamDangDuyetModel,
};
