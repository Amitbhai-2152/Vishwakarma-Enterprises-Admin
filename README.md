# Vishwakarma Enterprises — Admin

Separate product-catalogue manager for the public Vishwakarma Enterprises website.

## How it works

- Product data lives in `data/products.json`.
- The public website reads that central catalogue.
- The admin panel edits a browser draft first.
- **Publish Changes** commits the final catalogue to this repository.
- Product images selected in the admin are resized in the browser and stored in `images/products/`.

## One-time connection

Open `setup.html` and connect a GitHub fine-grained token restricted to this repository with **Contents: Read and write** permission. The token is stored only in your browser's local storage; it is not committed to the repository.

For the lowest practical risk, create a token with the narrowest repository scope possible and revoke it from GitHub if the browser is no longer trusted.

## Bulk products

Use `products-template.csv` as the starting spreadsheet format. Bulk-import UI can be added without changing the public website data model.

## Cost model

This catalogue architecture does not use Firebase for product storage. GitHub repository storage and any chosen website/image hosting still have their own platform limits; do not assume unlimited traffic or unlimited media storage.

## Public website

The public repository is `Amitbhai-2152/Vishwakarma-Enterprises` and consumes this repository's `data/products.json`.
