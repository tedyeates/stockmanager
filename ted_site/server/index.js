const express = require('express')
const cors = require('cors')
const { getAll, create, get, update } = require('./dynamoQueries')

const app = express()
const port = 8001

app.use(cors())
app.use(express.json())
app.post('/', (req, res) => {
    console.log(req.body)
    res.send('Hello World!')
})


app.get('/dynamo/:objectType', (req, res) => {
    const tableName = req.params.objectType
    const keys = req.query
    console.log("hello")
    if(Object.keys(keys).length !== 0)
        get(tableName, req.query).then((response) => {
            console.log(response)
            res.json(response)
        })
    else {
        console.log("get all")
        getAll(tableName).then((response) => {
            console.log(response)
            res.json(response)
        }).catch((error) => {
            console.log(error)
        })
    }
})


app.post('/dynamo/:objectType', (req, res) => {
    const response = create(req.params.objectType, req.body)
    response.then(() => {
        res.status(204)
    }).catch(err => {
        res.status(400).json(err)
    })
})


app.patch('/dynamo/:objectType', (req, res) => {
    const response = update(req.params.objectType, req.query, req.body.data)
    response.then((queryData) => {
        res.status(200).json(queryData)
    }).catch(err => {
        res.status(400).json(err)
    })
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

