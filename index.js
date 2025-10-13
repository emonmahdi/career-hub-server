const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const applicationCollection = client
      .db("careerHub_DB")
      .collection("application");

    // Get Job Api
    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    // single data fetch
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // POST Application API
    app.post("/application", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    // filter get api
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email,
      };
      const result = await applicationCollection.find(query).toArray();

      // bad way to aggregate
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company;
        application.company_logo = job.company_logo;
        application.title = job.title;
        application.location = job.location;
        application.jobType = job.jobType;
        application.category = job.category;
        application.salaryRange = job.salaryRange;
        application.applicationDeadline = job.applicationDeadline;
      }

      res.send(result);
    });

    console.log("Career Hub Connected are successfully to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    /* 
     for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company;
        application.title = job.title;
        application.company_logo = job.company_logo;
      }

    */
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Career hub server - Job Portal");
});






app.listen(port, () => {
  console.log(`Server is Running Port ${port}`);
});
