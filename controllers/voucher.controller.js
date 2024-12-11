require("../models/restaurant.model.js");
var voucherModel = require("../models/voucher.model.js");
const moment = require("moment");
const firebase = require("../firebase/index.js");
exports.getVoucher = async (req, res, next) => {
  const id = req.session.user?._id;
  console.log(id);
  try {
    const currentTime = moment();
    const list = await voucherModel.voucherModel.find({
      restaurantId: id,
      hsd: { $gte: currentTime.toISOString() },
    });
    return list;
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.huyDonHang = async (req, res, next) => {
  const userId = req.body.userId;
  const voucherId = req.body.voucherId;

  try {
    const currentTime = moment();
    await voucherModel.voucherModel.findOneAndUpdate(
      {
        _id: voucherId,
        hsd: { $gte: currentTime.toISOString() },
        idUser: { $in: [userId] },
      },
      {
        $inc: { quantity: 1 },
        $pull: { idUser: userId },
      },
      { new: true }
    );
  } catch (error) {}
};

exports.decrease = async (req, res, next) => {
  const id = req.session.user?._id;
  try {
    const currentTime = moment();
    const list = await voucherModel.voucherModel.find({
      restaurantId: id,
      hsd: { $gte: currentTime.toISOString() },
    });
    return list;
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.getVoucherInRestaurant = async (req, res, next) => {
  const id = req.params.id;
  console.log("data id", id);
  try {
    const currentTime = moment();
    const list = await voucherModel.voucherModel.find({
      restaurantId: id,
      hsd: { $gte: currentTime.toISOString() },
    });
    return res.json({
      list: list,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// exports.huyDonHang = (req, res, next) => {};

exports.tinhtoansovoucherhethang = async (req, res, next) => {
  const id = req.session.user?._id;
  try {
    const currentTime = moment();
    const list = await voucherModel.voucherModel.find({
      restaurantId: id,
      hsd: { $lt: currentTime.toISOString() },
    });
    res.json({
      quantityHetHang: list?.length,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.handleDecreseVoucher = async (req, res, next) => {
  const id = req.body.voucherId;
  const userId = req.body.userId;
  try {
    const voucher = await voucherModel.voucherModel.findById({ _id: id });
    if (!voucher) {
      return -1;
    }
    if (voucher.quantity == 0) {
      await voucherModel.voucherModel.findByIdAndDelete({ _id: id });

      return -1;
    }
    if (voucher.quantity > 0) {
      voucher.quantity--;
      voucher.idUser = [...(voucher.idUser ?? []), userId];
      await voucher.save();

      return 1;
    } else {
      return -1;
    }
  } catch (error) {
    return -1;
  }
};
exports.deleteVoucher = async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  try {
    await voucherModel.voucherModel.findByIdAndDelete({ _id: id });
    res.redirect("/listvoucher");
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.detailVoucher = async (req, res, next) => {
  const id = req.params.id;

  const voucher = await voucherModel.voucherModel.findById({
    _id: id,
  });
  return voucher;
};
exports.editVoucher = async (req, res, next) => {
  const idVoucher = req.params.id;
  const id = req.session.user?._id;

  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("finish", () => {
    const voucher = {
      ...req.body,
      money: Number.parseInt(req.body.voucherPrice),
      name: req.body.nameVoucher,
      hsd: String(req.body.voucherDate),
      restaurantId: id,
      quantity: Number.parseInt(req.body.quantity),
      limit: Number.parseInt(req.body.limit),
      image: `https://firebasestorage.googleapis.com/v0/b/beefoodconsole.appspot.com/o/${nameFile}?alt=media`,
    };
    voucherModel.voucherModel
      .findByIdAndUpdate({ _id: idVoucher }, voucher)
      .then(() => {
        res.redirect("/listvoucher");
      });
  });
  blobWriter.end(req.file.buffer);
};
exports.addVoucher = async (req, res, next) => {
  const id = req.session.user?._id;
  const nameFile = req.file.originalname;
  const blob = firebase.bucket.file(nameFile);
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("finish", () => {
    const voucher = {
      ...req.body,
      money: Number.parseInt(req.body.voucherPrice),
      name: req.body.nameVoucher,
      hsd: String(req.body.voucherDate),
      restaurantId: id,
      quantity: Number.parseInt(req.body.quantity),
      limit: Number.parseInt(req.body.limit),
      image: `https://firebasestorage.googleapis.com/v0/b/beefoodconsole.appspot.com/o/${nameFile}?alt=media`,
    };
    voucherModel.voucherModel.create(voucher).then(() => {
      res.redirect("/listvoucher");
    });
  });
  blobWriter.end(req.file.buffer);
};
