/* eslint-disable no-console */
const readline = require("readline");
const { exit } = require("process");
const awsUtils = require("./AWS-Utils");

const LIMIT = 50;
const userWhiteList = require("./USER_WHITE_LIST.json").whiteList;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const awsResourceDeletion = async (username, ec2s, apis, lambdas, tables) => {
  // * EC2
  console.log("Deleting EC2 machines...");
  await awsUtils.awsDeleteEC2(ec2s);
  console.log("EC2 removal completed");
  // * API
  console.log("Deleting Rest APIs...");
  await awsUtils.awsDeleteRestApis(apis);
  console.log("Rest API removal completed");
  // * Lambda
  console.log("Deleting Lambdas functions...");
  await awsUtils.awsDeleteLambda(lambdas);
  console.log("Lambdas removal completed");
  // * Tables
  console.log("Deleting Dynamo tables...");
  await awsUtils.awsDeleteDynamoTables(tables);
  console.log("Dynamo table removal completed");
  // * Users
  console.log("Deleting Users...", username);
  await awsUtils.awsDeleteUsers(username);
  console.log("User removal completed");
};

const main = async () => {
  const users = (await awsUtils.awsListUsers(LIMIT)).map((u) => u.UserName);
  let usernameToDel = users.filter((name) => !userWhiteList.includes(name));

  let ec2s = (await awsUtils.awsListEC2())
    .map((ec2) => ({
      id: ec2.InstanceId,
      date: ec2.LaunchTime,
      state: ec2.State.Name,
    }))
    .filter((ec2) => ec2.state !== "terminated");

  let apis = (await awsUtils.awsListRestApis()).map((api) => ({
    id: api.id,
    name: api.name,
  }));

  let lambdas = (await awsUtils.awsListLambda()).map(
    (func) => func.FunctionName
  );

  let tables = await awsUtils.awsListDynamoTables(LIMIT);

  // =====================================
  // ## Interrupter ##
  // usernameToDel = [];
  // ec2s = [];
  // apis = [];
  // lambdas = [];
  // tables = [];
  // =====================================

  console.log("Users need to be removed:", usernameToDel);
  console.log("EC2 need to be removed:", ec2s);
  console.log("Apis need to be removed:", apis);
  console.log("Lambdas need to be removed:", lambdas);
  console.log("Tables need to be removed:", tables);

  rl.question(
    "Would you like to delete all those data from AWS? [Y/N] ",
    async (ans) => {
      if (ans === "Y") {
        await awsResourceDeletion(
          usernameToDel,
          ec2s.map((i) => i.id),
          apis.map((i) => i.id),
          lambdas,
          tables
        );
      }
      rl.close();
      exit();
    }
  );
};

main();
