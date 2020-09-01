/* eslint-disable no-console */
const AWS = require("aws-sdk");

const API_GATEWAY_QUOTA = 20; // seconds every deletion

const delay = (sec) => new Promise((resolve) => setTimeout(() => resolve(), sec * 1000));

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

module.exports.awsCreateUsers = async (userList = [], group = "Trainees") => {
  if (userList.length === 0) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  for (user of userList) {
    try {
      await iam.createUser({ UserName: user.name }).promise();
      await iam
        .createLoginProfile({
          UserName: user.name,
          Password: user.pass || user.name,
          PasswordResetRequired: false,
        })
        .promise();
      await iam.addUserToGroup({ GroupName: group, UserName: user.name }).promise();
    } catch (err) {
      console.log(`Error when create user [${user.name}], code: ${err.code}`);
    }
  }
};

async function awsRemoveAccessKey(username) {
  if (!username) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  try {
    const keys =
      (await iam.listAccessKeys({ UserName: username }).promise()).AccessKeyMetadata || [];
    for (key of keys) {
      await iam
        .deleteAccessKey({
          AccessKeyId: key.AccessKeyId,
          UserName: username,
        })
        .promise();
    }
  } catch (err) {
    console.log(`Error when delete accessKey for '${username}', code: ${err.code}`);
  }
}

module.exports.awsDeleteUsers = async (userList = [], group = "Trainees") => {
  if (userList.length === 0) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  for (user of userList) {
    try {
      await iam.deleteLoginProfile({ UserName: user }).promise();
      await iam.removeUserFromGroup({ UserName: user, GroupName: group }).promise();
      await awsRemoveAccessKey(user);
      await iam.deleteUser({ UserName: user }).promise();
    } catch (err) {
      console.log(`Error when delete user '${user}', code: ${err.code}`);
    }
  }
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
  if (instanceIDs.length === 0) return;

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
  if (tableNames.length === 0) return;

  const ddb = new AWS.DynamoDB(API_VERSION.Dynamo);
  for (tableName of tableNames) {
    try {
      await ddb.deleteTable({ TableName: tableName }).promise();
    } catch (err) {
      console.log(`Error when delete table [${tableName}], code: ${err.code}`);
    }
  }
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
  if (functions.length === 0) return;

  const lambda = new AWS.Lambda(API_VERSION.Lambda);
  for (func of functions) {
    try {
      await lambda.deleteFunction({ FunctionName: func }).promise();
    } catch (err) {
      console.log(`Error when delete lambda function [${func}], code: ${err.code}`);
    }
  }
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
  if (apis.length === 0) return;

  const apiGateway = new AWS.APIGateway(API_VERSION.APIGateway);
  for (api of apis) {
    try {
      await apiGateway.deleteRestApi({ restApiId: api }).promise();
      await delay(API_GATEWAY_QUOTA);
    } catch (err) {
      console.log(`Error when delete Rest API [${api}], code: ${err.code}`);
    }
  }
};
