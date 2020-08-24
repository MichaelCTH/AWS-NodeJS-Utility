const readline = require("readline");
const { exit } = require("process");
const awsUtils = require("./AWS-Utils");

const LIMIT = 50;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const TraineeList = [];

const main = async () => {
  rl.question(
    `${TraineeList}\nAre you sure you want to create above users? [Y/N] `,
    async (ans) => {
      if (ans !== "Y") {
        exit();
      }
      await awsUtils.awsCreateUsers(
        TraineeList.map((i) => ({ name: i })),
        "Trainees"
      );
      console.log("Completed...");
      const users = (await awsUtils.awsListUsers(LIMIT)).map((u) => u.UserName);
      console.log("Updated User List:\n", users);
      exit();
    }
  );
};

main();
