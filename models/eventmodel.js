
const mongoose = require("mongoose");
const Userss=require("./user")
const eventSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userss",
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventstartdate: {
      type: Date,
      required: true,
    },
    eventenddate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fees: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
    },
    attendees: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Userss",
            required: true,
          },
          ticketsBooked: {
            type: Number,
            required: true,
            min: 1,
          },
          status:{
            type: String,
            enum: ["accepted", "rejected", "waiting"],
            default:"waiting"
          }
        },
      ],
    actualattendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Userss",
      },
    ],

    imageURL: {
      type: String,
    },
    contactInfo: {
      type: String,
    },
    iscancelled:{
      type:Boolean,
      default:false
    },
    organizers_name:{
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const events = mongoose.model("events", eventSchema);
module.exports = events;
