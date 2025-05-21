import * as core from "@actions/core";
(async function main() {
try {
    const command = core.getInput("command");
    switch (command) {
      case "configure": {
        const productId = core.getInput("product-id");
        const sellerId = core.getInput("seller-id");
        const tenantId = core.getInput("tenant-id");
        const clientId = core.getInput("client-id");
        const clientSecret = core.getInput("client-secret");

        break;
      }

      case "get": {
        break;
      }

      case "update": {
        break;
      }

      case "poll": {
        break;
      }

      case "publish": {
        break;
      }

      default: {
        core.setFailed(`Unknown command - ("${command}").`);

        break;
      }
    }
  } catch (error: unknown) {
    core.setFailed(error as string);
  }
  })();