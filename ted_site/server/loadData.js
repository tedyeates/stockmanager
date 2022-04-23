const fs = require("fs")
const csv = require("csv-parser")
const aws = require("aws-sdk");

aws.config.update({
  region: "ap-southeast-1",
  endpoint: "http://localhost:8000",
  retryDelayOptions: {base: 300},
})

var docClient = new aws.DynamoDB.DocumentClient();

var groupsSeen = new Set()
var itemsSeen = new Set()
var instockSeen = new Set()
var outstockSeen = new Set()


function putError(err, data, type){
    if (err) {
        console.error("Unable to add. Error JSON:", JSON.stringify(err, null, 2), type, JSON.stringify(data, null, 2))
    } 
    else {
        console.log("Add succeeded:", JSON.stringify(data, null, 2), type)
    }
}


function createItem(row){
    const itemCode = row.CODE
    // Ignore blank items or duplicates
    if (!itemCode || itemsSeen.has(itemCode)) return null
    itemsSeen.add(itemCode)

    let itemData = {
        "Group": row.GROUP,
        "Description": row.LIST,
        "Brand": row.BRAND,
        "Unit": row.HI,
        "Weight": row["WEIGHT KG"],
        "SumInstock": 0,
        "SumOutstock": 0,
        "SumPrice": 0
    }

    return {
        PutRequest: {
            Item:  {
                "Code": itemCode,
                "info": itemData
            },
        }
    }

    
}


function createGroup(groupRow, type){
    // Ignore blank items or duplicates
    if(!groupRow || groupsSeen.has(groupRow)) return
    groupsSeen.add(groupRow)

    return {
        PutRequest: {
            Item: {
                Type: type,
                Name: groupRow,
            },
        }
    }
}


function createInstock(row){
    const itemCode = row.ID
    const invoiceNumber = row["IV No."]
    const instockComposite = `${itemCode}:::${invoiceNumber}`

    // Ignore blank items or duplicates
    if(!itemCode || !invoiceNumber || instockSeen.has(instockComposite)) 
        return null
    instockSeen.add(instockComposite)

    // Non-key data
    const instockData = {
        "Date": row.DATE,
        "PON": row["PO No."],
        "JobID": row["PC Job"],
        "Supplier": row.SUPPLIER,
        "Quantity": row.qty,
    }

    return {
        PutRequest: {
            Item: {
                "ItemCode": itemCode,
                "InvoiceNumber": invoiceNumber,
                "Price": parseInt(row["UNIT/Price"]),
                "info": instockData,
            },
        }
    }

}


function createOutstock(row){
    const itemCode = row.ID
    const jobId = row["JOB No."]
    const outstockComposite = `${itemCode}:::${jobId}`

    if(!itemCode || !jobId || outstockSeen.has(outstockComposite)) 
        return null
    outstockSeen.add(outstockComposite)

    const outstockData = {
        "Date": row.DATE,
        "Customer": row["ลูกค้า"],
        "StockID": row.ST,
        "Requester": row["ชื่อผู้เบิก"],
        "Department": row["แผนก"],
        "Quantity": row.QTY
    }

    return {
        PutRequest: {
            Item: {
                "ItemCode": itemCode,
                "JobID": jobId,
                "info": outstockData,
            },
        }
    }
}


function updateItems(items, stockType){

    items.forEach(item => {
        let expressionAtrributeValues = {":val": 1}
        let updateString = `set info.Sum${stockType} = info.Sum${stockType} + :val`
        if (stockType === "Instock"){
            updateString = `${updateString}, info.SumPrice = info.SumPrice + :price`
            expressionAtrributeValues[":price"] = item.price
        }

        let params = {
            TableName: "Item",
            Key:{
                "Code": item.code
            },
            UpdateExpression: updateString,
            ExpressionAttributeValues: expressionAtrributeValues,
            ReturnValues: "UPDATED_NEW"
        }

        docClient.update(params, (err, data) => putError(err, data, `update item ${stockType}` ))
    })
}


async function runBatch(type, data, columnTitle){
    let start = 0
    let dataLength = data.length
    const MAX_BATCH_SIZE = 25
    while(start < dataLength) {
        console.log("batch")
        console.log(start)
        let end = start + MAX_BATCH_SIZE
        console.log(end)
        console.log(data.slice(start, end))
        let params = {
            RequestItems: {
                [type]: data.slice(start, end)
            }
        }

        await docClient.batchWrite(
            params, 
            (err, data) => putError(err, data, `create ${type} ${columnTitle ? columnTitle : ""}`)
        ).promise()
        start += MAX_BATCH_SIZE
    }
}


async function readData(filePath, createFunction, type, extras){
    let createData = await new Promise(resolve => {
        let data = []
        let groups = []
        let items = []

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                let dataItem = createFunction(row)
                if (dataItem) data.push(dataItem)

                if(extras?.columnName && extras?.groupType){
                    let group = createGroup(row[extras.columnName], extras.groupType)
                    if (group) groups.push(group)
                }

                if(extras?.updateItem){
                    let item = {code: row.ID, price: 0}

                    if(type === "Instock")
                        item.price = parseFloat(row["UNIT/Price"])

                    items.push(item)
                }
            })
            .on("end", () => {
                resolve([data, groups, items])
            })
    })

    await runBatch(type, createData[0])

    if(extras?.updateItem)
        updateItems(createData[2], type)

    if(createData[1].length)
        runBatch("Group", createData[1], extras.columnName)
}


async function readCsv(){
    await readData("data/items.csv", createItem, "Item", 
        {groupType: "Group", columnName: "itemGroup"}
    )
    console.log("finished reading items")
    readData("data/instock.csv", createInstock, "Instock", 
        {updateItem: true}
    )
    readData("data/outstock.csv", createOutstock, "Outstock", 
        {
            groupType: "แผนก", 
            columnName: "Department", 
            updateItem: true
        }
    )
}

readCsv()
