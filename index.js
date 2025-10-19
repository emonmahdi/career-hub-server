const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("logger middleware");
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("Verify token: ", token);

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// const verifyToken = (req, res, next) => {
//   const token = req?.cookies?.token;
//   console.log("verify token", token);

//   if (!token) {
//     return res.status(401).send({ message: "Unauthorized Access" });
//   }

//   // verify token
//   jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// };

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

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send({ message: true });
    });

    // app.post("/jwt", async (req, res) => {
    //   const userData = req.body;
    //   const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
    //     expiresIn: "1d",
    //   });

    //   // set the cookies
    //   res.cookie("token", token, {
    //     httpOnly: true,
    //     secure: false,
    //   });

    //   res.send({ success: true });
    // });

    // Get Job Api
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query.hr_email = email;
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Job Count application GET API
    app.get("/jobs/applications", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { hr_email: email };
      const jobs = await jobsCollection.find(query).toArray();

      for (const job of jobs) {
        const applicationQuery = { jobId: job._id.toString() };
        const application_count = await applicationCollection.countDocuments(
          applicationQuery
        );
        job.application_count = application_count;
      }
      res.send(jobs);
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

    // get api job application user
    app.get("/applications/job/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      const query = { jobId: job_id };
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    // filter get api
    app.get("/applications", async (req, res) => {
      const email = req.query.email;

      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }

      console.log("Cookies from client:", req.cookies);

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

    // POSt JOB API
    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    // Patch Api Status Update
    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const status = req.body.status;
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await applicationCollection.updateOne(filter, updatedDoc);
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
