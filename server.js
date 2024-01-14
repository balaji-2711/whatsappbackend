const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const Pusher = require("pusher");
const cors = require("cors");
const Messages = require("./dbMessages");

const app = express();
const port = process.env.PORT || 8000;

// const pusher = new Pusher({
//   appId: "1330597",
//   key: "6fbb654a0e0b670de165",
//   secret: "a96c94ba1f510bc260e2",
//   cluster: "ap2",
//   useTLS: true,
// });

const pusher = new Pusher({
  appId: "1707362",
  key: "07c9834a6717e04aa389",
  secret: "f882b86b334b47b3dc94",
  cluster: "ap2",
  useTLS: true,
});

app.use(express.json());

app.use(cors());

const dbUrl =
  // "mongodb+srv://Vishnupriya:Vishnu12345@cluster0.x4j7bh9.mongodb.net/whatsapp-mern";
  "mongodb+srv://balaji:balapass@cluster0.wr30crl.mongodb.net/whatsappclone?retryWrites=true&w=majority";

//to connect to db
mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  //based on event change push a new group into db collection
  const roomCollection = db.collection("rooms");
  //A change stream that watches changes on all collections in the cluster.
  const changeStream = roomCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      //room is the channel name
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("Not an expected event to trigger");
    }
  });

  //based on event change push a new message into db collection
  const msgCollection = db.collection("messages");
  const changeStream1 = msgCollection.watch();
  changeStream1.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      //messages is the channel name
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });
});

//to get particular group based on id
app.get("/room/:id", (req, res) => {
  Rooms.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data[0]);
    }
  });
});

//to get all the messages based on room id
app.get("/messages/:id", (req, res) => {
  Messages.find({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

//to create new message
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

//to create group
app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

//to get all groups
app.get("/all/rooms", (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});
