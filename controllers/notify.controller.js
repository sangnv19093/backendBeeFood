require("../models/product.model");
require("../models/users.model");

var notifyModel = require("../models/notify.model");
exports.getNotifyById = async (req, res, next) => {
  try {
    const listNoti = await notifyModel.notifyModel.find({
      idUser: req.params.id,
    });
    return res.status(200).json({ listNotify: listNoti });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
exports.postNotify = async (req, res) => {
  const dt = {
    idUser: req.body.userId,
    money: req.body.toltalprice,
  };
  try {
    notifyModel.notifyModel.create(dt).then((dta) => {});
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
