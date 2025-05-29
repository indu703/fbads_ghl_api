import dotenv from "dotenv";
// dotenv.config({ path: '.env.local' });
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

console.log(process.env.NODE_ENV);

import express, { Request, Response } from "express";
import sequelize from "./util/dbConn"
import cors from "cors";

import setInterface from "./middleware/interface";
import userRouter from "./router/user";
import ghlRouter from "./router/ghl-account-user"
import embedRoutes from "./router/embeded-router"
import facebookRoutes from "./router/facebook"
import ChruchesRoute from "./router/chruches"

const app = express();
app.use(express.json({ limit: '2450mb' }));
app.use(express.urlencoded({ extended: false }));
var corsOptions = {
  origin: function (origin: any, callback: any) {
    callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(setInterface);
//check connection to database
const connectToDb = async () => {
  const data = await sequelize.sync({ force: false })
  try {
    await sequelize.authenticate();
      console.log("Database Connected successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

app.use("/user", userRouter);
app.use("/ghl", ghlRouter);
app.use('/embed', embedRoutes);
app.use('/facebook', facebookRoutes);
app.use('/', ChruchesRoute);
// app.use("/bookmark", bookmarkRouter);
// app.use("/rating", ratingRouter);
// app.use("/socialcount", countingRouter);
// app.use("/mediaprogress", mediaProgressRouter);

// app.use(errorMiddleware);

app.listen(5000, () => {
  connectToDb();
  console.log(`[*] Server listening on Port ${5000}`);
});