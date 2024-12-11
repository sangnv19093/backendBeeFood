const { default: mongoose } = require("mongoose");
var db = require("./db");

const voucherSchema = new mongoose.Schema(
  {
    name: String,
    hsd: { type: Date },
    money: Number,
    quantity: Number,
    image: String,
    limit: Number,
    idUser: [{ type: mongoose.Schema.ObjectId, ref: "userModel" }],
    isHetHan: { type: Boolean, default: false },
    restaurantId: { type: mongoose.Schema.ObjectId, ref: "restaurantModel" },
  },
  {
    collection: "vouchers",
    timestamps: true,
  }
);
voucherModel = db.mongoose.model("voucherModel", voucherSchema);
module.exports = {
  voucherModel,
};
