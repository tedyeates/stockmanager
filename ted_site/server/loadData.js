const fs = require('fs')
const csv = require('csv-parser')
const aws = require("aws-sdk");

aws.config.update({
  region: "ap-southeast-1",
  endpoint: "http://localhost:8000"
})

var docClient = new aws.DynamoDB.DocumentClient();

var groupsSeen = new Set()
var itemsSeen = new Set()
var instockSeen = new Set()
var outstockSeen = new Set()

function putError(err, data, type){
    if (err) {
        console.error("Unable to add. Error JSON:", JSON.stringify(err, null, 2), type);
    } else {
        console.log("PutItem succeeded:", data.info);
    }
}


function createItem(row){
    const itemCode = row.CODE
    // Ignore blank items or duplicates
    if (!itemCode || itemsSeen.has(itemCode)) return
    console.log("code")
    console.log(itemCode)

    let itemData = {
        "Group": row.GROUP,
        "Description": row.LIST,
        "Brand": row.BRAND,
        "Unit": row.HI,
        "Weight": row['WEIGHT KG'],
        "SumInstock": 0,
        "SumOutstock": 0,
        "SumPrice": 0
    }

    const itemParams = {
        TableName: "Item",
        Item:  {
            "Code": itemCode,
            "info": itemData
        },
    }

    docClient.put(itemParams, (err, data) => putError(err, data, "item"))

    itemsSeen.add(itemCode)
}


function createGroup(groupRow, type){
    // Ignore duplicates
    if(!groupRow || groupsSeen.has(groupRow)) return

    console.log("group")
    console.log(type)
    const groupParams = {
        TableName: "Group",
        Item: {
            Type: type,
            Name: groupRow,
        },
    }

    docClient.put(groupParams, (err, data) => putError(err, data, "group"))

    groupsSeen.add(groupRow)
}

function updateItem(itemCode, stockType, price=0){

    let updateString = `set info.Sum${stockType} = info.Sum${stockType} + :val`
    if (stockType === "Instock")
        updateString = `${updateString}, info.SumPrice = info.SumPrice + :stockPrice`

    let params = {
        TableName: "Item",
        Key:{
            "ItemCode": itemCode
        },
        UpdateExpressions: updateString,
        ExpressionAttributeValues: {
            ":val": 1,
            ":price": price
        },
        ReturnValues: "UPDATED_NEW"
    }

    docClient.update(params, (err, data) => putError(err, data, "update item"))
}

fs.createReadStream('data/items.csv')
    .pipe(csv())
    .on('data', (row) => {
        createItem(row)
        createGroup(row.GROUP, 'itemGroup')
        console.log("finished")
    })



fs.createReadStream('data/instock.csv')
    .pipe(csv())
    .on('data', (row) => {
        const itemCode = row.ID
        const invoiceNumber = row['IV No.']
        const instockComposite = `${itemCode}:::${invoiceNumber}`

        if(!itemCode || !invoiceNumber || instockSeen.has(instockComposite)) 
            return  

        console.log("instock")
        console.log(itemCode)
        console.log(invoiceNumber)
        const instockData = {
            "Date": row.DATE,
            "PON": row["PO No."],
            "JobID": row["PC Job"],
            "Supplier": row.SUPPLIER,
            "Quantity": row.qty,
        }

        const instockParams = {
            TableName: "Instock",
            Item: {
                "ItemCode": itemCode,
                "InvoiceNumber": invoiceNumber,
                "Price": parseInt(row["UNIT/Price"]),
                "info": instockData,

            },
        }
    

        docClient.put(instockParams, (err, data) => putError(err, data, "instock"))
        updateItem(itemCode, "Instock", parseInt(row["UNIT/Price"]))
        instockSeen.add(instockComposite)
    })

function createOutock(row){
    const itemCode = row.ID
    const jobId = row['JOB No.']
    const outstockComposite = `${itemCode}:::${jobId}`

    if(!itemCode || !jobId || outstockSeen.has(outstockComposite)) 
        return  

    console.log("outstock")
    console.log(itemCode)
    console.log(jobId)
    const outstockData = {
        "Date": row.DATE,
        "Customer": row["ลูกค้า"],
        "StockID": row.ST,
        "Requester": row["ชื่อผู้เบิก"],
        "Department": row["แผนก"],
        "Quantity": row.QTY
    }

    const outstockParams = {
        TableName: "Outstock",
        Item: {
            "ItemCode": itemCode,
            "JobID": jobId,
            "info": outstockData,
        },
    }

    docClient.put(outstockParams, (err, data) => putError(err, data, "outstock"))
    updateItem(itemCode, "Outstock")
    outstockSeen.add(outstockComposite)
}


fs.createReadStream('data/outstock.csv')
    .pipe(csv())
    .on('data', (row) => {
        createOutock(row)
        createGroup(row['แผนก'], 'Department')
    })