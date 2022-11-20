const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const bearerToken = require('bearer-token')
const mongoose=require("mongoose")


//-------------------------------------------------------------------------------------------//
let EmailRegex = /^[A-Za-z1-9]{1}[A-Za-z0-9._]{1,}@[A-Za-z1-9]{2,15}[.]{1}[A-Za-z.]{2,15}$/

let Passwordregex = /^[A-Z0-9a-z]{1}[A-Za-z0-9.@#$&]{7,14}$/

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

// ************************************************************* POST /login ************************************************************ //
const login= async function(req,res){
    try{
        let body= req.body

        if(Object.keys(body).length===0){
            return res.status(400).send({ Status: false, message: "Please put some data into body" })
        }
        if(!body.email){
            return res.status(400).send({ Status: false, message: "Please enter the email" })
        }
        if(!EmailRegex.test(body.email)){
            return res.status(400).send({ Status: false, message: "Please enter the valid email" }) 
        }
        if(!body.password){
            return res.status(400).send({ Status: false, message: "Please enter the password" })
        }
        if(!Passwordregex.test(body.password)){
            return res.status(400).send({Status: false , message:"Please enter the valid password"})  
        } 
//--------------------------------------------------------------------------------------------//
        body.email= body.email.toLowerCase().trim()

//--------------------------------------------------------------------------------------------//
       
        
        let checkDetail= await userModel.findOne({email:body.email})
        if(!checkDetail){
            return res.status(404).send({ Status: false, message: "Could not find the detail of User, Please check your email" }) 
        }
        let checkPassword = await bcrypt.compare(body.password,checkDetail.password);
      
        if (!checkPassword) {
            return res.status(400).send({ status: false, message: "Password is not correct" });
          }

        let userId= checkDetail._id
        let token = jwt.sign({

            UserId: userId,
            batch: "Uranium"

        }, 'FunctionUp Group40', { expiresIn: '86400s' });    // token expiry for 24hrs

        let result={}
        result={userId,token}
        return res.status(200).send({ status: true, message: "User login successfull", data: result})

    }catch(err){
        return res.status(500).send({ Status: false, message: err.message })
    }
}



const Mid1 = async function (req, res, next) {
    try {
      
        let token = req.headers["authorization"]

        if (!token) {
            return res.status(400).send({ Status: false, message: " Please enter the token" })
        }

        let user_token= token.split(" ")

        //------------------------------------------------------------------------------------------------//
        jwt.verify(user_token[1],"FunctionUp Group40",{ ignoreExpiration: true },function (err, decoded) {
            if (err) {
                return res.status(400).send({status : false, meessage : "token invalid"})
            }
             else {

              //The static Date.now() method returns the number of milliseconds elapsed since January 1, 1970
            
              if (Date.now() > decoded.exp * 1000) {
                return res.status(401).send({status: false,msg: "Session Expired",});
              }
              req.userId = decoded.UserId;
             return next();
            }});


        //-----------------------------------------------------------------------------------------------//

    }
    catch (err) {
        return res.status(500).send({ Status: false, message: err.message })
    }
}


// ----------------------------this middleware will be used to authorisation ------------------//

const authorisation= async function(req,res,next){
    try{
        
        const userIdbyParams = req.params.userId

        let tokenVerification = req.userId

        if (!isValidObjectId(userIdbyParams)) {
            return res.status(400).send({ status: false, messsage: "plzz enter valid user id" })
        }

        const checkUserId = await userModel.findOne({ _id: userIdbyParams, isDeleted: false })

        if (!checkUserId) {
            return res.status(400).send({ status: false, messsage: "user not found" })
        }

        if (userIdbyParams != tokenVerification) {
            return res.status(400).send({ status: false, messsage: "sorry you are not authorize" })
        }
        else{
           return next()
        }

    }catch(err){
        return res.status(500).send({ Status: false, message: err.message })
    }
}


module.exports={login,Mid1,authorisation}