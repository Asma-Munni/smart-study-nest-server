const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()


const uri = process.env.MONGODB_URI;


 

const app = express()
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("smart-study");
    const roomsCollections = db.collection("rooms");

    app.get("/rooms", async(req, res)=>{
     const cursor = roomsCollections.find();
     const result =  await cursor.toArray();
     res.send(result);
    // console.log(result)
    })
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
   app.delete('/rooms/:roomId', async (req,res)=>{
        const {roomId} = req.params;
        console.log(roomId); 
      
        const query = {_id: new ObjectId(roomId) };
        const result = await roomsCollections.deleteOne(query);
        res.send(result);
      
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