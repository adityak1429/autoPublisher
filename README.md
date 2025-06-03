<!-- # autoPublisher
This is a github action to automate the publishing of updates to apps you own in microsoft store.

Dont mess with applicationpackages, listings>..>images handled automatically.


exe stuff   -- need a exe creds
generalize for various listings --done
Use of old packages? --- different versions
other complexities? flights, add-ons etc --flights require atleast one sub

something about Platform overrides
Validation of json

Complete support for flights add-ons etc
1.	Use internal apis to publish first time

2.  Package the msix, check consistency of metadata with msix if overlap
3.	Pdp preview website

2.  setup sdk, then package but needs correct format, is this a impactful direction? -->
# autoPublisher
This is a github action to automate the publishing of updates to apps you own in microsoft store.

example repo where this is used > https://github.com/adityak1429/dummy_repo/

Dont mess with applicationpackages, listings>..>images in the json, it is handled automatically -- > clean later.

These are the inputs the action needs

command:
    description: 'The command to execute. Available command: getmetadata, json_init, publish'
    required: true
    default: 'publish'
  product-id:
    description: 'Product Id'
    required: true
  seller-id:
    description: 'Seller Id'
    required: true
  tenant-id:
    description: 'AAD Tenant Id'
    required: true
  client-id:
    description: 'App Client Id'
    required: true
  client-secret:
    description: 'App Client secret'
    required: true
  package-path:
    description: 'Path to the app directory to upload (The action searches for msix packages in this path and uploads all the packages in there)'
    required: false
  photos-path:
    description: 'Path to the photos directory to upload (uploads all photos in the directory prefix the names of the images with the correct tag i.e Screenshot_myss1.png )'
    required: false
  json-file-path:
    description: 'Path to the JSON file containing app metadata (run the action with json_init first to get the template of the json)'
    required: false


