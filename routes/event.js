const express = require("express");
const router = express.Router();
const { addevnt, getAllEvents,getmyEvents,bookevent,acceptattendee ,getallevents,rejectattendee,getparticipatedevents,deleteevent} = require("../controllers/events");
const multer = require("multer");
const { uauth } = require("../middleware/authmiddleware");
const app=express();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/addevent", uauth, upload.single("image"), addevnt);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to parse form data
router.get("/getevents", uauth, getAllEvents);
router.get("/getmyevents", uauth, getmyEvents);
router.post("/bookevent", uauth,bookevent );
router.post("/acceptattendee", uauth,acceptattendee);
router.post("/rejectattendee", uauth,rejectattendee);
router.get("/getparticipatedevents", uauth,getparticipatedevents);
router.post("/deleteevent", uauth,deleteevent);
router.get("/getallevents",uauth,  getallevents);



module.exports = router;
