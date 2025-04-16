
const express = require("express");
const router = express.Router();
const Userss = require("../models/user");
const {uauth} = require("../middleware/authmiddleware");

router.get("/viewprofile", uauth, async (req, res) => {
  try {
    const user = await Userss.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/editprofile", uauth, async (req, res) => {
  try {
    const { name, address, description } = req.body;
    const user = await Userss.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

 
      user.name = name;
      user.address = address;
      user.description = description;
  

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports=router