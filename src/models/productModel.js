const mongoose=require('mongoose')


const productSchema= new mongoose.Schema({
  title: {type:String, required:"title is required", trim:true, unique: true},
  description: {type:String, required:"description is required", trim:true},
  price: {type:Number,required:"price is required"},
  currencyId: {type:String, required:"currencyId is required", trim:true},
  currencyFormat: {type:String, required:"currencyFormat is required", trim:true},
  isFreeShipping: {type: Boolean, default: false},
  productImage: {type:String, required:"productImage is required", trim:true},  // s3 link
  style: {type:String,trim:true},
  availableSizes: { type:[String] ,enum:["S", "XS","M","X", "L","XXL", "XL"]},
  installments: {type:Number},
  deletedAt: {type:Date}, 
  isDeleted: {type:Boolean, default: false},
},{timestamps:true})

module.exports=mongoose.model("product",productSchema)