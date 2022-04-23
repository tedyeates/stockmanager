const express = require('express')
const cors = require('cors')
const { getAll, create, get, update } = require('./dynamoQueries')

const app = express()
const port = 8001

app.use(cors())
app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.get('/dynamo/:objectType', (req, res) => {
    const tableName = req.params.objectType
    const keys = req.query

    if(Object.keys(keys).length !== 0)
        get(tableName, req.query).then((response) => {
            console.log(response)
            res.json(response)
        })
    else
        getAll(tableName).then((response) => {
            console.log(response)
            res.json(response)
        }).catch((error) => {
            console.log(error)
        })
})


app.post('/dynamo/:objectType', (req, res) => {
    const response = create(req.params.objectType, req.body.data)
    console.log(response)
    res.status(response.status).json(response.data)
})


app.patch('/dynamo/:objectType', (req, res) => {
    const response = update(req.params.objectType, req.query, req.body)
    console.log(response)
    res.status(response.status).json(response.data)
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

