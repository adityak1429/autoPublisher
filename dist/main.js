"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
// import * as core from "@actions/core";
const dotenv = __importStar(require("dotenv"));
const diff = require("diff");
dotenv.config();
const core = {
    getInput(name) {
        const value = process.env[name.replace(/-/g, "_").toUpperCase()];
        if (!value) {
            this.setFailed(`Missing environment variable for ${name}`);
            process.exit(1);
        }
        return value;
    },
    setFailed(message) {
        console.error(`❌ ${message}`);
    },
    setInfo(message) {
        console.info(`ℹ️ ${message}`);
    },
    setWarning(message) {
        console.warn(`⚠️ ${message}`);
    },
    setDebug(message) {
        console.debug(`🐞 ${message}`);
    }
};
(async function main() {
    try {
        core.setInfo("Starting the action...");
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
        core.setInfo("Configuration completed successfully.");
        if (command === "getmetadata") {
            core.setInfo("Fetching metadata...");
            const metadataCmd = (0, child_process_1.exec)(`msstore submission getListingAssets ${productId}`);
            if (metadataCmd.stdout) {
                metadataCmd.stdout.on("data", (data) => process.stdout.write(data));
            }
            if (metadataCmd.stderr) {
                metadataCmd.stderr.on("data", (data) => process.stderr.write(data));
            }
            await new Promise((resolve, reject) => {
                metadataCmd.on("close", (code) => {
                    if (code === 0)
                        resolve(undefined);
                    else
                        reject(`Metadata process exited with code ${code}`);
                });
                metadataCmd.on("error", reject);
            });
            core.setInfo("Metadata fetched successfully.");
        }
        // else if(command==="package") {
        //   core.setInfo("Packaging the app...");
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
        //   core.setInfo("Package created successfully.");
        // }
        else if (command === "publish") {
            const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
            const jsonFilePath = core.getInput("json-file-path");
            if (!jsonFilePath) {
                core.setFailed("Missing required input: json-file-path");
                return;
            }
            let providedAssets;
            let listingAssets;
            try {
                providedAssets = JSON.parse(await fs.readFile(jsonFilePath, "utf-8"));
            }
            catch (error) {
                core.setWarning(`Could not read/parse JSON file at ${jsonFilePath}. Skipping comparison.`);
                core.setWarning(error);
                return;
            }
            core.setInfo("Fetching current listing assets for comparison...");
            const { stdout: listingAssetsString } = await execAsync(`msstore submission getListingAssets ${productId}`);
            try {
                // Escape line breaks inside quoted strings
                const cleanedListingAssetsString = listingAssetsString.replace(/"(?:[^"\\]|\\.)*"/g, (str) => str.replace(/(\r\n|\r|\n)/g, "\\n"));
                listingAssets = JSON.parse(cleanedListingAssetsString);
            }
            catch (error) {
                core.setWarning("Failed to parse listing assets. Skipping comparison.");
                core.setWarning(error);
                return;
            }
            let isDifferent = JSON.stringify(listingAssets) !== JSON.stringify(providedAssets);
            if (isDifferent) {
                core.setInfo("Differences found between listing assets and provided assets:");
                const listingAssetsStr = JSON.stringify(listingAssets, null, 2);
                const providedAssetsStr = JSON.stringify(providedAssets, null, 2);
                const differences = diff.createPatch("assets", listingAssetsStr, providedAssetsStr, "current", "provided");
                console.log(differences);
            }
            if (isDifferent) {
                core.setInfo("Listing assets are different from the provided JSON file. Proceeding with publish.");
                // update metadata in portal
            }
            else {
                core.setInfo("Listing assets are identical to the provided JSON file. No action needed.");
            }
            //143 need packager too or check current msix consistent with metadata if msix provided
            const publish = (0, child_process_1.exec)(`msstore publish ${packagePath} -id ${productId}`);
            if (publish.stdout) {
                publish.stdout.on("data", (data) => process.stdout.write(data));
            }
            if (publish.stderr) {
                publish.stderr.on("data", (data) => process.stderr.write(data));
            }
            await new Promise((resolve, reject) => {
                publish.on("close", (code) => {
                    if (code === 0)
                        resolve(undefined);
                    else
                        reject(`Publish process exited with code ${code}`);
                });
                publish.on("error", reject);
            });
            core.setInfo("Package published successfully.");
        }
        else {
            core.setFailed("Invalid command. Use 'getmetadata' or 'publish'.");
            return;
        }
    }
    catch (error) {
        core.setFailed(error);
    }
})();
