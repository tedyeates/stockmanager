const express = require('express')
const { getAll, create, get, update } = require('./dynamoQueries')

const app = express()
const port = 3000


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.get('/dynamo/:objectType', (req, res) => {
    const tableName = req.params.objectType
    const keys = req.query

    if(keys)
        get(tableName, req.query).then((response) => {
            res.json(response)
        })
    else
        getAll(tableName).then((response) => {
            res.json(response)
        })
})


app.post('/dynamo/:objectType', (req, res) => {
    const response = create(req.params.objectType, req.body.data)
    res.status(response.status).json(response.data)
})


app.patch('/dynamo/:objectType', (req, res) => {
    const response = update(req.params.objectType, req.query, req.body)
    res.status(response.status).json(response.data)
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

