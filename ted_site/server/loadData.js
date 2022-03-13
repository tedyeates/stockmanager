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

function putError(err, data){
    if (err) {
        console.error("Unable to add. Error JSON:", JSON.stringify(err, null, 2));
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
        "Sum Instock": 0,
        "Sum Outstock": 0,
        "Sum Price": 0
    }

    const itemParams = {
        TableName: "Item",
        Item:  {
            "Code": itemCode,
            "info": itemData
        },
    }

    docClient.put(itemParams, putError)

    itemsSeen.add(itemCode)
}


function createGroup(groupRow){
    // Ignore duplicates
    if(!groupRow || groupsSeen.has(groupRow)) return

    const groupParams = {
        TableName: "Group",
        Item: {
            Name: groupRow
        },
    }

    docClient.put(groupParams, putError)

    groupsSeen.add(groupRow)
}


fs.createReadStream('data/items.csv')
    .pipe(csv())
    .on('data', (row) => {
        createItem(row)
        createGroup(row.GROUP)
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

        const instockData = {
            "Date": row.DATE,
            "PON": row["PO No."],
            "Job ID": row["PC Job"],
            "Supplier": row.SUPPLIER,
            "Quantity": row.qty,
        }

        const instockParams = {
            TableName: "Instock",
            Item: {
                "Item Code": itemCode,
                "Invoice Number": invoiceNumber,
                "Price": row["UNIT/Price"],
                "info": instockData,

            },
        }
    
        docClient.put(instockParams, putError)
    
        instockSeen.add(instockComposite)
    })

function createOutock(row){
    const itemCode = row.ID
    const jobId = row['JOB No.']
    const outstockComposite = `${itemCode}:::${jobId}`

    if(!itemCode || !jobId || outstockSeen.has(outstockComposite)) 
        return  

    const outstockData = {
        "Date": row.DATE,
        "Customer": row["ลูกค้า"],
        "Job ID": row["PC Job"],
        "Stock ID": row.ST,
        "Requester": row["ชื่อผู้เบิก"],
        "Department": row["แผนก"],
        "Quantity": row.QTY
    }

    const outstockParams = {
        TableName: "Instock",
        Item: {
            "Item Code": itemCode,
            "Job ID": jobId,
            "info": outstockData,

        },
    }

    docClient.put(outstockParams, putError)

    outstockSeen.add(outstockComposite)
}


fs.createReadStream('data/outstock.csv')
    .pipe(csv())
    .on('data', (row) => {
        createOutock(row)
        createGroup(row['แผนก'])
    })