const AWS = require("aws-sdk");
const e = require("express");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

exports.getAll = async (tableName) => {
    const params = {
        TableName: tableName,
    }

    const scanResults = []
    let items
    do{
        items =  await docClient.scan(params).promise()
        items.Items.forEach((item) => {
            console.log(item)
            const {info, ...itemNoInfo} = item
            scanResults.push({...(item.info ?? {}), ...itemNoInfo})
        })
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
    data["SumInstock"] = 0
    data["SumOutstock"] = 0
    data["SumPrice"] = 0

    let params = {
        TableName: tableName,
        Item: data
    }

    return docClient.put(params).promise()
}

const updateData = (updateInfo) => {
    return updateInfo.reduce((acc, item, index) => {
        let updateExpression = [acc.UpdateExpression, `#${index} = :${index}`]
        
        if(item.isAccumulator) 
            updateExpression[1] =  `#${index} = #${index} + :${index}`
        
        if(index === 0) 
            acc.UpdateExpression = updateExpression.join(' ')
        else
            acc.UpdateExpression = updateExpression.join(', ')
        
        acc.ExpressionAttributeNames = {
            ...acc.ExpressionAttributeNames,
            [`#${index}`]: item.name
        }

        acc.ExpressionAttributeValues = {
            ...acc.ExpressionAttributeValues,
            [`:${index}`]: item.value
        }

        return acc
    }, {
        UpdateExpression: "set ",
        ExpressionAttributeValues: {}
    })
}


exports.update = (tableName, keys, updateInfo) => {
    console.log(updateInfo)
    const params = {
        TableName: tableName,
        Key: keys,
        ReturnValues: "UPDATED_NEW",
        ...updateData(updateInfo)
    }

    console.log(params)

    return docClient.update(params).promise()
}


