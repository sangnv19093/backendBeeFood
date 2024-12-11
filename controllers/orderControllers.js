const { Order } = require("../models/orders");
const { productModel } = require("../models/product.model");
const moment = require("moment-timezone");

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
//lấy theo id
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ userId: userId });

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy đơn hàng cho người dùng này." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};
exports.createOrder = async (req, res) => {
  try {
    console.log("data id restaurant", req.body.restaurantId);
    if (!req.body.userId || !req.body.productId || !req.body.quantity) {
      return res.status(400).json({
        msg: "Vui lòng cung cấp đủ thông tin: userId, productId, quantity",
      });
    }

    const product = await productModel
      .findById(req.body.productId)
      .populate({ path: "restaurantId", select: "name" });

    if (!product || !product.restaurantId) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy sản phẩm hoặc thông tin nhà hàng" });
    }

    const orders = await Order.find({ userId: req.body.userId });
    console.log("order filter", orders);

    const orderDate = moment().tz("Asia/Ho_Chi_Minh").toDate(); // Adjust the timezone here

    if (orders.length === 0) {
      const order = new Order({
        userId: req.body.userId,
        restaurantName: product.restaurantId.name,
        productId: req.body.productId,
        name: product.name,
        image: product.image,
        restaurantId: req.body.restaurantId,
        price: product.realPrice,
        quantity: req.body.quantity,
        orderDate: orderDate,
      });
      const newOrder = await order.save();
      return res.json(newOrder);
    } else {
      const restaurantId = orders.map((order) => order.restaurantId);
      const existingOrder = orders.find(
        (order) => order.productId === req.body.productId
      );

      if (restaurantId.includes(req.body.restaurantId)) {
        if (existingOrder) {
          // Sản phẩm đã tồn tại trong giỏ hàng, chỉ cần cập nhật số lượng
          existingOrder.quantity += req.body.quantity;
          await existingOrder.save();
          return res.json(existingOrder);
        } else {
          // Sản phẩm chưa tồn tại trong giỏ hàng, thêm mới
          const order = new Order({
            userId: req.body.userId,
            restaurantName: product.restaurantId.name,
            productId: req.body.productId,
            name: product.name,
            image: product.image,
            restaurantId: req.body.restaurantId,
            price: product.realPrice,
            quantity: req.body.quantity,
            orderDate: orderDate,
          });
          const newOrder = await order.save();
          return res.json(newOrder);
        }
      } else {
        return res.status(404).json({
          msg: "Đang thêm sản phẩm không cùng 1 cửa hàng vào giỏ hàng",
        });
      }
    }
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ" });
  }
};
exports.deletebyUid = async (req, res) => {
  try {
    const uid = req.params.id;
    console.log(uid);

    const listorderIds = req.body.listorderIds;

    console.log("list order id", listorderIds);

    if (!uid && (!listorderIds || listorderIds.length === 0)) {
      return res.status(400).json({ msg: "Missing UID or listorderIds" });
    }

    let deleteCondition = {};

    if (uid) {
      // If UID is provided, delete orders for that UID
      deleteCondition.userId = uid;
    }

    if (listorderIds && listorderIds.length > 0) {
      // If listorderIds is provided, validate and delete orders with those order IDs
      const validOrderIds = await Order.find({ _id: { $in: listorderIds } }, '_id');

      if (validOrderIds.length !== listorderIds.length) {
        return res.status(400).json({ msg: "Invalid order IDs in listorderIds" });
      }

      deleteCondition._id = { $in: listorderIds };
    }

    const deletedOrders = await Order.deleteMany(deleteCondition);

    if (!deletedOrders || deletedOrders.deletedCount === 0) {
      return res.status(404).json({ msg: "No orders found for deletion" });
    }

    console.log("Xóa đơn hàng thành công");
    res.json(deletedOrders);
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Kiểm tra xem đơn hàng có tồn tại hay không
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found!" });
    }

    // Xóa đơn hàng dựa trên ID
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ msg: "Order deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { quantity } = req.body;
    console.log("order id", orderId);
    console.log("data products", quantity);
    if (!quantity) {
      return res
        .status(400)
        .json({ msg: "Vui lòng cung cấp số lượng cần cập nhật" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { quantity },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
    }

    return res.json({
      msg: "Cập nhật đơn hàng thành công",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

//web
exports.getOrdersWeb = async (req, res) => {
  console.log("ss");
  try {
    const orders = await Order.find().populate("userId", "username");
    console.log(orders);
    res.render("order/listorder", { list: orders, req: req });
  } catch (error) {
    console.log(error);
    res.render("/", { req: req });
  }
};
