var AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
  });

var dynamodb = new AWS.DynamoDB();

var param = {}
dynamodb.listTables(param, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    });


dynamodb.deleteTable( {
    TableName : "Instock"
}, function(err, data) {
    if (err) {
        console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

dynamodb.deleteTable( {
    TableName : "Group"
}, function(err, data) {
    if (err) {
        console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});


dynamodb.deleteTable( {
    TableName : "Outstock"
}, function(err, data) {
    if (err) {
        console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});


dynamodb.deleteTable( {
    TableName : "Item"
}, function(err, data) {
    if (err) {
        console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

