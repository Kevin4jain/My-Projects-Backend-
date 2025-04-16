const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./ConnectDB/connect");
const loginRoute = require("./routes/login");
const eventRoute = require("./routes/event");
const paymentRoute = require("./routes/paymentroutes");
const profileRoute=require("./routes/profileroutes")
const adminRoutes=require("./routes/adminroutes")

dotenv.config();
const app = express();
const port = process.env.PORT ;

connectDB();

app.use(cors({
  origin: "https://my-projects-eight-rouge.vercel.app/",
  credentials: true,
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", loginRoute);
app.use("/event", eventRoute);
app.use("/profile",profileRoute)
app.use("/admin",adminRoutes)
app.use("/payment",paymentRoute)

app.listen(port, () => {
  console.log(` Server is running on port ${port}`);
});
