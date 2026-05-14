# WeiProduct Company Website

This repository publishes the company website for `https://weiproduct.com/` through GitHub Pages.

## Update workflow

```bash
cd ~/Desktop/weiproduct.com
git pull
node scripts/validate-site.mjs
git add .
git commit -m "Update company site"
git push
```

GitHub Pages deploys from the `main` branch root. The `CNAME` file keeps the custom domain connected.

Product data lives in `products.json`. After changing products, run the validation script so the embedded file-preview fallback, structured data, icons, and social metadata stay in sync.
