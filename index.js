const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
require('dotenv').config();


// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Community is running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bcz5gxh.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const postCollection = client.db('communityDB').collection('post');
    const commentCollection = client.db('communityDB').collection('comment');
    const userCollection = client.db('communityDB').collection('users');
    const newsCollection = client.db('communityDB').collection('news');
    const tagCollection = client.db('communityDB').collection('tag');
    const feedbackCollection = client.db('communityDB').collection('feedback');




    // jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })


    // middlewares 

    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        console.log("hello", req.decoded);
        next();
      })
    }



    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      console.log(query);
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }








    app.get('/post', async (req, res) => {
      const result = await postCollection.find().toArray();
      res.send(result);
    })

    app.get('/post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.findOne(query);
      res.send(result);
    })



    app.post('/post', async (req, res) => {
      const post = req.body;
      // console.log(post);
      const result = await postCollection.insertOne(post);
      // console.log(result);
      res.send(result);
    })


    app.delete('/post/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postCollection.deleteOne(query);
      res.send(result);
    })







    // Admin

    app.get('/users',  async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);

    })


    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      if (!req.decoded || email !== req.decoded.email) {
        console.log(req.decoded);
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      console.log(query);
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })




    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })



    app.post('/users', async (req, res) => {
      const post = req.body;

      console.log(post);

      const query = { email: post.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })

      }

      const result = await userCollection.insertOne(post);
      console.log(result);
      res.send(result);
    })


    // news

    app.post('/news', async (req, res) => {
      const news = req.body;
      console.log(news);
      const result = await newsCollection.insertOne(news);
      console.log(result);
      res.send(result);
    })

    app.get('/news', async (req, res) => {
      const result = await newsCollection.find().toArray();
      res.send(result);
    })


    // tag
    app.get('/tag', async (req, res) => {
      const result = await tagCollection.find().toArray();
      res.send(result);
    })




    app.get('/tag/:tag', async (req, res) => {
      const tag = req.params.tag;

      // Perform MongoDB search query here
      const result = await tagCollection.find({ tag: tag }).toArray();
      res.send(result);
    });



    // comment


    app.get('/comment', async (req, res) => {
      const result = await commentCollection.find().toArray();
      res.send(result);
    })



    app.get('/comment/:title', async (req, res) => {
      const title = req.params.title;
      console.log(title);

      // Perform MongoDB search query here
      const result = await commentCollection.find({ title: title }).toArray();
      // const result = await commentCollection.find().toArray();
      res.send(result);
    })


    app.post('/comment', async (req, res) => {
      const user = req.body;
      const result = await commentCollection.insertOne(user);
      res.send(result);
    })



    // feedback

    app.get('/feedback', async (req, res) => {
      const result = await feedbackCollection.find().toArray();
      res.send(result);
    })



    app.post('/feedback', async (req, res) => {
      const user = req.body;
      const result = await feedbackCollection.insertOne(user);
      res.send(result);
    })








    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Boss is running on port ${port}`)
})  