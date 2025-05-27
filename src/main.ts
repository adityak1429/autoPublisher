import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);
const diff = require("diff");

import * as core from "@actions/core";
// import * as dotenv from "dotenv";
// dotenv.config();
// const core = {
//   getInput(name: string): string {
//     const value = process.env[name.replace(/-/g, "_").toUpperCase()];
//     if (!value) {
//       this.setFailed(`Missing environment variable for ${name}`);
//       process.exit(1);
//     }
//     return value;
//   },
//   setFailed(message: string): void {
//     console.error(`❌ ${message}`);
//   },
//   info(message: string): void {
//     console.info(`ℹ️ ${message}`);
//   },
//   warning(message: string): void {
//     console.warn(`⚠️ ${message}`);
//   },
//   setDebug(message: string): void {
//     console.debug(`🐞 ${message}`);
//   }
// };



(async function main() {
try {
    core.info("Starting the action...");
    const productId = core.getInput("product-id");
    const sellerId = core.getInput("seller-id");
    const tenantId = core.getInput("tenant-id");
    const clientId = core.getInput("client-id");
    const clientSecret = core.getInput("client-secret");
    const packagePath = core.getInput("package-path");
    const command = core.getInput("command");
    if (!productId || !sellerId || !tenantId || !clientId || !clientSecret) {
      core.setFailed("Missing required inputs");
      return;
    }

    await execAsync(`msstore reconfigure -t ${tenantId} -c ${clientId} -cs ${clientSecret} -s ${sellerId}`);
    core.info("Configuration completed successfully.");
    if(command==="getmetadata") {
      core.info("Fetching metadata...");
      const metadataCmd = exec(`msstore submission getListingAssets ${productId}`);
      if (metadataCmd.stdout) {
        metadataCmd.stdout.on("data", (data) => process.stdout.write(data));
      }
      if (metadataCmd.stderr) {
        metadataCmd.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        metadataCmd.on("close", (code) => {
          if (code === 0) resolve(undefined);
          else reject(`Metadata process exited with code ${code}`);
        });
        metadataCmd.on("error", reject);
      });
      core.info("Metadata fetched successfully.");
    }
    // else if(command==="package") {
    //   core.info("Packaging the app...");
    //   const packageCmd = exec(`msstore package ${packagePath} -id ${productId}`);
    //   if (packageCmd.stdout) {
    //     packageCmd.stdout.on("data", (data) => process.stdout.write(data));
    //   }
    //   if (packageCmd.stderr) {
    //     packageCmd.stderr.on("data", (data) => process.stderr.write(data));
    //   }
    //   await new Promise((resolve, reject) => {
    //     packageCmd.on("close", (code) => {
    //       if (code === 0) resolve(undefined);
    //       else reject(`Package process exited with code ${code}`);
    //     });
    //     packageCmd.on("error", reject);
    //   });
    //   core.info("Package created successfully.");
    // }
    else if(command==="publish") {

      const fs = await import("fs/promises");
      const jsonFilePath = core.getInput("json-file-path");
      if (!jsonFilePath) {
        core.setFailed("Missing required input: json-file-path");
        return;
      }
      let providedAssets: string;
      let listingAssets: string;

      try {
        providedAssets = JSON.parse(await fs.readFile(jsonFilePath, "utf-8"));
      } catch (error) {
        core.warning(`Could not read/parse JSON file at ${jsonFilePath}. Skipping comparison.`);
        core.warning(error as string);
        return;
      }

      core.info("Fetching current listing assets for comparison...");
      const { stdout: listingAssetsString } = await execAsync(`msstore submission getListingAssets ${productId}`);
      try{
        // Escape line breaks inside quoted strings
        const cleanedListingAssetsString = listingAssetsString.replace(
          /"(?:[^"\\]|\\.)*"/g,
          (str) => str.replace(/(\r\n|\r|\n)/g, "\\n")
        );
        listingAssets = JSON.parse(cleanedListingAssetsString);
      }
      catch (error){
        core.warning("Failed to parse listing assets. Skipping comparison.");
        core.warning(error as string);
        return;
      }


      let isDifferent = JSON.stringify(listingAssets) !== JSON.stringify(providedAssets);
      if (isDifferent) {
        core.info("Differences found between listing assets and provided assets:");
        const listingAssetsStr = JSON.stringify(listingAssets, null, 2);
        const providedAssetsStr = JSON.stringify(providedAssets, null, 2);
        const differences = diff.createPatch("assets", listingAssetsStr, providedAssetsStr, "current", "provided");
        console.log(differences);
      }

      if (isDifferent) {
        core.info("Listing assets are different from the provided JSON file. Proceeding with publish.");
        //143 update metadata in portal
      } else {
        core.info("Listing assets are identical to the provided JSON file. No action needed.");
      }
      //143 need packager too or check current msix consistent with metadata if msix provided
      //143 currenly assume msix is provided and is consistent with metadata
      const publish = exec(`msstore publish ${packagePath} -id ${productId}`);
      if (publish.stdout) {
        publish.stdout.on("data", (data) => process.stdout.write(data));
      }
      if (publish.stderr) {
        publish.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        publish.on("close", (code) => {
        if (code === 0) resolve(undefined);
        else reject(`Publish process exited with code ${code}`);
        });
        publish.on("error", reject);
      });
      core.info("Package published successfully.");
    }
    else{
      core.setFailed("Invalid command. Use 'getmetadata' or 'publish'.");
      return;
    }

  } catch (error: unknown) {
    core.setFailed(error as string);
  }
  })();