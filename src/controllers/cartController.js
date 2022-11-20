const mongoose = require("mongoose")
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const jwt = require('jsonwebtoken')
const { update } = require("../models/cartModel")
const { is } = require("express/lib/request")


//-----------------------------------------some validations-----------------------------------------------------//


const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

let digitRegex = /^[1-9]{1}[0-9]{0,10000}$/
let removeProductRegex = /^[0-1]{1}$/

// **************************************** POST /users/:userId/cart ********************************************************//
const createCart = async (req, res) => {
    try {

        const data = req.body
        const userIdbyParams = req.params.userId

        let { productId, quantity, cartId } = data

        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, messsage: "Please enter some data" })
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, messsage: "plzz enter valid productId" })
        }

        const isProductPresent = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!isProductPresent) {
            return res.status(404).send({ status: false, messsage: `product not found by this prodct id ${productId}` })
        }
        if (quantity === "") {
            return res.status(400).send({ status: false, messsage: "plzz enter valid quatity , please use digit" })
        }
        if (!quantity) {
            quantity = 1
        }
        if (quantity) {
            if (!digitRegex.test(quantity)) {
                return res.status(400).send({ status: false, messsage: "plzz enter valid quatity" })
            }
        }


        if (typeof quantity === "string") {
            return res.status(400).send({ status: false, messsage: "plzz enter quantity in Number not as an including string" })
        }

        data.userId = userIdbyParams

        data.items = [{ productId: isProductPresent._id, quantity: quantity }]

        console.log("help  ",data.items)

        data.totalPrice = (isProductPresent.price) * quantity

        data.totalItems = data.items.length

        //-------------if same user wants to add  one more produt --------------------------------------------------//

        if (cartId) {
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, messsage: "plzz enter valid cartId" })
            }
        }
        //----------------------------------------------------------------------------------------------------------//
        let checkCart = await cartModel.findOne({ userId: userIdbyParams })

        if (checkCart) {
            if (!cartId) {
                return res.status(400).send({ status: false, messsage: "plzz enter cartId" })
            }

            let existCart = await cartModel.findOne({ _id: cartId, userId: userIdbyParams })

            if (!existCart) {
                return res.status(400).send({ status: false, messsage: "does not exist cartId with given user / cart does not exist" })
            }

            if (existCart) {
                for (let i = 0; i < existCart.items.length; i++) {
                    if (existCart.items[i].productId == productId) {
                        existCart.items[i].quantity = existCart.items[i].quantity + quantity

                        items = existCart.items

                        totalPrice = (existCart.totalPrice) + (isProductPresent.price * quantity)

                        let updatnewCart = await cartModel.findOneAndUpdate({ id: cartId, userId: userIdbyParams }, { items: items, totalPrice: totalPrice }, { new: true }).select({ "_v": 0 })

                        return res.status(201).send({ status: true, message: "product added success", data: updatnewCart })
                    }
                }
            }

        }
        let addingCart = await cartModel.findOneAndUpdate({ userId: userIdbyParams }, { $push: { items: data.items }, $inc: { totalPrice: data.totalPrice, totalItems: data.totalItems } }, { new: true }).select({ "__v": 0 })

        if (addingCart) {
            return res.status(201).send({ status: true, message: "one more item added succefully", data: addingCart })
        }

        //-------------------let's create a cart  ---------------------------------------------------------//

        let createCart = await cartModel.create(data)

        //------------this line is being use to remove _V:0   ---------------------------------------------//

        return res.status(201).send({ status: true, message: "cart added", data: createCart })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}
// ******************************************************************** PUT /users/:userId/cart **********************************************************************************//

const updateCart = async function (req, res) {
    try {

        const userId = req.params.userId
        const { cartId, productId, removeProduct } = req.body

        if (Object.keys(req.body).length === 0) {
            return res.status(400).send({ status: false, message: "Please provide data in body" })
        }

        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid Cart Id" })
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid Product Id" })
        }

        if (typeof removeProduct === "number") {
            return res.status(400).send({ status: true, message: "Please provide removeProduct as a string" })
        }

        if (!removeProduct) {
            return res.status(400).send({ status: true, message: "Please provide removeProduct in body" })
        }
        if (!removeProductRegex.test(removeProduct)) {
            return res.status(400).send({ status: true, message: "removeProduct must be 0 or 1" })
        }

        let cart = await cartModel.findById({ _id: cartId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "Cart not found" })
        }

        if (cart.totalPrice == "0" || cart.totalItems == "0") {
            return res.status(400).send({ status: false, message: "Cart is empty" })
        }

        let cartMatch = await cartModel.findOne({ userId: userId })
        if (!cartMatch) {
            return res.status(401).send({ status: false, message: "This cart doesnot belong to you. Please check the input" })
        }
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }

        if (removeProduct == 0) {

            for (let i = 0; i < cart.items.length; i++) {

                if (cart.items[i].productId == productId) {

                    const productPrice = product.price * cart.items[i].quantity

                    const updatePrice = cart.totalPrice - productPrice

                    cart.items.splice(i, 1)

                    let updateItems = cart.totalItems - 1
                    const updateItemsAndPrice = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })

                    return res.status(200).send({ status: true, message: "Succesfully Updated in the cart", data: updateItemsAndPrice })
                }
            }

        }

        if (removeProduct == 1) {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    cart.items[i].quantity = cart.items[i].quantity - 1

                    if (cart.items[i].quantity < 1) {
                        const updateItems = cart.totalItems - 1
                        const productPrice = product.price * 1
                        const updatePrice = cart.totalPrice - productPrice

                        cart.items.splice(i, 1)

                        const updateItemsAndPrice = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems }, { new: true })
                        return res.status(200).send({ status: true, message: "Product has been removed successfully from the cart", data: updateItemsAndPrice })

                    }
                    else {

                        const updatedPrice = cart.totalPrice - (product.price * 1)
                        const updatedQuantityAndPrice = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cart.items, totalPrice: updatedPrice }, { new: true })
                        return res.status(200).send({ status: true, message: "Quantity has been updated successfully in the cart", data: updatedQuantityAndPrice })
                    }
                }
            }
        }
        return res.status(404).send({ status: false, message: "cart does not exist this prodcut" })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

// **************************************** GET /users/:userId/cart *****************************************************************************//
const getCart = async function (req, res) {
    try {

        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.send(400).send({ status: false, message: "user id is not valid" })
        }

        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
            return res.status(400).send({ status: false, message: "cart not exists with this userId" })
        }

        if (findCart.totalPrice === 0) {
            return res.status(404).send({ status: false, message: "cart is empty" })
        }
        return res.status(200).send({ status: true, message: "cart details", data: findCart })

    }

    catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

// ******************************************************** DELETE /users/:userId/cart ******************************************************* //
const deleteCart = async function (req, res) {
    try {
        // Validate params
        userId = req.params.userId

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({ userId: userId })
        if (!cartSearch) {
            return res.status(404).send({ status: false, message: "cart doesnot exist" })
        }

        const cartdelete = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalItems: 0, totalPrice: 0 }, { new: true })
        return res.status(204).send({ status: true, message: "Cart deleted" })

    }
    catch (err) {
        //console.log("This is the error :", err.message)
        res.status(500).send({Status:false, message: "Error", error: err.message })
    }
}

module.exports = { createCart, deleteCart, updateCart, getCart }



