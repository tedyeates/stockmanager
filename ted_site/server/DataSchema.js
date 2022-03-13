var AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-southeast-1",
  endpoint: "http://localhost:8000"
});

var dynamodb = new AWS.DynamoDB();

var groups = {
    TableName: "Group",
    KeySchema: [       
        { AttributeName: "Type", KeyType: "HASH" },  //Partition key
        { AttributeName: "Name", KeyType: "RANGE"}
    ],
    AttributeDefinitions: [    
        { AttributeName: "Type", AttributeType: "S" },   
        { AttributeName: "Name", AttributeType: "S" },
        //Description

    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};


dynamodb.createTable(groups, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var items = {
    TableName: "Item",
    KeySchema: [
        { AttributeName: "Code", KeyType: "HASH"}
    ], 
    AttributeDefinitions: [       
        { AttributeName: "Code", AttributeType: "S" },
        //Description

    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
}

dynamodb.createTable(items, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});


var outstock = {
    TableName: "Outstock",
    KeySchema: [
        { AttributeName: "Item Code", KeyType: "HASH"},
        // jobNo
        { AttributeName: "Job ID", KeyType: "RANGE"}
    ], 
    AttributeDefinitions: [       
        { AttributeName: "Item Code", AttributeType: "S" },
        { AttributeName: "Job ID", AttributeType: "S" },
        //Description

    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
}

dynamodb.createTable(outstock, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});


var instock = {
    TableName: "Instock",
    KeySchema: [
        { AttributeName: "Item Code", KeyType: "HASH"},
        // Invoice Number
        { AttributeName: "invoiceNumber", KeyType: "RANGE"}
    ], 
    AttributeDefinitions: [   
        { AttributeName: "Item Code", AttributeType: "S" },    
        { AttributeName: "Invoice Number", AttributeType: "S"},
        { AttributeName: "Price", AttributeType: "N" },

    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    },
    GlobalSecondaryIndexes: [{
        IndexName: "ItemPriceIndex",
        KeySchema: [
            {
                AttributeName: "Item Code",
                KeyType: "HASH"
            },
            {
                AttributeName: "Price",
                KeyType: "RANGE"
            }
        ],
        Projection: {
            ProjectionType: "KEYS_ONLY"
        },
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    }]
}

dynamodb.createTable(instock, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});