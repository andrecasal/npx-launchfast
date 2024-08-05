#!/usr/bin/env node

import { $ } from "execa";
import { execSync } from "child_process";
import { intro, spinner, confirm, isCancel, password, cancel, text, outro } from "@clack/prompts";
import { note } from "./ui.js";
import color from "picocolors";
import open from "open";

async function main() {
   console.log();
   intro(`Welcome to LaunchFast! 🚀`);

   note(
      `1. You've purchased https://launchfast.pro
2. Accepted the invitation to LaunchFast's repo
3. Installed Fly's CLI`,
      `Requirements`
   );

   const s = spinner();
   s.start(`Checking Fly's CLI...`);
   const hasFly = await $`fly version`.then(
      () => true,
      () => false
   );
   s.stop(`Checked Fly's CLI!`);

   // Check if the user has Fly's CLI installed
   if (!hasFly) {
      const shouldOpenFly = await confirm({
         message: color.red(`You don't have the Fly CLI installed. Open https://fly.io/docs/flyctl/install/?`),
      });
      if (isCancel(shouldOpenFly)) {
         cancel("Operation cancelled.");
         process.exit(0);
      }
      if (shouldOpenFly) {
         await open(`https://fly.io/docs/flyctl/install/`);
      }
      outro(`Ok, try again once you have Fly's CLI installed.`);
      console.log();
      return process.exit(0);
   }

   const shouldCreateNewToken = await confirm({
      message: "Create a new temporary GitHub Private Access Token?",
   });
   if (isCancel(shouldCreateNewToken)) {
      cancel("Operation cancelled");
      return process.exit(0);
   }
   if (shouldCreateNewToken) {
      await open(`https://github.com/settings/tokens/new?description=LaunchFast%20Private%20Access&scopes=repo`);
   }

   const privateAccessToken = await password({
      message: "Paste your (classic) Private Access Token here:",
      mask: "*",
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
      note(
         `1. You've purchased LaunchFast
2. Accepted the invitation to LaunchFast's repo`,
         `🔴 Access denied! Make sure that:`
      );
      const shouldOpenLaunchFast = await confirm({
         message: "Open https://launchfast.pro?",
      });
      if (isCancel(shouldOpenLaunchFast)) {
         cancel("Operation cancelled");
         return process.exit(0);
      }
      if (shouldOpenLaunchFast) {
         await open(`https://launchfast.pro`);
      }
      outro(`Ok, try again after you've accepted the invitation to LaunchFast's repo.`);
      console.log();
      return process.exit(0);
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
