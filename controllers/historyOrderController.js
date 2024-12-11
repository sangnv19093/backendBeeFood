var historyModel = require("../models/history");
const ProductModel = require("../models/product.model");
const mongoose = require("mongoose");
var userController = require("../models/users.model");
var voucherModel = require("../models/voucher.model.js");
var apiVoucher = require("../controllers/voucher.controller");
var apiNotify = require("../controllers/notify.controller.js");

const moment = require("moment");
exports.createOrderSuccess = async (req, res, next) => {
  try {
    const date = new Date();
    date.setHours(date.getHours() + 7);
    const OrderSuccess = new historyModel.History({
      ...req.body,
      time: date,
    });
    const voucherId = req.body.voucherId;
    apiNotify.postNotify(req, res);
    if (voucherId && voucherId !== "") {
      const data = await apiVoucher.handleDecreseVoucher(req, res, next);
      if (data == 1) {
        let new_OrderSuccess = await OrderSuccess.save();
        return res.status(200).json({ OrderSuccess: new_OrderSuccess });
      } else {
        return res.status(500).json({ err: "Co loi xay ra" });
      }
    } else {
      let new_OrderSuccess = await OrderSuccess.save();
      return res.status(200).json({ OrderSuccess: new_OrderSuccess });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};
exports.getDonHangChiTiet = async (id) => {
  const data = await historyModel.History.findOne({ _id: id });
  const user = await userController.userModel.findOne({
    _id: new mongoose.Types.ObjectId(data?.userId),
  });
  const { username, phone } = user;
  const dataConcat = {
    product: data.products,
    _id: data?._id,
    username,
    phone,
    address: data.address,
    totalPrice: data.toltalprice,
  };
  return dataConcat;
};
exports.getChiTiet = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    const chiTietDonHang = await historyModel.History.findOne({
      _id: id,
    })
      .populate({
        path: "products.restaurantId",
        select: "name",
        model: "restaurantModel",
      })
      .populate({ path: "voucherId", select: "money", model: "voucherModel" });
    if (!chiTietDonHang) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
    res.json(chiTietDonHang);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
exports.getHistory = async (req, res) => {
  try {
    const history = await historyModel.History.find();
    res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getUserHistory = async (req, res) => {
  console.log("fdscbg", req.body);
  try {
    const userId = req.params.userId;
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ msg: "ID người dùng không hợp lệ" });
    }
    const userHistory = await historyModel.History.find({ userId });

    if (!userHistory || userHistory.length === 0) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy lịch sử mua hàng cho người dùng này" });
    }
    res.json(userHistory);
  } catch (error) {
    console.error("Lỗi khi truy vấn lịch sử mua hàng:", error);
    return res.status(500).json({ msg: "Lỗi máy chủ nội bộ" });
  }
};

exports.deleteHistory = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const deleted = await History.findOneAndDelete({ orderId });
    if (!deleted) {
      return res.status(404).json({ msg: "Không tìm thấy lịch sử mua hàng" });
    }
    res.json(deleted);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.deleteHistoryAll = async (req, res) => {
  try {
    await historyModel.History.deleteMany({});
    res.json({ msg: "Tất cả lịch sử mua hàng đã được xóa" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.getOrdersByRestaurant = async (req, res) => {
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.updateOrderStatusByRestaurant = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;

  try {
    const updatedOrder = await historyModel.History.findByIdAndUpdate(
      orderId,
      { $set: { status: newStatus } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
    }

    let statusMessage = "";
    switch (newStatus) {
      case 1:
        statusMessage = "Đã xác nhận";
        break;
      case 2:
        statusMessage = "Đơn hàng đang giao.";
        break;
      case 3:
        statusMessage = "Đơn hàng đã giao.";
      case 4:
        statusMessage = "Đơn hàng đã được hủy.";
        break;
      default:
        statusMessage = "Chờ xác nhận.";
    }

    res.json({ msg: statusMessage });
  } catch (error) {
    console.error("Error:", error);

    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ msg: "ID đơn hàng không hợp lệ." });
    }

    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const userIdFromRequest = req.body.userId;
    const order = await historyModel.History.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Không tìm thấy đơn hàng" });
    }
    if (order.userId !== userIdFromRequest) {
      return res
        .status(403)
        .json({ msg: "Bạn không có quyền hủy đơn hàng này." });
    }
    if (order.status === 0) {
      const updatedOrder = await historyModel.History.findByIdAndUpdate(
        orderId,
        { $set: { status: 4 } },
        { new: true }
      );
      return res.json({ msg: "Đơn hàng đã được hủy." });
    } else {
      return res
        .status(400)
        .json({ msg: "Không thể hủy đơn hàng ở trạng thái khác 0." });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getDoanhThuTheoDieuKien = async (req) => {
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
      status: 3,
    });
    return orders;
  } catch (error) {
    console.error(error);
  }
};

exports.getOrders = async (req, res) => {
  var slug = req.params.slug;
  let value = 3;
  if (slug == "huy") {
    console.log("vao day");
    value = 4;
  } else {
    value = 3;
  }
  try {
    const user = req.session.user;
    const restaurantId = user._id;

    const soluongdahuy = await historyModel.History.countDocuments({
      status: 4,
      "products.restaurantId": restaurantId,
    });
    const soluongthanhcong = await historyModel.History.countDocuments({
      status: 3,
      "products.restaurantId": restaurantId,
    });

    const orders = await historyModel.History.find({
      "products.restaurantId": restaurantId,
      status: value,
    });
    console.log(orders);
    res.json({
      orders,
      soluongdahuy,
      soluongthanhcong,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.getTopRestaurants = async (req, res) => {
  try {
    const topRestaurants = await historyModel.History.aggregate([
      {
        $match: {
          "products.restaurantId": { $exists: true },
          status: 3,
        },
      },
      {
        $unwind: "$products",
      },
      {
        $addFields: {
          "products.restaurantId": { $toObjectId: "$products.restaurantId" },
        },
      },
      {
        $group: {
          _id: "$products.restaurantId",
        },
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurantInfo",
        },
      },
      {
        $unwind: "$restaurantInfo",
      },
      {
        $project: {
          role: "$restaurantInfo.role",
          _id: "$_id",
          restaurantName: "$restaurantInfo.name",
          email: { $ifNull: ["$restaurantInfo.email", ""] },
          phone: { $ifNull: ["$restaurantInfo.phone", ""] },
          timeon: { $ifNull: ["$restaurantInfo.timeon", ""] },
          timeoff: { $ifNull: ["$restaurantInfo.timeoff", ""] },
          image: { $ifNull: ["$restaurantInfo.image", ""] },
          address: { $ifNull: ["$restaurantInfo.address", ""] },
          totalRevenue: 1,
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    console.log("After Match:", topRestaurants);
    console.log("After Unwind:", topRestaurants);
    console.log("After Group:", topRestaurants);
    console.log("After Lookup:", topRestaurants);
    console.log("After Unwind:", topRestaurants);
    console.log("After Project:", topRestaurants);
    console.log("After Sort:", topRestaurants);
    console.log("Final Result:", topRestaurants);

    res.status(200).json({
      data: topRestaurants,
      msg: "Lấy dữ liệu top nhà hàng thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Đã xảy ra lỗi" });
  }
};

exports.getRevenueRestaurant = async (req, res, next) => {
  const currentDate = moment().startOf("day");
  const startOfToday = moment().startOf("day").toISOString();
  const startOfThisMonth = moment().startOf("month").toISOString();
  const startOfThisYear = moment().startOf("year").toISOString();
  try {
    const user = req.session.user;
    const restaurantId = user._id;
    const billsToday = await historyModel.History.find({
      time: { $gte: startOfToday },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const dataForChartToday = organizeDataByHour(billsToday);
    console.log("start today", startOfToday);
    const billsThisMonth = await historyModel.History.find({
      time: { $gte: startOfThisMonth },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const dataForChartMonth = organizeDataByMonth(billsThisMonth);
    const billsThisYear = await historyModel.History.find({
      time: { $gte: startOfThisYear },
      status: 3,
      "products.restaurantId": restaurantId,
    });
    const userIdsToday = Array.from(
      new Set(billsToday.map((bill) => bill.userId))
    );
    const userIdsThisMonth = Array.from(
      new Set(billsThisMonth.map((bill) => bill.userId))
    );
    const userIdsThisYear = Array.from(
      new Set(billsThisYear.map((bill) => bill.userId))
    );
    const totalRevenueToday = billsToday.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    const totalRevenueThisMonth = billsThisMonth.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    const totalRevenueThisYear = billsThisYear.reduce(
      (total, bill) =>
        isNaN(bill.toltalprice) ? total : total + bill.toltalprice,
      0
    );
    console.log("data", billsToday);
    res.render("revenue/showrevenue", {
      req: req,
      bills: billsToday,
      billsThisMonth: billsThisMonth,
      billsThisYear: billsThisYear,
      userIdsToday: userIdsToday,
      userIdsThisMonth: userIdsThisMonth,
      userIdsThisYear: userIdsThisYear,
      totalRevenueToday: totalRevenueToday,
      totalRevenueThisMonth: totalRevenueThisMonth,
      totalRevenueThisYear: totalRevenueThisYear,

      categoriesToday: dataForChartToday.categories,
      dataToday: dataForChartToday.data,
      revenueToday: dataForChartToday.revenue,

      categoriesMonth: dataForChartMonth.categories,
      dataMonth: dataForChartMonth.data,
      revenueMonth: dataForChartMonth.revenue,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu từ bảng Bill:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu từ bảng Bill");
  }
};
function organizeDataByHour(bills) {
  const roundedTimes = bills.map((bill) => {
    const time = new Date(bill.time);
    const roundedTime = new Date(
      time.getFullYear(),
      time.getMonth(),
      time.getDate(),
      Math.floor(time.getHours() / 2) * 2
    );
    const revenue = parseFloat(bill.toltalprice) || 0; // Chuyển đổi thành số và mặc định là 0 nếu không phải số
    return { time: roundedTime, revenue, count: 1 };
  });

  roundedTimes.sort((a, b) => a.time - b.time);

  const data = [];

  roundedTimes.forEach((roundedTime) => {
    const hourKey = roundedTime.time.toISOString();
    const existingData = data.find((item) => item.time === hourKey);

    if (existingData) {
      existingData.count += roundedTime.count;
      existingData.revenue += roundedTime.revenue;
    } else {
      data.push({
        time: hourKey,
        count: roundedTime.count,
        revenue: roundedTime.revenue,
      });
    }
  });

  data.sort((a, b) => new Date(a.time) - new Date(b.time));
  const valuesForChart = data.map((item) => item.count);

  return {
    categories: data.map((item) => item.time),
    data: valuesForChart,
    revenue: data.map((item) => item.revenue),
  };
}

function organizeDataByMonth(bills) {
  // Lấy ra các ngày (không bao gồm giờ) duy nhất từ danh sách hóa đơn
  const uniqueDays = [
    ...new Set(
      bills.map((bill) =>
        new Date(bill.time).toISOString().split("T")[0].trim()
      )
    ),
  ];

  // Sắp xếp ngày tăng dần
  const categories = uniqueDays.sort();

  // Tính số lượng hóa đơn cho mỗi ngày
  const data = categories.map(
    (day) =>
      bills.filter((bill) => {
        const billDate = new Date(bill.time).toISOString().split("T")[0].trim();
        return billDate === day;
      }).length
  );

  // Tính tổng doanh thu cho mỗi ngày
  const revenue = categories.map((day) =>
    bills
      .filter(
        (bill) => new Date(bill.time).toISOString().split("T")[0].trim() === day
      )
      .reduce((total, bill) => total + bill.toltalprice, 0)
  );
  return { categories, data, revenue };
}

exports.getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ msg: "Cần cung cấp ngày bắt đầu và ngày kết thúc." });
    }

    const user = req.session.user;
    const restaurantId = user._id;

    // Lấy các hóa đơn trong khoảng thời gian
    const orders = await historyModel.History.find({
      time: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: 3, // Chỉ lấy các đơn đã hoàn thành
      "products.restaurantId": restaurantId,
    });

    // Tính tổng doanh thu
    const totalRevenue = orders.reduce(
      (total, order) => total + (order.toltalprice || 0),
      0
    );

    // Chuẩn bị dữ liệu cho biểu đồ
    const categories = []; // Trục X: ngày hoặc thời gian
    const revenues = []; // Trục Y: doanh thu
    const sales = []; // Số lượng bán hàng

    orders.forEach((order) => {
      const date = new Date(order.time).toLocaleDateString("vi-VN"); // Lấy ngày theo định dạng dd/MM/yyyy
      const index = categories.indexOf(date);

      if (index === -1) {
        // Nếu ngày chưa tồn tại, thêm mới
        categories.push(date);
        revenues.push(order.toltalprice || 0);
        sales.push(1); // Bắt đầu với 1 đơn hàng
      } else {
        // Nếu ngày đã tồn tại, cộng dồn doanh thu
        revenues[index] += order.toltalprice || 0;
        sales[index] += 1; // Tăng số lượng bán hàng
      }
    });

    res.status(200).json({
      orders,
      totalRevenue,
      categories, // Danh sách ngày (hoặc thời gian) cho trục X
      revenues, // Doanh thu tương ứng cho trục Y
      sales,
    });
  } catch (error) {
    console.error("Lỗi khi lọc doanh thu:", error);
    res.status(500).json({ msg: "Lỗi máy chủ nội bộ." });
  }
};
