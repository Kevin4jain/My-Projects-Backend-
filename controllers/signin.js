const jwt = require("jsonwebtoken");
const Userss = require("../models/user");
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const dotenv = require("dotenv");
dotenv.config();
app.use(cookieParser());
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const { default: V2 } = require("twilio/lib/rest/chat/V2");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_SID;
const client = twilio(accountSid, authToken, {
  lazyLoading: true,
});

const nodemailer = require("nodemailer");
const usrotpver = require("../models/usrotpver");
const { ObjectId } = require("mongodb");
// let s="";

// async function createService() {
//   const service = await client.verify.v2.services.create({
//     friendlyName: "My First Verify Service",
//   });
//   s = service;
//   // console.log(service.sid);
// }
// console.log(s);

// createService();
// const sendOTP = async (req, res, next) => {
//   const { phone } = req.body;
//   // console.log(phone);
//   try {
//     await client.verify.v2.services(serviceId).verifications.create({
//       to: `+$91${phone}`,
//       channel: "sms",
//     });
//     // res.status(200).json(`OTP sent successfully!`);
//     next();
//   } catch (error) {
//     res
//       .status(error?.status || 400)
//       .send(error?.message || "Something went wrong!");
//   }
// };

// const verifyOTP = async (req, res, next) => {
//   const { phone, otp } = req.body;

//   try {
//     const verifiedResponse = await client.verify.v2
//       .services(serviceId)
//       .verificationChecks.create({
//         to: `+91${phone}`,
//         code: otp,
//       });

//     const u1 = await Userss.findOne({ email: req.body.email });
//     u1.verify = true;
//     await u1.save();

//     res.status(200).json(`OTP verified successfully!`);
//   } catch (error) {
//     res.status(error?.status || 400).json("Something went wrong!" + error);
//   }
// };
let transporter = nodemailer.createTransport({
  service: "gmail",
  // host: "smtp.gmail.com",
  // port: 465, 
  // secure: true,
  auth: {
      user: process.env.email, 
      pass: process.env.pass,
  }
});


transporter.verify((error, success) => {
  if (error) {
      console.log("SMTP Connection Error:", error);
  } else {
      console.log("SMTP Ready:", success);
  }
});



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await Userss.findOne({ email });
    if (!u) {
      
      throw new Error("User does not exist,Please register");
    } else {
      const match = await bcrypt.compare(password, u.password);
      if (!match) {
        throw new Error("Incorrect password");
      }
      
      if(u.verify==false){
        await Userss.findOneAndDelete({email});
        throw new Error( "You haven't verified your email id! Please sign up again" );

     }
      const token = jwt.sign({ id: u._id,role:u.role }, process.env.JWT_SECRET,{
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        // secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }).send({
        status: 200,
        message: "Login successful",
        token:token
      });
    }
  } catch (err) {
    res.status(500).send({
      status: 500,
      message: err.message,
    
    });
  }
  // console.log("cookies", req.cookies)
};

const register = async (req, res) => {
  let u;
  try {
    const { name, email, password, role, phone, address, description } =
      req.body;
    const existingUser = await Userss.findOne({
      email,
    });
    if (existingUser && existingUser.verify == true) {
      throw new Error("User already exists");
    }else if(!existingUser){
    const hashedPassword = await bcrypt.hash(password, 10);
     u = new Userss({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      description,
    });
    if (role == "company" && (!address || !description)) {
      throw new Error("Address and description are required for company");
    }
    await u.save();}
    else{
      await Userss.findOneAndDelete
      ({email});
      const hashedPassword = await bcrypt.hash(password, 10);
       u = new Userss({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address,
        description
      });
      if (role == "company" && (!address || !description)) {
        throw new Error("Address and description are required for company");
      }
      await u.save();
      
    }
    return sendVerificationMail(u, res);

    // res.send({
    //   status: 200,
    //   message:
    //     "User registered successfully,now please enter otp to verify the phone number",
    //   data: u,
    // });
  } catch (err) {
    res.status(500).send({
      status: 400,
      message: err.message,
    });
  }
};

const sendVerificationMail = async ({ email, _id }, res) => {
  try {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedOtp = await bcrypt.hash(otp, 10);
      await usrotpver.deleteMany({ email });

      const mailOptions = {
          from: process.env.email, 
          to: email,
          subject: "Verify your Email!",
          html: `<p>Enter <b>${otp}</b> to verify your email </p>`,
      };

      const newOtpVer = new usrotpver({
          email,
          userId: _id,
          otp: hashedOtp,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
      });

      await newOtpVer.save();

      transporter.sendMail(mailOptions, (mailError, info) => {
          if (mailError) {
              console.error("Email Sending Failed:", mailError);
              return res.status(500).json({ status: "Failed!", message: "Error sending verification email. Try again later." });
          }
          return res.json({
              status: "Pending",
              message: "Verification OTP sent to registered email",
              data: { userId: _id, email }
          });
      });

  } catch (e) {
      console.error("OTP Generation Error:", e);
      res.status(500).json({ status: "Failed!", message: "Internal Server Error" });
  }
};
// const updatepwd= async(req,res)=>{
//   try {
//     const { id, password } = req.body;
//     const u = await Userss.findById(id);
//     if (!u) {
//       throw new Error("User does not exist,Please register");
//     } else {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       u.password = hashedPassword;
//       await u.save();
//       res.status(200).send({
//         status: 200,
//         message: "Password updated successfully",
//         data: u,
//       });
//     }
//   } catch (err) {
//     res.status(500).send({
//       status: 500,
//       message: err.message,
//     });
//   }
// }

// const sendchangepwdMail = async ( req, res) => {
//   try{const { email } = req.body;
//   const user=await Userss.findOne({email:email}).select('_id');
//   const id = user?._id.toString(); 

//   console.log(id);
//   if(!id){
//     throw new Error("User is not registered yet!")
//   }
    
  
//     const link=`http://localhost:4200/resetpassword/${id}`;

//       const mailOptions = {
//           from: process.env.email, 
//           to: email,
//           subject: "Update your password!",
//           html: `<p>Click <a>${link}</a> to change your password </p>`,
//       };

     


//       transporter.sendMail(mailOptions, (mailError, info) => {
//           if (mailError) {
//               console.error("Email Sending Failed:", mailError);
//               return res.status(500).json({ status: "Failed!", message: "Error sending verification email. Try again later." });
//           }
//           return res.json({
//               status: "Pending",
//               message: "Reset Password Link sent to registered email",
//               data: {  email }
//           });
//       });

//   } catch (e) {
//       console.error("OTP Generation Error:", e);
//       res.status(500).json({ status: "Failed!", message: "Internal Server Error" });
//   }
// };

const updatepwd = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    const user = await Userss.findById(id);
    if (!user) {
      throw new Error("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send({
      status: 200,
      message: "Password updated successfully",
    });

  } catch (err) {
    res.status(500).send({
      status: 500,
      message: "Invalid or expired token",
    });
  }
};


const sendchangepwdMail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Userss.findOne({ email }).select('_id');
    
    if (!user) {
      throw new Error("User is not registered yet!");
    }

    const id = user._id.toString();

    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const link = `https://my-projects-eight-rouge.vercel.app/resetpassword?token=${token}`;
    console.log(link);
    
    const mailOptions = {
      from: process.env.EMAIL, 
      to: email,
      subject: "Update your password!",
      html: `<p>Click <a href="${link}">here</a> to change your password.</p>`,
    };

    transporter.sendMail(mailOptions, (mailError, info) => {
      if (mailError) {
        console.error("Email Sending Failed:", mailError);
        return res.status(500).json({ status: "Failed!", message: "Error sending reset email. Try again later." });
      }
      return res.json({
        status: "Pending",
        message: "Reset Password Link sent to registered email",
      });
    });

  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ status: "Failed!", message: "Internal Server Error" });
  }
};


const resendOTP =async(req,res)=>{
  try {
      const {email} = req.body;

      const usr = await Userss.findOne({ email });
      if(!usr){
          throw new Error("User is not registered yet!")
      }


      
      return sendVerificationMail(usr, res);
      
  } catch (error) {
      res.json({
          status:"Failed",
          message:error.message
      })
  }
}

const verifyOTP=async (req, res) => {
  try {
      let { email, otp } = req.body;
      if (!email || !otp) {
          throw new Error("Didn't receive OTP!");
      }

      // console.log("Verifying OTP for email:", email);

      const userotpverfn = await usrotpver.findOne({ email });
      if (!userotpverfn) {
          throw new Error("Account record doesn't exist or user has already signed up!");
      }

      const { expiresAt, otp: hashedOtp, userId } = userotpverfn;

      if (expiresAt < Date.now()) {
          await usrotpver.deleteMany({ email }); 
          throw new Error("The OTP is now expired, please try again!");
      }

      const validOtp = await bcrypt.compare(otp, hashedOtp);
      if (!validOtp) {
          throw new Error("Invalid OTP!");
      }

      await Userss.updateOne({ email }, { verify: true });

      await usrotpver.deleteMany({ email });

      res.json({
          status: "Verified",
          message: "User is verified successfully!"
      });
  } catch (error) {
      res.status(400).json({
          status: "Failed",
          message: error.message
      });
  }
};


const logout = async (req, res) => {
  try {
    if (!req.cookies.token) {
      throw new Error("User not logged in");
    }
    res.clearCookie("token");
    res.send({
      status: 200,
      message: "Logged out successfully",
    });
  } catch (err) {
    res.send({
      status: 400,
      message: err.message,
    });
  }
};

module.exports = { login, register, logout, resendOTP, verifyOTP ,sendchangepwdMail,updatepwd};


//http://localhost:4200/resetpassword/%7B_id:new ObjectId('67dbb61279ebac4154d1049e)}