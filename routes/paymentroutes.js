
const { uauth } = require("../middleware/authmiddleware");
const event = require("../models/eventmodel");
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.SK);

router.post("/:id/events/payment-intent", uauth, async (req, res) => {
  const { Ticket } = req.body;
  const _id = req.params.id;

  if (!Ticket || Ticket <= 0) {
    return res.status(400).json({ message: "Invalid ticket count" });
  }

  // console.log('Ticket:', Ticket); // Debugging
  // console.log('Event ID:', _id); // Debugging

  const events = await event.findById(_id);
  if (!events) {
    return res.status(400).json({ message: "Event not found" });
  }

  const totalCost = events.fees * Ticket;
  // console.log('Total Cost:', totalCost); // Debugging

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCost*100,
      currency: "inr",
      metadata: {
        _id: String(_id),
        userId: String(req.user._id),
      },
    });

    if (!paymentIntent.client_secret) {
      console.error('Missing client_secret in Payment Intent:', paymentIntent);
      return res.status(500).json({ message: "Error creating payment intent" });
    }

    const response = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret.toString(),
      totalCost,
    };
    // console.log('Payment Intent Created:', response); // Debugging
    res.send(response);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/:_id/events", uauth, async (req, res) => {
  try {
    const paymentIntentId = req.body.paymentIntentId;
    const tickets = req.body.Ticket;
    const eventId = req.params._id;

    // console.log('Payment Intent ID:', paymentIntentId); // Debugging
    // console.log('Event ID:', eventId); // Debugging
    // console.log('Tickets:', tickets); // Debugging

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(400).json({ message: "Payment Intent not found" });
    }

    // Validate metadata
    if (
      paymentIntent.metadata._id !== eventId ||
      paymentIntent.metadata.userId !== String(req.user._id)
    ) {
      return res.status(400).json({ message: "Payment intent mismatch" });
    }

    // Validate payment status
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: `Payment intent not succeeded. Status: ${paymentIntent.status}`,
      });
    }

    // Check event capacity
    const usr = req.user._id;
    const evnt = await event.findById(eventId);
    if (!evnt) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (evnt.capacity < tickets) {
      return res.status(400).json({ message: "Not enough tickets available!" });
    }

    // Check if the user has already booked the event
    const alreadyBooked = evnt.attendees.some(
      (a) => String(a.userId) === String(usr)
    );
    if (alreadyBooked) {
      return res.status(400).json({ message: "You can book the event only once!" });
    }

    // Update the event with the booking
    const updatedEvent = await event.findByIdAndUpdate(
      eventId,
      {
        $push: { attendees: { userId: usr, ticketsBooked: tickets } },
        $inc: { capacity: -tickets },
      },
      { new: true }
    );

    console.log('Event Updated:', updatedEvent); // Debugging
    return res
      .status(200)
      .json({ message: "Event booked successfully!", event: updatedEvent });
  } catch (error) {
    console.error("Error booking event:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
