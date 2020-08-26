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

module.exports.awsCreateUsers = async (userList = [], group = "Trainees") => {
  if (userList.length === 0) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  for (let i = 0; i < userList.length; i++) {
    try {
      await iam.createUser({ UserName: userList[i].name }).promise();
      await iam
        .createLoginProfile({
          UserName: userList[i].name,
          Password: userList[i].pass || userList[i].name,
          PasswordResetRequired: false,
        })
        .promise();
      await iam
        .addUserToGroup({ GroupName: group, UserName: userList[i].name })
        .promise();
    } catch (err) {
      console.log(
        `Error when create user [${userList[i].name}], code: ${err.code}`
      );
    }
  }
};

async function awsRemoveAccessKey(username) {
  if (!username) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  try {
    const keys =
      (await iam.listAccessKeys({ UserName: username }).promise())
        .AccessKeyMetadata || [];
    for (let i = 0; i < keys.length; i++) {
      await iam
        .deleteAccessKey({
          AccessKeyId: keys[i].AccessKeyId,
          UserName: username,
        })
        .promise();
    }
  } catch (err) {
    console.log(
      `Error when delete accessKey for '${username}', code: ${err.code}`
    );
  }
}

module.exports.awsDeleteUsers = async (userList = [], group = "Trainees") => {
  if (userList.length === 0) return;

  const iam = new AWS.IAM(API_VERSION.IAM);
  for (let i = 0; i < userList.length; i++) {
    try {
      await iam.deleteLoginProfile({ UserName: userList[i] }).promise();
      await iam
        .removeUserFromGroup({ UserName: userList[i], GroupName: group })
        .promise();
      await awsRemoveAccessKey(userList[i]);
      await iam.deleteUser({ UserName: userList[i] }).promise();
    } catch (err) {
      console.log(`Error when delete user '${userList[i]}', code: ${err.code}`);
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
  for (let i = 0; i < tableNames.length; i++) {
    try {
      await ddb.deleteTable({ TableName: tableNames[i] }).promise();
    } catch (err) {
      console.log(
        `Error when delete table [${tableNames[i]}], code: ${err.code}`
      );
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
  for (let i = 0; i < functions.length; i++) {
    try {
      const resp = await lambda
        .deleteFunction({ FunctionName: functions[i] })
        .promise();
      console.log(resp);
    } catch (err) {
      console.log(
        `Error when delete lambda function [${functions[i]}], code: ${err.code}`
      );
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
  for (let i = 0; i < apis.length; i++) {
    try {
      // ! ISSUE: cannot send too many deletion requests, needs to improve
      await apiGateway.deleteRestApi({ restApiId: apis[i] }).promise();
      console.log(resp);
    } catch (err) {
      console.log(`Error when delete Rest API [${apis[i]}], code: ${err.code}`);
    }
  }
};
