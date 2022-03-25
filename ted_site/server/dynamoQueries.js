var AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

var docClient = new AWS.DynamoDB.DocumentClient();

exports.getAll = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    const scanResults = []
    let items;
    do{
        items =  await docClient.scan(params).promise()
        items.Items.forEach((item) => scanResults.push(item))
        params.ExclusiveStartKey  = items.LastEvaluatedKey
    } while(typeof items.LastEvaluatedKey !== "undefined")
    
    return scanResults;
}


exports.get = async (tableName, keys) => {
    const params = {
        TableName: tableName,
        Key: keys
    }

    const results = await docClient.get(params).promise()
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


