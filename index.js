const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config()

const stripe = require("stripe")(process.env.STRIPE_KEY)
// midleware 

app.use(cors());
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z6k7j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function veryfyJWT(req, res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeaders.split(' ')[1]
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ messege: 'forbidden acess' })
        }

        req.decoded = decoded;
        next()
    });

}

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('tools').collection('service')
        const orderCollection = client.db('tools').collection('order')
        const reviewCollection = client.db('tools').collection('reviews')
        const usersCollection = client.db('tools').collection('users')
        const profileCollection = client.db('tools').collection('profile')
        const paymentCollection = client.db('tools').collection('payment')


        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        app.get('/product', async (req, res) => {
            const query = {}
            const product = await toolsCollection.find(query).toArray()
            res.send(product)
        })

        app.get('/product', async (req, res) => {
            const query = {}
            const product = await toolsCollection.find(query).toArray()
            res.send(product)
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await toolsCollection.findOne(query)
            res.send(result)
        })


        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(query)
            res.send(result)
        })


        //pathc
        app.patch('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const result = await paymentCollection.insertOne(payment);
            const updatedPayment = await orderCollection.updateOne(filter, updatedDoc);
            res.send(updatedPayment);
        })

        //  my order 
        app.post('/myorder', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })


        app.get('/myorder', veryfyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email
            if (email === decodedEmail) {
                const query = { email: email }
                const result = await orderCollection.find(query).toArray();
                return res.send(result)
            } else {
                return res.status(403).send({ messege: 'forbidden acess' })

            }

        })

        // detete api 
        app.delete('/myorder/', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

        // review 
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            res.send(result)
        })

        app.get('/review', async (req, res) => {
            const query = {}
            const review = await reviewCollection.find(query).toArray()
            res.send(review)
        })

        // admin 
        app.put('/user/admin/:email', veryfyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const requester = req.decoded.email;
            const requestAccount = await usersCollection.findOne({ email: requester })

            if (requestAccount.role === 'admin') {
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result)
            } else {
                return res.status(403).send({ messege: 'forbidden acess' })

            }
        })



        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        //user 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const token = jwt.sign({ email: email }, process.env.TOKEN_SECRET, { expiresIn: '1h' })
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send({ result, token })
        })


        app.get('/users', veryfyJWT, async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })



        app.get('/product', async (req, res) => {
            const query = {}
            const product = await toolsCollection.find(query).toArray()
            res.send(product)
        })


        // profile 
        app.get('/profile', async (req, res) => {
            const query = {}
            const result = await profileCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/profile/:email', async (req, res) => {
            const email = req.params.email;
            const user = await profileCollection.findOne({ email: email })
            res.send(user)
        })



        app.put('/myprofile/:email', async (req, res) => {
            const email = req.params.email;
            const profile = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: profile,
            }
            const result = await profileCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })


        //add product
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const result = await toolsCollection.insertOne(product)
            res.send(result)
        })


        // prodyct delete 
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await toolsCollection.deleteOne(query)
            res.send(result)
        })


    }

    finally {

    }
}

run().catch(console.dir);










app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})