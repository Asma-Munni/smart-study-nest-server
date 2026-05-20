const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const cors = require("cors");
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()


const uri = process.env.MONGODB_URI;


 

const app = express()
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect to the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("smart-study");
    const roomsCollections = db.collection("rooms");
    const bookingsCollections = db.collection("bookings");

    app.get("/rooms", async(req, res)=>{
     const cursor = roomsCollections.find();
     const result =  await cursor.toArray();
     res.send(result);
    // console.log(result)
    })

    {/*6 latest room */}
    app.get("/latest-rooms", async (req, res) => {
  const result = await roomsCollections
    .find({})
    .sort({ _id: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});

   {/*Single route */}
   app.get("/rooms/:roomId", async(req,res)=>{
    const {roomId} = req.params
   const query = {_id:new ObjectId(roomId) }
   console.log(query)
   const result =await roomsCollections.findOne(query);
   //console.log(result);
   res.send(result);
   })

   {/*data create */}
   app.post("/rooms", async(req,res)=>{
    const newRoom = req.body;
    const result = await roomsCollections.insertOne(newRoom);
    console.log(result);
    res.send(result);
   })

   {/*Update */}
   app.patch('/rooms/:roomId', async (req,res)=>{
        const {roomId} = req.params;
        const updatedRoom = req.body;
     // console.log(roomId, updatedRoom);
        const filter = {_id: new ObjectId(roomId) };
        const updateDoc = {
            $set: {
               ...updatedRoom,
            },
        };
        const result = await roomsCollections.updateOne(filter, updateDoc);
        console.log(result);
        res.send(result);
    })


   
   {/*delete */}
  app.delete("/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;

    if (!ObjectId.isValid(roomId)) {
      return res.status(400).send({
        message: "Invalid room id",
      });
    }

    const room = await roomsCollections.findOne({
      _id: new ObjectId(roomId),
    });

    if (!room) {
      return res.status(404).send({
        message: "Room not found",
      });
    }

    if (room.ownerId !== userId) {
      return res.status(403).send({
        message: "You are not allowed to delete this room",
      });
    }

    const result = await roomsCollections.deleteOne({
      _id: new ObjectId(roomId),
    });

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to delete room",
      error: error.message,
    });
  }
});

      {/*Booking route */}
      app.post("/bookings", async (req, res) => {
  try {
    const booking = req.body;

    const {
      roomId,
      roomName,
      roomImage,
      userId,
      userName,
      userEmail,
      bookingDate,
      startTime,
      endTime,
      totalCost,
      specialNote,
    } = booking;

    if (!roomId || !userId || !bookingDate || !startTime || !endTime) {
      return res.status(400).send({
        message: "Room, user, date, start time and end time are required",
      });
    }

    const room = await roomsCollections.findOne({
      _id: new ObjectId(roomId),
    });

    if (!room) {
      return res.status(404).send({
        message: "Room not found",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    if (bookingDate < today) {
      return res.status(400).send({
        message: "Booking date must be today or a future date",
      });
    }

    const startHour = Number(startTime.split(":")[0]);
    const endHour = Number(endTime.split(":")[0]);

    if (endHour <= startHour) {
      return res.status(400).send({
        message: "End time must be after start time",
      });
    }

    const conflict = await bookingsCollections.findOne({
      roomId: roomId,
      bookingDate: bookingDate,
      status: "confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).send({
        message: "This room is already booked for the selected time slot.",
      });
    }

    const calculatedCost = (endHour - startHour) * Number(room.hourlyRate);

    const newBooking = {
      roomId,
      roomName: roomName || room.roomName,
      roomImage: roomImage || room.image,
      userId,
      userName,
      userEmail,
      bookingDate,
      startTime,
      endTime,
      totalCost: calculatedCost || Number(totalCost),
      specialNote: specialNote || "",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    const result = await bookingsCollections.insertOne(newBooking);

    await roomsCollections.updateOne(
      { _id: new ObjectId(roomId) },
      {
        $inc: {
          bookingCount: 1,
        },
      }
    );

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to book room",
    });
  }
});


{/*Add Listing */}
app.get("/my-listings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await roomsCollections
      .find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to load my listings",
      error: error.message,
    });
  }
});


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send("Server is running fine")
})

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})