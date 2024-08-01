import { execSync } from "child_process";
import readline from "readline";

function launchFast(token) {
   const command = `npx --yes create-remix@latest --install --no-git-init --init-script --template andrecasal/launch-fast-stack --token ${token}`;
   try {
      execSync(command, { stdio: "inherit" });
   } catch (error) {
      console.error("Failed to execute command:", error.message);
      console.error("Error details:", error);
   }
}

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout,
});

rl.question("Please enter your LaunchFast access token: ", (token) => {
   launchFast(token);
   rl.close();
});
