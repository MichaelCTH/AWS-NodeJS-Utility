/* eslint-disable no-console */
const AWS = require("aws-sdk");

const API_VERSION = {
  IAM: { apiVersion: "2010-05-08" },
  EC2: { apiVersion: "2016-11-15" },
  Dynamo: { apiVersion: "2012-08-10" },
  Lambda: { apiVersion: "2015-03-31" },
  ApiGateway: { apiVersion: "2015-07-09" },
};

AWS.config.update({ region: "ap-east-1" });

module.exports.awsListUsers = async (maxItems = 10) => {
  const iam = new AWS.IAM(API_VERSION.IAM);
  try {
    const data = await iam.listUsers({ MaxItems: maxItems }).promise();
    return data.Users || [];
  } catch (err) {
    console.log(`Error when list users, code: ${err.code}`);
    return [];
  }
};

module.exports.awsCreateUsers = async (userList = []) => {
  const iam = new AWS.IAM(API_VERSION.IAM);
  userList.forEach(async (username) => {
    try {
      await iam.createUser({ UserName: username }).promise();
      await iam
        .createLoginProfile({
          Password: username,
          UserName: username,
          PasswordResetRequired: false,
        })
        .promise();
      await iam.addUserToGroup({ GroupName: "Trainees", UserName: username }).promise();
    } catch (err) {
      console.log(`Error when create user [${username}], code: ${err.code}`);
    }
  });
};

module.exports.awsDeleteUsers = async (userList = []) => {
  const iam = new AWS.IAM(API_VERSION.IAM);
  userList.forEach(async (username) => {
    try {
      await iam.deleteUser({ UserName: username }).promise();
    } catch (err) {
      console.log(`Error when delete user [${username}], code: ${err.code}`);
    }
  });
};

module.exports.awsListEC2 = async () => {
  const ec2 = new AWS.EC2(API_VERSION.EC2);
  try {
    const data = await ec2.describeInstances({ DryRun: false }).promise();
    return data.Reservations.map((ins) => ins.Instances[0]);
  } catch (err) {
    console.log(`Error when list EC2, code: ${err.code}`);
    return [];
  }
};

module.exports.awsDeleteEC2 = async (instanceIDs = []) => {
  const ec2 = new AWS.EC2(API_VERSION.EC2);
  try {
    await ec2.terminateInstances({ InstanceIds: instanceIDs }).promise();
  } catch (err) {
    console.log(`Error when remove EC2 instances, code: ${err.code}`);
  }
};

module.exports.awsListDynamoTables = async (limit = 30) => {
  const ddb = new AWS.DynamoDB(API_VERSION.Dynamo);
  try {
    const data = await ddb.listTables({ Limit: limit }).promise();
    return data.TableNames;
  } catch (err) {
    console.log(`Error when list dynamo tables, code: ${err.code}`);
    return [];
  }
};

module.exports.awsDeleteDynamoTables = async (tableNames = []) => {
  const ddb = new AWS.DynamoDB(API_VERSION.Dynamo);
  tableNames.forEach(async (tableName) => {
    try {
      await ddb.deleteTable({ TableName: tableName }).promise();
    } catch (err) {
      console.log(`Error when delete table [${tableNames}], code: ${err.code}`);
    }
  });
};

module.exports.awsListLambda = async () => {
  const lambda = new AWS.Lambda(API_VERSION.Lambda);
  try {
    const data = await lambda.listFunctions().promise();
    return data.Functions;
  } catch (err) {
    console.log(`Error when list lambda functions, code: ${err.code}`);
    return [];
  }
};

module.exports.awsDeleteLambda = async (functions = []) => {
  const lambda = new AWS.Lambda(API_VERSION.Lambda);
  functions.forEach(async (func) => {
    try {
      await lambda.deleteFunction({ FunctionName: func, Qualifier: "1" }).promise();
    } catch (err) {
      console.log(`Error when delete lambda function [${func}], code: ${err.code}`);
    }
  });
};

module.exports.awsListRestApis = async () => {
  const apiGateway = new AWS.APIGateway(API_VERSION.APIGateway);
  try {
    const data = await apiGateway.getRestApis().promise();
    return data.items;
  } catch (err) {
    console.log("Error", err.code);
    return [];
  }
};

module.exports.awsDeleteRestApis = async (apis = []) => {
  const apiGateway = new AWS.APIGateway(API_VERSION.APIGateway);
  apis.forEach(async (api) => {
    try {
      await apiGateway.deleteRestApi({ restApiId: api }).promise();
    } catch (err) {
      console.log(`Error when delete Rest API [${api}], code: ${err.code}`);
    }
  });
};
