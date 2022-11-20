const express = require('express');
const router = express.Router();
const userController=require("../controllers/userController")
const middleWare= require("../middleware/authenTication")
const productController=require('../controllers/productController')
const cartController= require("../controllers/cartController")
const orderController= require("../controllers/orderController")

//------------------------user-api--------------------------------//
router.post("/register",userController.createUser)

router.post("/login",middleWare.login)

router.put("/user/:userId/profile",middleWare.Mid1,middleWare.authorisation,userController.updateData)

router.get("/user/:userId/profile",middleWare.Mid1,userController.getUser)

//--------------product-api-------------------------------------------------------//

router.post("/products",productController.createProduct)

router.delete("/products/:productId",productController.deleteProduct)

router.put("/products/:productId",productController.UpdateProduct)

router.get("/products",productController.getProduct)

router.get("/products/:productId",productController.getProductById)

//----------------Cart API ---------------------------------------------------------//

router.post("/users/:userId/cart",middleWare.Mid1,middleWare.authorisation,cartController.createCart)

router.put("/users/:userId/cart",middleWare.Mid1,middleWare.authorisation,cartController.updateCart)

router.delete('/users/:userId/cart', middleWare.Mid1,middleWare.authorisation, cartController.deleteCart)

router.get("/users/:userId/cart",middleWare.Mid1,middleWare.authorisation,cartController.getCart)

//---------------Order Api ----------------------------------------------------------//

router.post("/users/:userId/orders",middleWare.Mid1,middleWare.authorisation,orderController.createOrder)

router.put("/users/:userId/orders",middleWare.Mid1,middleWare.authorisation,orderController.updateOrder)




module.exports = router;