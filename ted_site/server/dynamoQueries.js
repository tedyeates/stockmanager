var AWS = require("aws-sdk");
const e = require("express");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

var docClient = new AWS.DynamoDB.DocumentClient();

exports.getAll = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    console.log(params)
    const scanResults = []
    let items;
    do{
        items =  await docClient.scan(params).promise()
        console.log(items)
        items.Items.forEach((item) => scanResults.push(item))
        params.ExclusiveStartKey  = items.LastEvaluatedKey
    } while(typeof items.LastEvaluatedKey !== "undefined")
    
    return scanResults;
}


exports.get = async (tableName, keys) => {

    const params = {
        TableName: tableName,
        ExpressionAttributeNames: {},
        ExpressionAttributeValues: {}
    }

    Object.entries(keys).forEach(([key, value], index) => {
        if(index === 0){
            params.ExpressionAttributeNames["#partition"] = key
            params.ExpressionAttributeValues[":partition"] = value
            params.KeyConditionExpression = `#partition = :partition`
        }
        else {
            params.ExpressionAttributeNames["#sort"] = key
            params.ExpressionAttributeValues[":sort"] = value
            params.KeyConditionExpression = `${params.KeyConditionExpression} and #sort = :sort`
        }
    })


    console.log(params)
    const results = await docClient.query(params).promise()
    console.log(results)
    return results
    
}


exports.create = (tableName, data) => {
    let params = {
        TableName: tableName,
        Item: data
    }

    docClient.put(params).then((res) => {
        return {status: 204, data: res}
    }).catch(err => {
        console.log(err)
        return {status: 400, data: err}
    })
}

const updateData = (updateInfo) => {
    return updateInfo.reduce((acc, item, index) => (
        {
            UpdateExpressions:`${acc} info.${item.name} = info.${item.name} + :val${index},`,
            ExpressionAttributeValues: {
                [`:val${index}`]: item.value
            }
        }
    ), "set")
}


exports.update = (tableName, keys, updateInfo) => {
    const params = {
        TableName: tableName,
        Key: keys,
        ReturnValues: "UPDATED_NEW",
        ...updateData(updateInfo)
    }

    docClient.update(params).then((res) => {
        return {status: 204, data: res}
    }).catch(err => {
        console.log(err)
        return {status: 400, data: err}
    })
}


