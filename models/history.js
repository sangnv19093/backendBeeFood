const { default: mongoose } = require("mongoose");
var db = require("./db");
const timestamp = require("mongoose-timestamp");

const historySchame = new mongoose.Schema(
  {
    userId: {
      type: String,
      require: true,
    },

    address: {
      type: String,
      require: true,
    },
    restaurantName: {
      type: String,
      require: true,
    },
    products: [
      {
        // id nhà hàng
        restaurantId: {
          type: String,
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId, // Hoặc String, nếu bạn lưu trữ ID như một chuỗi
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    toltalprice: {
      type: Number,
      require: true,
    },
    phuongthucthanhtoan: {
      type: String,
      require: true,
    },
    status: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3, 4],
      default: 0,
    },
    notes: {
      type: String,
      require: false,
    },
    time: {
      type: Date,
      require: false,
    },
    voucherId: {
      type: mongoose.Types.ObjectId,
      ref: "voucherModel",
      default: new mongoose.Types.ObjectId(),
    },
  },
  {
    collection: "Bill",
  }
);
let History = db.mongoose.model("Bill", historySchame);
module.exports = {
  History,
};
