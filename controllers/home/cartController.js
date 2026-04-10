const cartModel = require("../../models/cartModel")
const wishlistModel = require("../../models/wishlistModel")
const { responseReturn } = require("../../utiles/response")
const { mongo: {ObjectId}} = require('mongoose')

class cartController{
   
    add_to_cart =  async(req, res) => {
        //console.log(req.body)

        const { userId, productId, quantity } = req.body
        try {
            const product = await cartModel.findOne({
                $and: [{
                    productId : {
                        $eq: productId
                    }
                },
                {
                    userId: {
                        $eq: userId
                    }
                }
            ]
            })

            if (product) {
                responseReturn(res,404,{error: "Product Already Added To Cart" })
            } else {
                const product = await cartModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res,201,{message: "Added To Cart Successfully" , product})
            }
            
        } catch (error) {
            console.log(error.message)
        }
    }
    // End Method 


    get_cart_products = async(req,res)=>{
      const co = 5;
      const {userId} = req.params
      try{
        const cart_products = await cartModel.aggregate([{
          $match: {
            userId: {
              $eq: new ObjectId(userId)
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'products'
          }
        }
      ])
      let buy_product_item = 0
      let calculatePrice = 0
      let cart_product_count = 0
      const outOfStockProduct = cart_products.filter(p => p.products[0].stock < p.quantity)
      for(let i=0;i<outOfStockProduct.length;i++){
        cart_product_count = cart_product_count + outOfStockProduct[i].quantity
      }

      const stockProduct = cart_products.filter(p => p.products[0].stock >= p.quantity)
      for(let i=0;i<stockProduct.length;i++){
        const {quantity} = stockProduct[i]
        cart_product_count = buy_product_item + quantity
        buy_product_item = buy_product_item + quantity
        const {price,discount} = stockProduct[i].products[0]
        if(discount !==0){
          calculatePrice = calculatePrice + quantity * (price - Math.floor((price * discount) / 100))
        }else{
          calculatePrice = calculatePrice + quantity * price
        }
      }
      let p = []
      let unique = [...new Set(stockProduct.map(p => p.products[0].sellerId.toString()))]
      for(let i=0;i<unique.length;i++){

        let price = 0;
        for(let j=0;j<stockProduct.length;j++){
          const tempProduct = stockProduct[j].products[0]
          if(unique[i] === tempProduct.sellerId.toString()){
            let pri = 0
            if(tempProduct.discount !==0){
              pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount)/100)
            }
            else{
              pri = tempProduct.price
            }
            pri = pri - Math.floor((pri * co) / 100)
        price = price + pri * stockProduct[j].quantity
        p[i] = {
            sellerId: unique[i], 
            shopName: tempProduct.shopName,
            price,
            products: p[i] ? [
                ...p[i].products,
                {
                    _id: stockProduct[j]._id,
                    quantity: stockProduct[j].quantity,
                    productInfo: tempProduct 
                }
            ] : [{
                _id: stockProduct[j]._id,
                quantity: stockProduct[j].quantity,
                productInfo: tempProduct 
            }]
          } 
          }

        }
      }
        //console.log(calculatePrice)
        //console.log(cart_products)
        responseReturn(res,200,{
          cart_products:p,
          price: calculatePrice,
          cart_product_count,
          shipping_fee: 20 * p.length,
          outOfStockProduct,
          buy_product_item

        })

      }catch(error){
        console.log(error.message)
      }
    }

    //end method

    delete_cart_products = async(req,res)=>{
      const {cart_id} = req.params
      try{
        await cartModel.findByIdAndDelete(cart_id)
        responseReturn(res,200,{message: "product Remove Succesfullly"})
      }catch(error){
        console.log(error.message)
      }
    }

    //end method

    quantity_inc = async (req, res) => {
            const {cart_id } = req.params
            try {
                const product = await cartModel.findById(cart_id)
                const {quantity} = product
                await cartModel.findByIdAndUpdate(cart_id,{quantity: quantity + 1 })
                responseReturn(res,200,{message: "Qty Updated" })
                
            } catch (error) {
                console.log(error.message)
            }
              
        }
            // End Method 

      quantity_dec  = async (req, res) => {
            const {cart_id } = req.params
            try {
                const product = await cartModel.findById(cart_id)
                const {quantity} = product
                await cartModel.findByIdAndUpdate(cart_id,{quantity: quantity - 1 })
                responseReturn(res,200,{message: "Qty Updated" })
                
            } catch (error) {
                console.log(error.message)
            }
              
        }
            // End Method 


        
        add_wishlist = async (req, res) => {
        const { slug } = req.body
        try {
            const product = await wishlistModel.findOne({slug})
                if (product) {
                    responseReturn(res, 404 ,{
                        error: 'Product Is Already In Wishlist'
                    })
                } else {
                    await wishlistModel.create(req.body)
                    responseReturn(res, 201 ,{
                        message: 'Product Add to Wishlist Success'
                    })
                }
        } catch (error) {
            console.log(error.message)
        }


       }
       // End Method 

       get_wishlist = async (req, res) => {
        //console.log("kkkkkkkkkkkk")
        const { userId } = req.params
        // console.log(userId)
        try {
            const wishlists = await wishlistModel.find({
                userId
            })
            responseReturn(res, 200, {
                wishlistCount: wishlists.length,
                wishlists
            })
            
        } catch (error) {
            console.log(error.message)
        }
       } 
        // End Method 


      remove_wishlist = async (req, res) => {
           const {wishlistId} = req.params
           try {
            const wishlist = await wishlistModel.findByIdAndDelete(wishlistId) 
            responseReturn(res, 200,{
                message: 'Wishlist Product Remove',
                wishlistId
            })
            
           } catch (error) {
            console.log(error.message)
           }
        }
 // End Method 


}



      


module.exports = new cartController()