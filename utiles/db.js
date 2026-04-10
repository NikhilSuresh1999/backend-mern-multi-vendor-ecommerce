const mongoose = require('mongoose');

module.exports.dbConnect = async() =>{
  try{
    if(process.env.MODE === 'pro'){
      await mongoose.connect(process.env.DB_PRO_URL,{useNewURLParser: true})
      console.log("Producton database connect")
    }else{

      await mongoose.connect(process.env.DB_LOCAL_URL,{useNewURLParser: true})
      console.log("local database connect")

    }

    
    // console.log("Database Connected");

  }catch(error){

    console.log(error.message);

  }
  
}