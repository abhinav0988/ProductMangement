const userModel = require("../models/userModel")
const bcrypt = require('bcrypt');
const mongoose = require("mongoose")
const { uploadFile } = require("../aws/awsController")


//------------------------------Regex Validation---------------------------------------------------//

let stringRegex = /^[A-Za-z]{1}[A-Za-z]{1,1000}$/
let EmailRegex = /^[A-Za-z1-9]{1}[A-Za-z0-9._]{1,}@[A-Za-z1-9]{2,15}[.]{1}[A-Za-z.]{2,15}$/
let pinRegex = /^[1-9]{1}[0-9]{5}$/
let mobileRegex = /^[6-9]{1}[0-9]{9}$/

let streetRegex = /^[A-Za-z1-9]{1}[A-Za-z0-9./ ,-]{1,10000}$/
let Passwordregex = /^[A-Z0-9a-z]{1}[A-Za-z0-9.@#$&]{7,14}$/

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}
//---------------------------------------------------------------------------------//
const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === null) {
        return false
    }
    if (typeof (value).trim().length == 0) {
        return false
    }
    if (typeof (value) === "string" && (value).trim().length > 0) {
        return true
    }
}

// ************************************************* POST /register ************************************************************ //

const createUser = async function (req, res) {
    try {
        let body = JSON.parse(JSON.stringify(req.body))
        let files = req.files

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: "Please provide the data" })
        }

        if (!body.fname) {
            return res.status(400).send({ Status: false, message: "Please enter the first name" })
        }
        if (!stringRegex.test(body.fname)) {
            return res.status(400).send({ Status: false, message: "first name is not valid" })
        }
        if (!body.lname) {
            return res.status(400).send({ Status: false, message: "Please enter the last name" })
        }
        if (!stringRegex.test(body.lname)) {
            return res.status(400).send({ Status: false, message: "last name is not valid" })
        }
        //---------Email and Phone validation -------------------------------------------------------------//
        if (!body.email) {
            return res.status(400).send({ Status: false, message: "Please enter the email" })
        }
        if (!EmailRegex.test(body.email)) {
            return res.status(400).send({ Status: false, message: "email is not valid" })
        }
        if (!body.phone) {
            return res.status(400).send({ Status: false, message: "Please enter the 10 digit indian mobile number" })
        }
        if (!mobileRegex.test(body.phone)) {
            return res.status(400).send({ Status: false, message: "mobile number is not valid" })
        }
        //---------Email and Phone uniqcheck -------------------------------------------------------------//
        let uniqueCheck = await userModel.findOne({ email: body.email.toLowerCase().trim() })
        if (uniqueCheck) {
            if (uniqueCheck.email) {
                return res.status(400).send({ Status: false, message: "This email has been used already" })
            }
        }
        let uniqueCheckPhone = await userModel.findOne({ phone: body.phone })
        if (uniqueCheckPhone) {
            if (uniqueCheckPhone.phone) {
                return res.status(400).send({ Status: false, message: "This phone has been used already" })
            }
        }
        //----------------------------------------------------------------------------------------------------------//
        if (!body.password) {
            return res.status(400).send({ Status: false, message: "Please enter the password" })
        }
        if (!Passwordregex.test(body.password)) {
            return res.status(400).send({ Status: false, message: "Please enter the valid password" })
        }
        //------------------------------------------Address validation------------------------------------------------------------------//

        if (!body.address) {
            return res.status(400).send({ Status: false, message: "Please enter the address" })
        }

        body.address = JSON.parse(body.address)

        if (Object.keys(body.address).length === 0) {
            return res.status(400).send({ Status: false, message: "Please provide the address data" })
        }

        let { shipping, billing } = body.address

        if (!shipping) {
            return res.status(400).send({ Status: false, message: "Please enter the shipping address" })
        }
        if (typeof shipping != "object") {
            return res.status(400).send({ status: false, message: "address should be an object" })
        }
        if (shipping) {
            if (!shipping.street) {
                return res.status(400).send({ Status: false, message: "Please enter the shipping street address" })
            }
            if (!streetRegex.test(shipping.street)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid shipping street address" })
            }
            if (!shipping.city) {
                return res.status(400).send({ Status: false, message: "Please enter the shipping city address" })
            }
            if (!streetRegex.test(shipping.city)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid shipping city address" })
            }
            if (!shipping.pincode) {
                return res.status(400).send({ Status: false, message: "Please enter the shipping pin code" })
            }
            if (!pinRegex.test(shipping.pincode)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid shipping pin code" })
            }
        }
        if (!billing) {
            return res.status(400).send({ Status: false, message: "Please enter the billing address" })
        }
        if (typeof billing != "object") {
            return res.status(400).send({ status: false, message: "address should be an object" })
        }
        if (billing) {
            if (!billing.street) {
                return res.status(400).send({ Status: false, message: "Please enter the billing street address" })
            }
            if (!streetRegex.test(billing.street)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid billing street address" })
            }
            if (!billing.city) {
                return res.status(400).send({ Status: false, message: "Please enter the billing city address" })
            }
            if (!streetRegex.test(billing.city)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid billing city address" })
            }
            if (!billing.pincode) {
                return res.status(400).send({ Status: false, message: "Please enter the billing pin code" })
            }
            if (!pinRegex.test(billing.pincode)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid billing pin code" })
            }
        }

        //------------------------------------Profile Image Validation------------------------------------------------------//
        if (body.profileImage) {
            if (typeof body.profileImage === "string") {
                return res.status(400).send({ Status: false, message: "Please upload the image" })
            }
        }
        if (files.length === 0) {
            return res.status(400).send({ Status: false, message: "Sorry you have not uploaded the file" })
        }
        if (!files[0].fieldname) {
            return res.status(400).send({ Status: false, message: "Please upload the profile image" })
        }
        if(files.length>0){

            if(files[0].mimetype == "image/jpeg" ||files[0].mimetype =="image/png"){
                files=files
            }
            else{
                return res.status(400).send({ Status: false, message: "Image could not be upload, please use jpeg/png" })
            }

        }
       

   
        let uploadedFileURL = await uploadFile(files[0])

        if (!uploadedFileURL) {
            return res.status(400).send({ Status: false, message: "Image could not be upload" })
        }

        body.profileImage = uploadedFileURL

        //------------------------------------------Encrypting the password------------------------------------------------------//

        body.password = await bcrypt.hash(body.password, 10)

        //----------------------------------------User Creation-------------------------------------------------------//
        const createUser = await userModel.create(body)

        let resultUser= await userModel.findOne({_id:createUser._id}).select({"__v": 0})

        return res.status(201).send({ Status: true, data: resultUser })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

// ***************************************** GET /user/:userId/profile ************************************************** //
const getUser = async function (req, res) {

    try {

        const userId = req.params.userId
        const userIdFromToken = req.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "valid userId is required" })
        }
        if (userIdFromToken != userId) {
            return res.status(401).send({ status: false, message: "unauthorized access" })
        }
        const userGet = await userModel.findOne({ _id: userId }).select({"__v": 0})
        if (!userGet)
            return res.status(400).send({ status: false, message: "no data found with user Id" })

        return res.status(200).send({ status: true, message: "user Details", data: userGet })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }

}

// ********************************************* PUT /user/:userId/profile  ***************************************************** //
const updateData = async function (req, res) {
    try {



        let body = JSON.parse(JSON.stringify(req.body))
        let files = req.files
        let User_id = req.params.userId

        let { fname, lname, email, phone, password, address, profileImage } = body;

        if (Object.keys(body).length === 0) {
            return res.status(400).send({ Status: false, message: "Please provide the data" })
        }

        if (fname === "" || fname) {
            if (!stringRegex.test(fname)) {
                return res.status(400).send({ Status: false, message: "first name is not valid" })
            }

        }

        if (lname || lname === "") {
            if (!stringRegex.test(lname)) {
                return res.status(400).send({ Status: false, message: "last name is not valid" })
            }
        }

        //-----------------------------------if user wants to update the Email/Phone ---------------------------------------------//
        if (email || email === "") {
            if (!EmailRegex.test(email)) {
                return res.status(400).send({ Status: false, message: "email is not valid" })
            }
            email = email.toLowerCase().trim()
        }
        if (phone || phone === "") {
            if (!mobileRegex.test(phone)) {
                return res.status(400).send({ Status: false, message: "mobile number is not valid" })
            }
        }

        //---------------------------------------Email and Phone uniqcheck -----------------------------------------//


        let uniqueCheck = await userModel.findOne({ email: email })
        if (uniqueCheck) {
            if (uniqueCheck.email) {
                return res.status(400).send({ Status: false, message: "This email has been used already" })
            }
        }
        let checkPhone = await userModel.findOne({ phone: phone })
        if (checkPhone) {

            if (checkPhone.phone) {
                return res.status(400).send({ Status: false, message: "This Phone has been used already" })
            }
        }

        //----------------------------------If user wants to update the Password--------------------------------------------------------//

        if (password || password === "") {
            if (!Passwordregex.test(password)) {
                return res.status(400).send({ Status: false, message: "Please enter the valid password" })
            }
            password = await bcrypt.hash(password, 10)
        }
        //------------------------------------------Address validation------------------------------------------------------------------//

        if (address === "") {
            return res.status(400).send({ Status: false, message: "Please provide the valid address data" })
        }


        if (address) {

            address = JSON.parse(address)

            if (Object.keys(address).length === 0) {
                return res.status(400).send({ Status: false, message: "Please provide the address data" })
            }

            let { shipping, billing } = address

            //-------------------------If user wants to Update Shipping Address ------------------------------------//
            if (shipping === "" || shipping === {}) {
                return res.status(400).send({ Status: false, message: "Please provide the valid shipping address data" })
            }

            if (shipping) {

                if (shipping.street || shipping.street === "") {
                    if (!streetRegex.test(shipping.street)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid shipping street address" })
                    }
                }

                if (shipping.city || shipping.city === "") {
                    if (!streetRegex.test(shipping.city)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid shipping city address" })
                    }
                }

                if (shipping.pincode || shipping.pincode === "") {
                    if (!pinRegex.test(shipping.pincode)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid shipping pin code" })
                    }
                }
            }
            //--------------------If User wants to Update Billing Address -----------------------------------------------//
            if (billing || billing === "") {
                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "address should be an object" })
                }
                if (billing.street || billing.street === "") {
                    if (!streetRegex.test(billing.street)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid billing street address" })
                    }
                }

                if (billing.city || billing.city === "") {
                    if (!streetRegex.test(billing.city)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid billing city address" })
                    }
                }
                if (billing.pincode || billing.pincode === "") {
                    if (!pinRegex.test(billing.pincode)) {
                        return res.status(400).send({ Status: false, message: "Please enter the valid billing pin code" })
                    }
                }
            }
        }

        //-------------------------------------If user wants to update Profile Image----------------------------------------//

        if (profileImage || profileImage === "") {
            if (typeof profileImage === "string") {
                return res.status(400).send({ Status: false, message: "Please upload the image" })
            }
        }
        if(files.length>0){

            if(files[0].mimetype == "image/jpeg" ||files[0].mimetype =="image/png"){
                files=files
            }
            else{
                return res.status(400).send({ Status: false, message: "Image could not be upload, please use jpeg/png" })
            }

        }
       
        if (files && files.length > 0) {

            let uploadedFileURL = await uploadFile(files[0])
            body.profileImage = uploadedFileURL

            let updateProfile = await userModel.findByIdAndUpdate({ _id: User_id }, { fname: fname, lname: lname, password: password, email: email, phone: phone, profileImage: profileImage, address: address }, { new: true }).select({"__v": 0})

            return res.status(200).send({ Status: true, data: updateProfile })
        }
        //----------------------------------If User does not want update Profile Image----------------------------------------------//

        let changeProfile = await userModel.findByIdAndUpdate({ _id: User_id }, { fname: fname, lname: lname, password: password, email: email, phone: phone, profileImage: profileImage, address: address }, { new: true }).select({"__v": 0})

        return res.status(200).send({ Status: true, data: changeProfile })

    } catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}

module.exports = { createUser, updateData, getUser }