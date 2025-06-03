# autoPublisher

**autoPublisher** is a GitHub Action to automate publishing updates to apps you own in the Microsoft Store.

**Example repository:**  
[adityak1429/dummy_repo](https://github.com/adityak1429/dummy_repo/)

> **Note:**  
> Do not modify `applicationpackages`, `listings > ... > images` in the JSON file. These are handled automatically.

---

## Inputs

| Name            | Description                                                                                                                                         | Required | Default   |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|----------|-----------|
| `command`       | The command to execute. Available commands: `getmetadata`, `json_init`, `publish`                                                                   | Yes      | publish   |
| `product-id`    | Product Id                                                                                                                                          | Yes      |           |
| `seller-id`     | Seller Id                                                                                                                                           | Yes      |           |
| `tenant-id`     | AAD Tenant Id                                                                                                                                       | Yes      |           |
| `client-id`     | App Client Id                                                                                                                                       | Yes      |           |
| `client-secret` | App Client secret                                                                                                                                   | Yes      |           |
| `package-path`  | Path to the app directory to upload. The action searches for MSIX packages in this path and uploads all packages found.                             | No       |           |
| `photos-path`   | Path to the photos directory to upload. Uploads all photos in the directory. Prefix image names with the correct tag (e.g., `Screenshot_myss1.png`).| No       |           |
| `json-file-path`| Path to the JSON file containing app metadata. Run the action with command `json_init` to first to get the template JSON.                                      | No       |           |

---
