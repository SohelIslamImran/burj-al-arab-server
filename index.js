const express = require('express')
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()

const port = 8000
const app = express();
app.use(express.json());
app.use(cors());

const serviceAccount = require(`${process.env.FIRE_CONFIG}`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@database.1n8y8.mongodb.net/${process.env.DB_L}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db(`${process.env.DB_L}`).collection("Bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(decodedToken => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail === queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, docs) => {
                res.send(docs)
              })
          }
          else {
            res.status(401).send('Unauthorized access')
          }
        })
        .catch(error => {
          res.status(401).send(error.message)
        });
    }
    else {
      res.status(401).send('Unauthorized access')
    }
  })

});


app.listen(port)