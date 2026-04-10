const formidable = require("formidable")
const { responseReturn } = require("../../utiles/response")
const cloudinary = require('cloudinary').v2
const categoryModel = require('../../models/categoryModel')




class categoryController{
  add_category = async(req,res)=> {
    const form = formidable()
    form.parse(req,async(err,fields,files)=>{
      if(err){
        responseReturn(res,404,{error: 'Something went wrong'})
      }else{
        let {name} = fields
        let {image} = files
        name = name.trim()
        const slug = name.split(' ').join('-')

        cloudinary.config({
          cloud_name : process.env.cloud_name,
          api_key: process.env.api_key,
          api_secret: process.env.api_secret,
          secure: true
        })

        try{
          const result = await cloudinary.uploader.upload(image.filepath, {folder: 'categories'})
          if(result){
            const category = await categoryModel.create({
              name,
              slug,
              image: result.url
            })
            responseReturn(res,201,{category,message: 'Category added Succesfully'})
          }
          else{
            responseReturn(res,404,{error: 'Image upload Fail'})
          }
        }catch(error){
          responseReturn(res,500,{error: 'Intenal Server Error'})
        }
      }
    })

  }


  get_category = async(req,res)=>{
    const {page,searchValue,parPage} = req.query
    

    try {
      let skipPage = ''
      if(parPage && page){
        skipPage = parseInt(parPage) * (parseInt(page) - 1)
      }
      
      if(searchValue && page && parPage){
        const categories = await categoryModel.find({
          $text : {$search : searchValue}
        }).skip(skipPage).limit(parPage).sort({createdAt: -1})

        const totalCategory = await categoryModel.find({
          $text : {$search : searchValue}
        }).countDocuments()

        responseReturn(res,200,{categories,totalCategory})
      }
      else if(searchValue === '' && page && parPage){
        const categories = await categoryModel.find({ }).skip(skipPage).limit(parPage).sort({createdAt: -1})

        const totalCategory = await categoryModel.find({ }).countDocuments()
        responseReturn(res,200,{categories,totalCategory})
      }
      else{
        const categories = await categoryModel.find({ }).sort({createdAt: -1})

        const totalCategory = await categoryModel.find({ }).countDocuments()
        responseReturn(res,200,{categories,totalCategory})
      }
      
    } catch (error) {
      
      console.log(error.message)
    }
  }

  //end method

  update_category = async (req, res) => {
  const form = formidable()

  form.parse(req, async (err, fields, files) => {

    if (err) {
      return responseReturn(res, 400, { error: 'Something went wrong' })
    }

    let { name } = fields
    let { image } = files
    const { id } = req.params

    name = name.trim()
    const slug = name.split(' ').join('-')

    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
      secure: true
    })

    try {

      const category = await categoryModel.findById(id)

      if (!category) {
        return responseReturn(res, 404, { error: 'Category not found' })
      }

      let updateData = {
        name,
        slug
      }

      // ✅ If new image uploaded
      if (image) {

        // 🔥 Delete old image from Cloudinary
        if (category.image) {
          const publicId = category.image.split('/').pop().split('.')[0]
          await cloudinary.uploader.destroy(`categories/${publicId}`)
        }

        // ✅ Upload new image
        const result = await cloudinary.uploader.upload(
          image.filepath,
          { folder: 'categories' }
        )

        updateData.image = result.secure_url
      }

      const updatedCategory = await categoryModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )

      responseReturn(res, 200, {
        category: updatedCategory,
        message: 'Category Updated Successfully'
      })

    } catch (error) {
      responseReturn(res, 500, { error: error.message })
    }
  })
}

// end method

deleteCategory = async (req, res) => {

  const { id } = req.params

  cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true
  })

  try {

    const category = await categoryModel.findById(id)

    if (!category) {
      return responseReturn(res, 404, { error: 'Category not found' })
    }

    // 🔥 Delete image from Cloudinary
    if (category.image) {
      const publicId = category.image.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(`categories/${publicId}`)
    }

    // ✅ Delete from DB
    await categoryModel.findByIdAndDelete(id)

    responseReturn(res, 200, {
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.log(`Error deleting category with id ${id}:`, error)
    responseReturn(res, 500, { error: error.message })
  }
}

}


module.exports = new categoryController()