#!/usr/bin/env node

import { $ } from "execa";
import { execSync } from "child_process";
import { intro, outro, confirm, isCancel, cancel, text } from "@clack/prompts";
import color from "picocolors";

async function main() {
   console.log();
   console.log(color.blue(`Please ensure you have purchased https://launchfast.pro before proceeding.`));
   console.log();

   intro(color.bgWhite(color.black(` Checking requirements`)));
   const hasFly = await $`fly version`.then(
      () => true,
      () => false
   );
   if (!hasFly) {
      outro(color.red(`Fly CLI is required!`));
      console.log(color.blue(`Please install the Fly CLI before proceeding.`));
      console.log(color.blue(`https://fly.io/docs/flyctl/install/`));
      console.log();
      return process.exit(0);
   }
   outro(color.green(`Fly CLI is installed!`));

   intro(color.bgWhite(color.black(` LaunchFast CLI`)));

   const hasPrivateAccessToken = await confirm({
      message: "Do you have a GitHub Private Access Token ready?",
   });
   if (isCancel(hasPrivateAccessToken)) {
      cancel("Operation cancelled");
      return process.exit(0);
   }

   if (!hasPrivateAccessToken) {
      let createdPrivateAccessToken;
      do {
         createdPrivateAccessToken = await confirm({
            message: "Visit https://github.com/settings/tokens/new?description=LaunchFast%20Private%20Access&scopes=repo and create a Private Access Token. Did you create one?",
         });
         if (isCancel(createdPrivateAccessToken)) {
            cancel("Operation cancelled");
            return process.exit(0);
         }
      } while (!createdPrivateAccessToken);
   }

   const privateAccessToken = await text({
      message: "Paste your Private Access Token here:",
      placeholder: "ghp_...",
      initialValue: "",
      validate(value) {
         if (value.length === 0) return `A Private Access Token is required!`;
         if (!value.startsWith("ghp_")) return `Invalid Private Access Token!`;
      },
   });
   if (isCancel(privateAccessToken)) {
      cancel("Operation cancelled");
      return process.exit(0);
   }

   const url = "https://api.github.com/repos/andrecasal/launch-fast-stack/tarball";
   const response = await fetch(url, {
      method: "HEAD",
      headers: {
         Authorization: `token ${privateAccessToken}`,
      },
   });
   const userHasAccess = response.status === 302 || response.status === 200;

   if (!userHasAccess) {
      outro(color.red(`Access denied! 🛑`));
      console.log(color.blue(`After your purchase, you should have received an email inviting you to the LaunchFast private repository.`));
      console.log(color.blue(`Please make sure you have accepted the invitation before using this CLI.`));
      console.log();
      return;
   }
   outro(`Access granted! 🚀`);

   const command = `npx --yes create-remix@latest --git-init --install --init-script --template andrecasal/launch-fast-stack --token ${privateAccessToken}`;
   try {
      execSync(command, { stdio: "inherit" });
   } catch (error) {
      console.error("Failed to execute command:", error.message);
      console.error("Error details:", error);
   }
}

main().catch(console.error);
