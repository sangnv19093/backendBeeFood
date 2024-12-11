var sanPhamDangDuyetModel = require("../models/sanPhamDangDuyet.model.js");
const firebase = require("../firebase/index.js");
const { productModel } = require("../models/product.model.js");
var restaurantModel = require("../models/restaurant.model");
const userModel = require("../models/users.model.js");
var historyModel = require("../models/history");

exports.addProduct = async (req, res, next) => {
  const id = req.session.user?._id;
  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("finish", () => {
    const realPrice = Number.parseInt(req.body.realPrice);
    const discountPrice = Number.parseInt(req.body.discountPrice);

    // Kiểm tra giá tiền không âm
    if (realPrice < 0 || discountPrice < 0) {
      return res.status(400).json({ msg: "Giá tiền phải lớn hơn hoặc bằng 0" });
    }

    const product = {
      ...req.body,
      realPrice: Number.parseInt(req.body.realPrice),
      discountPrice: Number.parseInt(req.body.discountPrice),
      description: Number.parseInt(req.body.description),
      description: String(req.body.description),
      restaurantId: id,
      image: `https://firebasestorage.googleapis.com/v0/b/beefoodconsole.appspot.com/o/${nameFile}?alt=media`,
    };
    sanPhamDangDuyetModel.sanPhamDangDuyetModel.create(product).then(() => {
      res.redirect("/showProduct");
    });
  });
  blobWriter.end(req.file.buffer);
};
exports.getListProduct = async (req, res, next) => {
  try {
    const products = await sanPhamDangDuyetModel.sanPhamDangDuyetModel.find({
      trangthai: 0,
    });

    for (let i = 0; i < products.length; i++) {
      const restaurantInfo = await restaurantModel.restaurantModel.findById(
        products[i].restaurantId
      );

      if (restaurantInfo) {
        products[i].restaurantName = restaurantInfo.name;
      }
    }
    res.render("product/listProductCensorship", { list: products, req: req });
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};

exports.duyet = async (req, res, next) => {
  const productId = req.params.id;

  try {
    // Tìm sản phẩm trong bảng sanPhamDangDuyetModel
    const productToApprove =
      await sanPhamDangDuyetModel.sanPhamDangDuyetModel.findById(productId);

    // Thêm sản phẩm vào bảng productModel.productModel
    const newProduct = new productModel({
      _id: productToApprove._id, // Giữ nguyên id của sản phẩm
      name: productToApprove.name,
      image: productToApprove.image,
      description: productToApprove.description,
      quantityInStock: productToApprove.quantityInStock,
      realPrice: productToApprove.realPrice,
      category: productToApprove.category,
      discountPrice: productToApprove.discountPrice,
      restaurantId: productToApprove.restaurantId,
    });

    // Lưu sản phẩm mới vào bảng productModel
    await newProduct.save();

    // Xoá sản phẩm khỏi bảng sanPhamDangDuyetModel
    await sanPhamDangDuyetModel.sanPhamDangDuyetModel.findByIdAndDelete(
      productId
    );
    res.redirect("/censorship");
  } catch (error) {
    res.redirect("/censorship");
  }
};

exports.xoa = async (req, res, next) => {
  const productId = req.params.id;
  try {
    const productToApprove =
      await sanPhamDangDuyetModel.sanPhamDangDuyetModel.findById(productId);

    if (!productToApprove) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    await sanPhamDangDuyetModel.sanPhamDangDuyetModel.updateOne(
      { _id: productId },
      { trangthai: 1 }
    );

    res.redirect("/censorship");
  } catch (error) {
    res.redirect("/censorship");
  }
};

exports.huy = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const productToDelete =
      await sanPhamDangDuyetModel.sanPhamDangDuyetModel.findById(productId);
    if (!productToDelete) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    await sanPhamDangDuyetModel.sanPhamDangDuyetModel.deleteOne({
      _id: productId,
    });
    res.redirect("back");
  } catch (error) {
    console.error(error);
  }
};

exports.listForRes = async (req, res, next) => {
  try {
    const products = await sanPhamDangDuyetModel.sanPhamDangDuyetModel.find({
      restaurantId: req.params.id,
    });

    for (let i = 0; i < products.length; i++) {
      const restaurantInfo = await restaurantModel.restaurantModel.findById(
        products[i].restaurantId
      );

      if (restaurantInfo) {
        products[i].restaurantName = restaurantInfo.name;
      }
    }
    res.render("product/listProductCensorshipRes", {
      list: products,
      req: req,
    });
  } catch (error) {
    return res.status(204).json({ msg: error.message });
  }
};

exports.getlistuser = async (req, res, next) => {
  try {
    const users = await userModel.userModel.find();

    // Sử dụng Promise.all để chờ tất cả các promises hoàn thành
    const usersWithTimeSinceCreated = await Promise.all(
      users.map(async (user) => ({
        ...user.toObject(),
        timeSinceCreated: calculateTimeSinceCreated(user.createdAt),
        count: await getBoughtCount(user._id),
        totalAmount: await getBoughtTotalAmount(user._id),
      }))
    );

    res.render("usersview/user", {
      list: usersWithTimeSinceCreated,
      req: req,
    });
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Hàm tính thời gian từ ngày tạo đến hiện tại
function calculateTimeSinceCreated(createdAt) {
  const createdAtDate = new Date(createdAt);
  const currentDate = new Date();

  const timeDifference = currentDate - createdAtDate;
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference + " ngày trước";
}

async function getBoughtCount(userId) {
  try {
    // Truy vấn trong bảng bills để lấy số lượng hóa đơn với status = 3
    const count = await historyModel.History.countDocuments({
      userId: userId,
      status: 3,
    });

    return count;
  } catch (error) {
    console.error("Error counting bills:", error);
    throw error;
  }
}

async function getBoughtTotalAmount(userId) {
  try {
    const records = await historyModel.History.find({
      userId: userId,
      status: 3,
    });

    // Cộng tổng toltalprice từ mảng records
    const totalAmount = records.reduce(
      (total, record) => total + record.toltalprice,
      0
    );

    return totalAmount;
  } catch (error) {
    console.error("Error getting total amount:", error);
    throw error;
  }
}
exports.getUserProfile = async (req, res, next) => {
  console.log(req.params.id);

  try {
    // Lấy thông tin user từ userModel
    const user = await userModel.userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Truy vấn các đơn mua thành công từ historyModel
    const successfulOrders = await historyModel.History.find({
      userId: req.params.id,
      status: 3,
    });

    res.render("usersview/userProfile", {
      user: user,
      orders: successfulOrders,
      count: await getBoughtCount(user._id),
      totalAmount: await getBoughtTotalAmount(user._id),
      req: req,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getContact = async (req, res, next) => {
  res.render("contact/contact", {
    req: req,
  });
};
