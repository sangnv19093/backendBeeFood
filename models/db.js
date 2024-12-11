const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://lequangtai1804:Tai1804@cluster0.tlqan.mongodb.net/BeeFood')
       .catch( (err)=>{
               console.log("Loi ket noi CSDL: ");
               console.log(err);
       });
module.exports = { mongoose }