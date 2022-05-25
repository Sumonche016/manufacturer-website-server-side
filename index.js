const express = require('express')
const app = express()
const cors = require('cors')

const port = process.env.PORT || 5000;
require('dotenv').config()

// midleware 

app.use(cors());
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z6k7j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('tools').collection('service')
        const orderCollection = client.db('tools').collection('order')
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
        //  my order 
        app.post('/myorder', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })
        app.get('/myorder', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await orderCollection.find(query).toArray();
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