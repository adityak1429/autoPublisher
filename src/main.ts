import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);
const diff = require("diff");

// import * as core from "@actions/core";
import * as dotenv from "dotenv";
dotenv.config();
const core = {
  getInput(name: string): string {
    const value = process.env[name.replace(/-/g, "_").toUpperCase()];
    if (!value) {
      this.setFailed(`Missing environment variable for ${name}`);
      process.exit(1);
    }
    return value;
  },
  setFailed(message: string): void {
    console.error(`❌ ${message}`);
  },
  info(message: string): void {
    console.info(`ℹ️ ${message}`);
  },
  warning(message: string): void {
    console.warn(`⚠️ ${message}`);
  },
  setDebug(message: string): void {
    console.debug(`🐞 ${message}`);
  }
};



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

    // await execAsync(`msstore reconfigure -t ${tenantId} -c ${clientId} -cs ${clientSecret} -s ${sellerId}`);
    
    core.info("Configuration completed successfully.");
    
    if(command==="getmetadata") {
      core.info("Fetching metadata...");
      const metadataCmd = exec(`msstore submission get ${productId}`);
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
    else if(command==="publish") {

      const fs = await import("fs/promises");
      const jsonFilePath = core.getInput("json-file-path") || "";
      if (!jsonFilePath) {
        core.warning("Missing input: json-file-path assuming metadata need not be changed");
      }
      else{
        let metadata_given_json: any;
        let metadata_given_string: string;
        let metadata_present_json: any;
        let metadata_present_string: string;
  
        core.info("Reading JSON file for metadata");
        try {
          metadata_given_json = JSON.parse((await fs.readFile(jsonFilePath, "utf-8")).replace(
            /"(?:[^"\\]|\\.)*"/g,
            (str) => str.replace(/(\r\n|\r|\n)/g, "\\n")
          ));
          metadata_given_string = JSON.stringify(metadata_given_json, null, 2);
          core.info("JSON file read successfully. ...");
        } catch (error) {
          core.warning(`Could not read/parse JSON file at ${jsonFilePath}. Skipping comparison.`);
          core.warning(error as string);
          return;// ideally exit to no check.
        }


        core.info("Fetching current metadata for comparison...");

        
        try{
          // metadata_present_json = "";
          metadata_present_json = JSON.parse((await execAsync(`msstore submission get ${productId}`)).stdout.replace(
            /"(?:[^"\\]|\\.)*"/g,
            (str) => str.replace(/(\r\n|\r|\n)/g, "\\n")
          ));
          metadata_present_string = JSON.stringify(metadata_present_json, null, 2);
          core.info("Current metadata fetched successfully.");
        }
        catch (error){
          core.warning("Failed to parse metadata. Skipping comparison.");
          core.warning(error as string);
          return; //143 ideally exit to no check.
        }
        
        let isDifferent = metadata_present_string !== metadata_given_string;

        if (isDifferent) {
          core.info("Differences found between listing assets and provided assets:");
          const differences = diff.createPatch("assets", metadata_given_string, metadata_present_string, "given", "present");
          core.info("Metadata different from the provided JSON file. Proceeding with updating the metadata. Here are the differences:");
          const diffLines = differences.split('\n');
          diffLines.forEach((line: string) => {
          if (line.startsWith('+') || line.startsWith('-')) {
            core.info(line);
          }
          });
          metadata_present_json["Listings"]["en-us"]["BaseListing"]["Description"] = "my own plssss...";
          delete metadata_present_json["FileUploadUrl"];
          metadata_given_string = JSON.stringify(metadata_present_json, null, 2);
          // Escape inner double quotes for the shell
            const escapedJson = metadata_given_string
            .replace(/(["\\])/g, '\\$1')
            .replace(/(\r\n|\r|\n)/g, '');

          core.info("Updating metadata with the provided JSON file...");
          try {
            // resolve issues with the below command
            // possible issue with cli or use case
            try{
              await execAsync(`msstore submission delete ${productId} `);
            }
            catch (error) {
              core.warning("Failed to delete existing submission. Continuing with update.");
            }

            const P =  exec(`msstore submission updateMetadata -v ${productId} "${escapedJson}"`);
            if (P.stdout) {
              P.stdout.on("data", (data) => process.stdout.write(data));
            }
      if (P.stderr) {
        P.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        P.on("close", (code) => {
        if (code === 0) resolve(undefined);
        else reject(`Publish process exited with code ${code}`);
        });
        P.on("error", reject);
      });
          }
          catch (error) {
            core.setFailed(`Failed to update metadata: ${error}`);
            return; //143 ideally exit to no check.
          }
          core.info("Metadata updated successfully.");
          return;
        }
        else{
        core.info("Listing assets are identical to the provided JSON file. No action needed.");
        }
      }


      //143 need packager too or check current msix consistent with metadata if msix provided
      //143 currenly assume msix is provided and is consistent with metadata
      core.info("Publishing the package...");
      
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