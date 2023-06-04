const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express()
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lmw0s1b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const usersCollection = client.db("bistro-boss").collection("users");
    const menuCollection = client.db("bistro-boss").collection("menu");
    const reviewCollection = client.db("bistro-boss").collection("reviews");
    const cartCollection = client.db("bistro-boss").collection("carts");



    app.get('/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result)
    })

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESSTOKEN, { expiresIn: '1h' });
      res.send(token)
    })

    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })
    app.post("/users", async(req, res) => {
      const user = req.body;
      const query = {email: user.email}
      const existist = await usersCollection.findOne(query);
      if(existist){
        return res.send({error: true, message: "User already added in Collection"})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.delete('/users/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      console.log(id);
      const updateDoc = {
        $set: {
          isAdmin: true
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get('/reviews', async(req, res) => {
        const result = await reviewCollection.find().toArray();
        res.send(result)
    })
    app.get('/carts', async(req, res) => {
      const email = req.query.email;
      if(!email){
        res.send([])
      }
      const query = { addedBy: email }
        const result = await cartCollection.find(query).toArray();
        res.send(result)
    })


    app.post('/carts', async(req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Boss-restaurent is in mood")
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})