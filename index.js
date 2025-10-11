const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebn1vec.mongodb.net/careerHub_DB?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // database collection
    const jobsCollection = client.db("careerHub_DB").collection("jobs");

    // Get Job Api
    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    console.log("Career Hub Connected are successfully to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Career hub server - Job Portal");
});






app.listen(port, () => {
  console.log(`Server is Running Port ${port}`);
});
