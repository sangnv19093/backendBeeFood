const { default: mongoose } = require("mongoose");
var db = require("./db");

const orderSchema = new mongoose.Schema(
    {
        userId: { type: db.mongoose.Schema.Types.ObjectId, ref: 'userModel', require:true },
        restaurantName: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        productId:{
            type:String , 
            required:true
        },
        image: String,
        price: {
            type: Number,
            required: true,
        },
        restaurantId: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: 'Cart'
    }

);
let Order = db.mongoose.model('Cart', orderSchema);
module.exports = {
    Order
}
//