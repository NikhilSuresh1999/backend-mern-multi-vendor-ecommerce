const authOrder = require("../../models/authOrder")
const adminSellerMessage = require("../../models/chat/adminSellerMessage")
const sellerCustomerMessage = require("../../models/chat/sellerCustomerMessage")
const customerOrder = require("../../models/customerOrder")
const myShopWallet = require("../../models/myShopWallet")
const productModel = require("../../models/productModel")
const sellerModel = require("../../models/sellerModel")
const sellerWallet = require("../../models/sellerWallet")
const { responseReturn } = require("../../utiles/response")
const { mongo: {ObjectId}} = require('mongoose')
const cloudinary = require('cloudinary').v2
const formidable = require("formidable")
const bannerModel = require("../../models/bannerModel")

class dashboardController{


    get_admin_dashboard_data = async(req, res) => {
        const {id} = req 
        try {
            const totalSale = await myShopWallet.aggregate([
                {
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])
         const totalProduct = await productModel.find({}).countDocuments()
         const totalOrder = await customerOrder.find({}).countDocuments()
         const totalSeller = await sellerModel.find({}).countDocuments()
         const messages = await adminSellerMessage.find({}).limit(3)
         const recentOrders = await customerOrder.find({}).limit(5)
         responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalSeller,
            messages,
            recentOrders,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,

         })

        } catch (error) {
            console.log(error.message)
        }
         
    }
    //end Method 


    get_seller_dashboard_data = async (req, res) => {
        const {id} = req 
        try {
            const totalSale = await sellerWallet.aggregate([
                {
                    $match: { 
                        sellerId: {
                            $eq: id
                        } 
                    }
                },{
                    $group: {
                        _id:null,
                        totalAmount: {$sum: '$amount'}
                    }
                }
            ])

        const totalProduct = await productModel.find({ 
          sellerId: new ObjectId(id) }).countDocuments()
        
        const totalOrder = await authOrder.find({
            sellerId: new ObjectId(id) }).countDocuments()

        const totalPendingOrder = await authOrder .find({
            $and:[
                {
                    sellerId: {
                        $eq: new ObjectId(id)
                    }
                },
                {
                    delivery_status :{
                        $eq: 'pending'
                    }
                }
            ]
        }).countDocuments()
        const messages = await sellerCustomerMessage.find({
            $or: [
                {
                    senderId: {
                        $eq: id
                    } 
                },{
                    receverId: {
                        $eq: id
                    }
                }
            ]
        }).limit(3)   

        const recentOrders = await authOrder.find({
            sellerId: new ObjectId(id)
        }).limit(5)

        responseReturn(res, 200, {
            totalProduct,
            totalOrder,
            totalPendingOrder,
            messages,
            recentOrders,
            totalSale: totalSale.length > 0 ? totalSale[0].totalAmount : 0,

         })

        } catch (error) {
            console.log(error.message)
        }
        
    }
    //end Method 


    add_banner = async(req,res) => {
       const form = formidable({multiples:true})
       form.parse(req, async(err, field, files) => {
        const {productId} = field
        const { mainban } = files

        cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });
        
        try {
            const {slug} = await productModel.findById(productId) 
            const result = await cloudinary.uploader.upload(mainban.filepath, {folder: 'banners'})
            const banner = await bannerModel.create({
                productId,
                banner: {
                    url: result.secure_url,
                    public_id: result.public_id
                },
                link: slug 
            })
            responseReturn(res, 200, {banner,message: "Banner Add Success"})
        } catch (error) {
            responseReturn(res, 500, { error: error.message})
        } 
        
       })
    }
 //end Method 


 get_banner = async(req,res) => {
    const {productId} = req.params
    try {
        const banner = await bannerModel.findOne({ productId: new ObjectId(productId) })
        responseReturn(res,200, {banner})
    } catch (error) {
        responseReturn(res, 500, { error: error.message})
    }

 }
  //end Method 


  update_banner = async (req, res) => {
  const { bannerId } = req.params
  const form = formidable({ multiples: true })

  form.parse(req, async (err, field, files) => {

    if (err) {
      return responseReturn(res, 400, { error: "File parsing failed" })
    }

    const { mainban } = files

    if (!mainban) {
      return responseReturn(res, 400, { error: "Image is required" })
    }

    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true
    })

    try {
      let banner = await bannerModel.findById(bannerId)

      if (!banner) {
        return responseReturn(res, 404, { error: "Banner not found" })
      }

      // ✅ Delete old image using public_id
      if (banner.banner?.public_id) {
        await cloudinary.uploader.destroy(banner.banner.public_id)
      }

      // ✅ Upload new image
      const result = await cloudinary.uploader.upload(
        mainban.filepath,
        { folder: 'banners' }
      )

      // ✅ Update both url + public_id
      await bannerModel.findByIdAndUpdate(bannerId, {
        banner: {
          url: result.secure_url,
          public_id: result.public_id
        }
      })

      banner = await bannerModel.findById(bannerId)

      responseReturn(res, 200, {
        banner,
        message: "Banner Updated Success"
      })

    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  })
}

// end method


get_banners = async(req, res) => {

        try {
            const banners = await bannerModel.aggregate([
                {
                    $sample: {
                        size: 5
                    }
                }
            ])
            responseReturn(res,200,{ banners })
        } catch (error) {
            responseReturn(res, 500, { error: error.message})
        }

    }
    //end Method 




}

module.exports = new dashboardController()