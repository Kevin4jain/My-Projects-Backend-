const events = require("../models/eventmodel");

const addevnt = async (req, res) => {
  console.log(" Received Data:", req.body);
  // console.log("Uploaded File:", req.file);

  try {
    if (!req.body.eventName) {
      return res.status(400).json({ error: "Event name is required" });
    }

    const existingEvent = await events.findOne({ eventName: req.body.eventName , eventstartdate: req.body.eventstartdate , eventenddate: req.body.eventenddate });
    if (existingEvent) {
      return res.status(400).json({ error: "Event already exists" });
    }

    const imageData = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : null;

    const newEvent = new events({
      eventName: req.body.eventName,
      eventstartdate: req.body.eventstartdate,
      eventenddate: req.body.eventenddate,
      location: req.body.location,
      contactInfo: req.body.contactInfo,
      description: req.body.description,
      eventType: req.body.eventType,
      capacity: req.body.capacity,
      fees: req.body.fees,
      imageURL: imageData,
      companyId: req.user._id,
      organizers_name: req.body.organizers_name,
    });

    await newEvent.save();
    return res.status(201).json({ message: " Event Registered Successfully", event: newEvent });

  } catch (error) {
    console.error(" Event Registration Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllEvents = async (req, res) => {
  try {

    const pageSize= +req.query.pageSize;
    const currentPage= +req.query.page;
    const postQuery =events.find();
    if(pageSize && currentPage){
      postQuery.skip(pageSize*(currentPage-1)).limit(pageSize);
    }
  
    const allEvents = await postQuery

    const formattedEvents = allEvents.map(event => ({
      ...event.toObject(),
      imageURL: event.imageURL ? String(event.imageURL) : null
    }));

    return res.status(200).json(formattedEvents);

  } catch (error) {
    console.error(" Error fetching events:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


const getallevents = async (req, res) => {
  try {

    // if(req.user.role!=="admin" || req.user.role!=="user"){
    //   throw new Error("You are not authorized to view this page");
    // }
    
    const allEvents = await events.find();

    const formattedEvents = allEvents.map(event => ({
      ...event.toObject(),
      imageURL: event.imageURL ? String(event.imageURL) : null
    }));

    return res.status(200).json(formattedEvents);

  } catch (error) {
    console.error(" Error fetching events:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getmyEvents = async (req, res) => {
  try {
    const allEvents = await events.find({ companyId: req.user._id })
      .populate("attendees.userId", "name email") // Populate attendee details
      .exec();

    const formattedEvents = allEvents.map(event => ({
      ...event.toObject(),
      imageURL: event.imageURL ? String(event.imageURL) : null
    }));

    return res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


const bookevent = async (req, res) => {
  try {
    const usr = req.user._id;
    const { eventId, tickets } = req.body;

    const evnt = await events.findById(eventId);
    if (!evnt) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (evnt.capacity < tickets) {
      return res.status(400).json({ message: "Not enough tickets available!" });
    }

    const alreadyBooked = evnt.attendees.some(a => String(a.userId) === String(usr));
    if (alreadyBooked) {
      return res.status(400).json({ message: "You can book the event only once!" });
    }

    const updatedEvent = await events.findByIdAndUpdate(
      eventId,
      {
        $push: { attendees: { userId: usr, ticketsBooked: tickets } },
        $inc: { capacity: -tickets }
      },
      { new: true } 
    );

    return res.status(200).json({ message: "Event booked successfully!", event: updatedEvent });

  } catch (error) {
    console.error("Error booking event:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



const acceptattendee = async (req, res) => {
  try {
    const { a, e } = req.body;

    const evnt = await events.findByIdAndUpdate(
      e,
      {
        $push: { actualattendees: a },
        $set: { "attendees.$[elem].status": "accepted" }
      },
      {
        new: true,
        arrayFilters: [{ "elem.userId": a }] 
      }
    );

    if (!evnt) {
      return res.status(404).json({ error: "Event not found!" });
    }

    return res.status(200).json({ message: "Attendee Accepted!", event: evnt });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const rejectattendee = async (req, res) => {
  try {

    const { a, e,t } = req.body;


    const evnt = await events.findByIdAndUpdate(
      e,
      {
        $inc: { capacity: t },
        $set: { "attendees.$[elem].status": "rejected" }
      },
      {
        new: true,
        arrayFilters: [{ "elem.userId": a }]
      }
    );

    if (!evnt) {
      return res.status(404).json({ error: "Event not found!" });
    }

    return res.status(200).json({ message: "Attendee Rejected!", event: evnt });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getparticipatedevents = async (req, res) => {
  try {
    const id = req.user._id;

    const allEvents = await events.find({ "attendees.userId": id });

    const ress = {};

    allEvents.forEach(event => {
      event.attendees.forEach(attendee => {
        if (String(attendee.userId) === String(id)) {
          ress[event._id] = attendee.status;
        }
      });
    });

    const formattedEvents = allEvents.map(event => ({
      ...event.toObject(),
      imageURL: event.imageURL ? String(event.imageURL) : null
    }));

    return res.status(200).json({ events: formattedEvents, ress });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteevent = async (req, res) => {
  try {
    const { e } = req.body;

    const evnt = await events.findById(e);
    if (!evnt) {
      return res.status(404).json({ error: "Event not found!" });
    }

    if (evnt.actualattendees && evnt.actualattendees.length > 0) {
      return res.status(400).json({ error: "Event can't be deleted now!" });
    }
    if(evnt.iscancelled){
      return res.status(200).json({ msg: "Event is already cancelled!" });
    }

    const updatedEvent = await events.findByIdAndUpdate(
      e,
      { iscancelled: true },
      { new: true }
    );

    return res.status(200).json({ msg: "Event Cancelled Successfully", event: updatedEvent });

   
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};





module.exports = { addevnt, getAllEvents,getmyEvents,bookevent ,acceptattendee,rejectattendee,getparticipatedevents,deleteevent,getallevents};
