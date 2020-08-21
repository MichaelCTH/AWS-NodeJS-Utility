/* eslint-disable no-console */
const readline = require("readline");
const { exit } = require("process");
const awsUtils = require("./AWS-Utils");

const LIMIT = 50;
const userWhiteList = [
  // filter out admin accounts
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const awsResourceDeletion = async (username, ec2s, apis, lambdas, tables) => {
  // TODO remove resource
  console.log("deleted");
};

const main = async () => {
  const users = (await awsUtils.awsListUsers(LIMIT)).map((u) => u.UserName);
  const usernameToDel = users.filter((name) => !userWhiteList.includes(name));
  const ec2s = (await awsUtils.awsListEC2()).map((ec2) => ({
    id: ec2.InstanceId,
    date: ec2.LaunchTime,
  }));
  const apis = (await awsUtils.awsListRestApis()).map((api) => ({ id: api.id, name: api.name }));
  const lambdas = (await awsUtils.awsListLambda()).map((func) => func.FunctionName);
  const tables = await awsUtils.awsListDynamoTables(LIMIT);

  console.log("Users need to be removed:", usernameToDel);
  console.log("EC2 need to be removed:", ec2s);
  console.log("Apis need to be removed:", apis);
  console.log("Lambdas need to be removed:", lambdas);
  console.log("Tables need to be removed:", tables);

  rl.question("Would you like to delete all those data from AWS? [Y/N]", async (ans) => {
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
  });
};

main();
