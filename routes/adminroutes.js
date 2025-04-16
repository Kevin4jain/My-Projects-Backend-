const express = require("express");
const router = express.Router();
const { uauth } = require("../middleware/authmiddleware");
const Userss = require("../models/user");
const events=require("../models/eventmodel");
router.get("/users",async (req, res) => {
    try {
        const users = await Userss.find({role: "user"}).select("-password");
        if (!users) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
})

router.get("/companies",async (req, res) => {
    try {
        const companies = await Userss.find({role: "company"}).select("-password");
        if (!companies) {
            return res.status(404).json({ message: "No companies found" });
        }
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ message: "Error fetching companies" });
    }
})
router.get("/events",async (req,res)=>{
    try{
        const eventss=await events.find();
        if(!eventss){
            return res.status(404).json({message:"No events found"});
        }
        res.status(200).json(eventss);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Error fetching Events" });
    }
})

router.delete("/:type/:id",async(req,res)=>{
    const { type, id } = req.params;

    try {
        let deletedItem;
        if (type === "user" || type === "company") {
            deletedItem = await Userss.findByIdAndDelete(id);
        } else if (type === "event") {
            deletedItem = await events.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ message: "Invalid type" });
        }

        if (!deletedItem) {
            return res.status(404).json({ message: `${type} not found` });
        }

        res.status(200).json({ message: `${type} deleted successfully` });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Error deleting item" });
    }
})

router.put("/:type/:id",async(req,res)=>{
    const data=req.body;
    const { type, id } = req.params;
    try {
        if(type=="user" || type=="company"){
            await Userss.findByIdAndUpdate(id,data);
            res.status(200).json({message:"user updated successfully"});
        }else if(type=="event"){
            await events.findByIdAndUpdate(id,data);
            res.status(200).json({message:"event updated successfully"});
        }else{
            return res.status(400).json({ message: "Invalid type" });
        }
        
        
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Error updating item" });
        
    }
})







module.exports = router;