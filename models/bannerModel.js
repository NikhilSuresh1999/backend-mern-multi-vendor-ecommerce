// 

const { Schema, model } = require("mongoose");

const bannerSchema = new Schema({
  productId: {
    type: Schema.ObjectId,
    required: true
  },
  banner: {
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  },
  link: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = model('banners', bannerSchema);