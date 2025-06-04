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

/** Expected imageType values */
const imageType: string[] = [
  "Screenshot",
  "MobileScreenshot",
  "XboxScreenshot",
  "SurfaceHubScreenshot",
  "HoloLensScreenshot",
  "StoreLogo9x16",
  "StoreLogoSquare",
  "Icon",
  "PromotionalArt16x9",
  "PromotionalArtwork2400X1200",
  "XboxBrandedKeyArt",
  "XboxTitledHeroArt",
  "XboxFeaturedPromotionalArt",
  "SquareIcon358X358",
  "BackgroundImage1000X800",
  "PromotionalArtwork414X180",
];
 
/**
 * Validates that all BaseListing.Images[].ImageType in each Listings locale are valid.
 * Throws an error if any invalid type is found.
 */
function validate_json(input: any): void {
  if (!input || typeof input !== "object" || !input.Listings) {
    throw new Error("Invalid input: Listings property missing.");
  }
  for (const locale of Object.keys(input.Listings)) {
    const baseListing = input.Listings[locale]?.BaseListing;
    if (!baseListing || !Array.isArray(baseListing.Images)) continue;
    for (const img of baseListing.Images) {
      if (!img.ImageType || !imageType.includes(img.ImageType)) {
        throw new Error(
          `Invalid ImageType "${img.ImageType}" in locale "${locale}". Allowed types: ${imageType.join(", ")}`
        );
      }
    }
  }
}


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

/**
 * Fetches metadata for the given productId using the msstore CLI.
 * Returns the combined stdout output as a string.
 */
async function fetchMetadata(productId: string): Promise<any> {
  core.info("Fetching metadata...");
  return await new Promise<any>((resolve, reject) => {
    const metadataCmd = exec(`msstore submission get ${productId}`);
    let output = "";
    if (metadataCmd.stdout) {
      metadataCmd.stdout.on("data", (data) => {
        output += data;
      });
    }
    if (metadataCmd.stderr) {
      metadataCmd.stderr.on("data", (data) => process.stderr.write(data));
    }
    metadataCmd.on("close", (code) => {
      if (code === 0) {
        core.info("Metadata fetched successfully.");
        // Replace newlines inside JSON string values
        const sanitized = output.replace(
          /"(?:[^"\\]|\\.)*"/g,
          (str: string) => str.replace(/(\r\n|\r|\n)/g, "\\n")
        );
        try {
          resolve(JSON.parse(sanitized));
        } catch (err) {
          reject(`Failed to parse metadata JSON: ${(err as Error).message}`);
        }
      } else {
        reject(`Metadata process exited with code ${code}`);
      }
    });
    metadataCmd.on("error", reject);
  });
}

/**
 * Returns a new object containing only the specified fields from the source object.
 */
function filterFields<T extends object>(source: T):any {
  const fields = [
    "ApplicationCategory",
    "Pricing",
    "Visibility",
    "TargetPublishMode",
    "TargetPublishDate",
    "Listings",
    "HardwarePreferences",
    "AutomaticBackupEnabled",
    "CanInstallOnRemovableMedia",
    "IsGameDvrEnabled",
    "GamingOptions",
    "HasExternalInAppProducts",
    "MeetAccessibilityGuidelines",
    "ApplicationPackages",
    "AllowMicrosoftDecideAppAvailabilityToFutureDeviceFamilies",
    "AllowTargetFutureDeviceFamilies",
    "Trailers",
  ];
  const result: { [key: string]: unknown } = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = (source as any)[field];
    }
  }
  return result;
}
let productId: string = "";
let sellerId: string  = "";
let tenantId: string  = "";
let clientId: string  = "";
let clientSecret: string  = "";
let packagePath: string = "";
let photosPath: string = "";
let command: string = "";

async function configureAction() {
  productId = core.getInput("product-id");
  sellerId = core.getInput("seller-id");
  tenantId = core.getInput("tenant-id");
  clientId = core.getInput("client-id");
  clientSecret = core.getInput("client-secret");
  packagePath = core.getInput("package-path");
  photosPath = core.getInput("photos-path");
  command = core.getInput("command");
  if (!productId || !sellerId || !tenantId || !clientId || !clientSecret) {
    core.setFailed("Missing required inputs");
    return;
  }

  await execAsync(`msstore reconfigure -t ${tenantId} -c ${clientId} -cs ${clientSecret} -s ${sellerId}`);
  
  core.info("Configuration completed successfully.");
}

async function updateMetadata(metadata: string) {
  
  // Escape inner double quotes for the shell
  metadata = JSON.stringify(metadata)
  .replace(/(["\\])/g, '\\$1')
  .replace(/(\r\n|\r|\n)/g, '');

  const out =  exec(`msstore submission updateMetadata ${productId} "${metadata}"`);
  if (out.stdout) {
    out.stdout.on("data", (data) => process.stdout.write(data));
  }
  if (out.stderr) {
    out.stderr.on("data", (data) => process.stderr.write(data));
  }
  await new Promise((resolve, reject) => {
    out.on("close", (code) => {
    if (code === 0) resolve(undefined);
    else reject(`updateMetadata process exited with code ${code}`);
    });
    out.on("error", reject);
  });
  core.info("Metadata updated successfully.");

}

async function zipandUpload(uploadUrl: string) {
  core.info(`Zipping files at package path: ${packagePath}`);

  // Also include files from the "photos" path if provided
  if (photosPath && fs.existsSync(photosPath) && fs.statSync(photosPath).isDirectory()) {
    core.info(`Including photos from: ${photosPath}`);
  } else if (photosPath) {
    core.warning(`Photos path "${photosPath}" does not exist or is not a directory. Skipping.`);
  }
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
    if (photosPath && fs.existsSync(photosPath) && fs.statSync(photosPath).isDirectory()) {
      archive.directory(photosPath, false);
    }
    archive.finalize();
  });
  core.info("Files zipped successfully.");

  //upload
  core.info(`zip: ${zipFilePath}`);
  core.info(`Uploading package to ${uploadUrl}`);
  uploadFileToBlob(
    uploadUrl,
    zipFilePath,
    (progress) => core.info(`Upload progress: ${progress}%`)
  ).then((etag) => {
    core.info(`Upload complete! ETag: ${etag}`);
  }).catch(console.error);
}

async function publishSubmission() {
  core.info("Publishing the submission...");
  let out = exec(`msstore submission publish ${productId}`);
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

}

async function pollSubmissionStatus() {
      //poll for status
      const out = exec(`msstore submission poll ${productId}`);
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
}

function checkDifference(metadata_new: any, metadata_old: any): boolean {
  // Convert both metadata objects to JSON strings
  const filteredMetadata_new_json = filterFields(metadata_new);
  const filteredMetadata_old = filterFields(metadata_old);
  const filteredMetadata_string_new = JSON.stringify(filteredMetadata_new_json, null, 2);
  const filteredMetadata_string_old = JSON.stringify(filteredMetadata_old, null, 2);

  if (filteredMetadata_string_new === filteredMetadata_string_old) {
    core.info("No changes detected in the metadata.");
    return false; // No changes
  }
  else {
    core.info("Changes detected in the metadata.");
    core.info("Differences found between listing assets and provided assets:");
    const differences = diff.createPatch("assets", filteredMetadata_string_new, filteredMetadata_string_old, "new", "old");
    core.info("Metadata different from the provided JSON file. Proceeding with updating the metadata. Here are the differences:");
    const diffLines = differences.split('\n');
    diffLines.forEach((line: string) => {
      core.info(line);
    });
    return true; // Changes detected
  }
}

async function add_files_to_metadata(metadata_json: any, packagePath: string, photosPath: string) {
  if (metadata_json.ApplicationPackages && Array.isArray(metadata_json.ApplicationPackages)) {
    for (const pkg of metadata_json.ApplicationPackages) {
      pkg.Status = "PendingDelete";
    }
  }
  // Set FileStatus to "PendingDelete" for all images 
  const listings = metadata_json?.Listings;
  if (listings && typeof listings === "object") {
  for (const locale of Object.keys(listings)) {
    const images = listings[locale]?.BaseListing?.Images;
    if (Array.isArray(images)) {
    for (const img of images) {
      img.FileStatus = "PendingDelete";
    }
    }
  }
  }

  // Update the metadata with the new values
  // Add entries for each file in packagePath directory to ApplicationPackages
  const packageFiles = fs.readdirSync(packagePath);
  for (const packEntry of packageFiles) {
  const entry = {
    fileName: packEntry,
    fileStatus: "PendingUpload",
  };
  metadata_json.ApplicationPackages.push(entry);
  }
  // add all photos
  const photoFiles: string[] = [];
  if (photosPath && fs.existsSync(photosPath) && fs.statSync(photosPath).isDirectory()) {
    for (const file of fs.readdirSync(photosPath)) {
      // Infer image type from filename prefix (e.g., Screenshot_abc.png)
      let type = file.split("_")[0];
      // Add the image entry to all locales in Listings
      for (const locale of Object.keys(metadata_json.Listings)) {
      if (
        metadata_json.Listings[locale] &&
        metadata_json.Listings[locale].BaseListing &&
        Array.isArray(metadata_json.Listings[locale].BaseListing.Images)
      ) {
        metadata_json.Listings[locale].BaseListing.Images.push({
        FileStatus: "PendingUpload",
        FileName: file,
        ImageType: type
        });
      }
      }
      photoFiles.push(file);
    }
  }
  return metadata_json;
}

(async function main() {
try {
    core.info("Starting the action...");

    await configureAction();
    
    if(command==="getmetadata") {
      core.info(JSON.stringify(await fetchMetadata(productId), null, 2));
    }

    else if (command==="json_init") {
      const metadata_json = await fetchMetadata(productId);
      core.info(JSON.stringify(filterFields(metadata_json),null,2));
    }

    else if(command==="publish") {
      //143 need packager too or check current msix consistent with metadata if msix provided
      //143 currenly assume msix is provided and is consistent with metadata

      core.info("deleting existing submission if any");
      try{
        await execAsync(`msstore submission delete ${productId} --no-confirm `);
        core.info("Existing submission deleted successfully.");
      }
      catch (error) {
        core.warning(`Failed to delete existing submission/ there is no existing submission. Continuing with update. ${error}`);
      }

      const jsonFilePath = core.getInput("json-file-path");
      let metadata_new_json: any;
      let metadata_old_json: any;
  
      core.info("Reading JSON file for metadata");
      try {
        metadata_new_json = JSON.parse((await fs.promises.readFile(jsonFilePath, "utf-8")).replace(
          /"(?:[^"\\]|\\.)*"/g,
          (str:any) => str.replace(/(\r\n|\r|\n)/g, "\\n")
        ));
        core.info("JSON file read successfully. ...");
      } 
      catch (error) {
        core.warning(`Could not read/parse JSON file at ${jsonFilePath}. Skipping comparison.`);
        core.warning(error as string);
        return;// ideally exit to no check.
      }

      
      core.info("Fetching current metadata for comparison...");
      metadata_old_json = (await fetchMetadata(productId));


      // filter and check if metadata is different
      let isDifferent = checkDifference(metadata_new_json, metadata_old_json);

      if (isDifferent) {
        // ideally do this with in old json and write to new json instead of modifying the new json
        // Set Status to "PendingDelete" for all ApplicationPackages
        let filteredMetadata_new_json = filterFields(metadata_new_json);
        filteredMetadata_new_json = await add_files_to_metadata(filteredMetadata_new_json, packagePath, photosPath);




        core.info("Updating metadata with the provided JSON file...");
        try {
          await validate_json(filteredMetadata_new_json);
          await updateMetadata(filteredMetadata_new_json);
        }
        catch (error) {
          core.setFailed(`Failed to update metadata: ${error}`);
          return; //ideally exit to no check?.
        }
      }
      else{
      core.info("Listing assets are identical to the provided JSON file. No action needed.");
      }

      // Fetch the upload URL for the package
      core.info("Fetching upload URL for the package...");
      try{
        metadata_new_json = await fetchMetadata(productId);
        core.info("Current metadata fetched successfully.");
      }
      catch (error){
        core.warning("Failed to parse metadata. Skipping comparison.");
        core.warning(error as string);
        return; //ideally exit to no check?.
      }

      const uploadUrl = metadata_new_json["FileUploadUrl"];

      await zipandUpload(uploadUrl);

      await publishSubmission();


      await pollSubmissionStatus();

    }
    else{
      core.setFailed("Invalid command. Use 'getmetadata' or 'publish' or 'json_init'.");
      return;
    }

  } catch (error: unknown) {
    core.setFailed(error as string);
  }
  })();

