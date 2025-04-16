const mongoose=require("mongoose")

const usrotpverschema=new mongoose.Schema({
    userId:{type: mongoose.Schema.Types.ObjectId, ref: "Userss" },
    email:{type:String,ref:"Userss"},
    otp:String,
    createdAt:Date,
    expiresAt:Date,
});

const usrotpver=mongoose.model("usrotpver",usrotpverschema)

module.exports=usrotpver;