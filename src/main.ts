import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);
const diff = require("diff");
const archiver = require("archiver");
const path = require("path");
const axios = (require("axios")).default;
const fs = require("fs");
import { BlockBlobClient } from "@azure/storage-blob";

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

 
/**
 * Uploads a file to Azure Blob Storage with progress reporting.
 * @param blobUri The SAS URL for the blob.
 * @param localFilePath The path to the local file.
 * @param progressCallback Optional progress callback (0-100).
 * @returns The ETag of the uploaded blob.
 */
export async function uploadFileToBlob(
  blobUri: string,
  localFilePath: string,
  progressCallback?: (percent: number) => void
): Promise<string> {
  // Ensure '+' is encoded as '%2B' in blobUri (SAS token encoding issue workaround)
  const encodedUri = blobUri.replace(/\+/g, "%2B");
  const blobClient = new BlockBlobClient(encodedUri);

  const fileSize = fs.statSync(localFilePath).size;
  const fileStream = fs.createReadStream(localFilePath);

  let lastReportedPercent = -1;

  const uploadOptions = {
    blobHTTPHeaders: {
      blobContentType: "application/zip", // Adjust this if needed
    },
    onProgress: (progress: { loadedBytes: number }) => {
      const percent = Math.floor((progress.loadedBytes / fileSize) * 100);
      if (progressCallback && percent !== lastReportedPercent) {
        lastReportedPercent = percent;
        progressCallback(percent);
      }
    },
  };

  try {
    const response = await blobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024, // 4MB buffer size
      20,              // Max concurrency
      uploadOptions
    );

    if (response.etag) {
      return response.etag;
    } else {
      throw new Error("Upload succeeded but ETag is missing.");
    }
  } catch (err: any) {
    throw new Error(`Upload failed: ${err.message || "Unknown error"}`);
  }
}

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
      //143 need packager too or check current msix consistent with metadata if msix provided
      //143 currenly assume msix is provided and is consistent with metadata

      const jsonFilePath = core.getInput("json-file-path") || "";
      let metadata_given_json: any;
      let metadata_given_string: string;
      let metadata_present_json: any;
      let metadata_present_string: string;
      if (!jsonFilePath) {
        core.warning("Missing input: json-file-path assuming metadata need not be changed");
      }
      else{
        core.info("deleting existing submission if any");
        try{
          await execAsync(`msstore submission delete ${productId} --no-confirm `);
          core.info("Existing submission deleted successfully.");
        }
        catch (error) {
          core.warning("Failed to delete existing submission. Continuing with update.");
        }

  
        core.info("Reading JSON file for metadata");
        try {
          metadata_given_json = JSON.parse((await fs.promises.readFile(jsonFilePath, "utf-8")).replace(
            /"(?:[^"\\]|\\.)*"/g,
            (str:any) => str.replace(/(\r\n|\r|\n)/g, "\\n")
          ));
          metadata_given_string = JSON.stringify(metadata_given_json, null, 2);
          core.info("JSON file read successfully. ...");
        } 
        catch (error) {
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
          // compare with json list all which are required to be changed and manually set them
          metadata_present_json["Listings"]["en-us"]["BaseListing"]["Description"] = "my own plssss...12";
          const fieldsToCopy = [
            "Listings",
            "Pricing",
            "Properties",
            "Visibility",
            "ApplicationCategory",
            "AllowTargetFutureDeviceFamilies",
            "ApplicationPackages",
            "Keywords"
          ];

          // Create a new object with only the specified fields from metadata_present_json
          const filteredMetadata: any = {};
          for (const field of fieldsToCopy) {
            if (metadata_present_json.hasOwnProperty(field)) {
              filteredMetadata[field] = metadata_present_json[field];
            }
          }

          // You can now use filteredMetadata as your new JSON object
          core.info("Filtered metadata fields copied: " + JSON.stringify((filteredMetadata)));
          
          metadata_given_string = JSON.stringify(filteredMetadata, null, 2);
          // Escape inner double quotes for the shell
          const escapedJson = metadata_given_string
          .replace(/(["\\])/g, '\\$1')
          .replace(/(\r\n|\r|\n)/g, '');

          core.info("Updating metadata with the provided JSON file...");
          try {
            // resolve issues with the below command
            // possible issue with cli or use case

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
        }
        else{
        core.info("Listing assets are identical to the provided JSON file. No action needed.");
        }
      }

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
      const uploadUrl = metadata_present_json["FileUploadUrl"];

      
      core.info(`Zipping files at package path: ${packagePath}`);
      const zipFilePath = path.join(process.cwd(), "package.zip");
      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
          core.info(`Created zip file: ${zipFilePath} (${archive.pointer()} bytes)`);
          resolve();
        });
        archive.on("error", (err: Error) => reject(err));

        archive.pipe(output);
        archive.directory(packagePath, false);
        archive.finalize();
      });
      core.info("Files zipped successfully.");

      //upload

      core.info(`Uploading package to ${uploadUrl}`);
      uploadFileToBlob(
        uploadUrl,
        zipFilePath,
        (progress) => console.log(`Upload progress: ${progress}%`)
      ).then((etag) => {
        console.log(`Upload complete! ETag: ${etag}`);
      }).catch(console.error);


      core.info("Publishing the submission...");
      const out = exec(`msstore submission publish ${productId}`);
      if (out.stdout) {
        out.stdout.on("data", (data) => process.stdout.write(data));
      }
      if (out.stderr) {
        out.stderr.on("data", (data) => process.stderr.write(data));
      }
      await new Promise((resolve, reject) => {
        out.on("close", (code) => {
        if (code === 0) resolve(undefined);
        else reject(`Publish process exited with code ${code}`);
        });
        out.on("error", reject);
      });

      core.info("Submission published successfully.");

      //poll for status


          }
    else{
      core.setFailed("Invalid command. Use 'getmetadata' or 'publish'.");
      return;
    }




  } catch (error: unknown) {
    core.setFailed(error as string);
  }
  })();

