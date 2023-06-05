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
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization);
  if(!authorization){
    return res.status(401).send({error: true, message: "unthorized user"})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.JWT_ACCESSTOKEN, (err, decoded) => {
    if(err){
      return res.status(401).send({error: true, message: "unthorized user"})
    }
    req.decoded = decoded;
    next()
  })
}




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
      res.send({token})
    })
    app.get('/isadmin/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      if(user?.isAdmin !== "admin"){
        return res.send({isAdmin: false})
      }
      const isAdmin = user?.isAdmin === "admin";
      res.send({isAdmin})
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
    app.get('/carts', verifyJWT, async(req, res) => {
      const email = req.query.email;
      if(email !== req.decoded.email){
        return res.status(403).send({error: true, message: "unthorized user"})
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