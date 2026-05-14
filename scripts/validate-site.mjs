import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const fail = message => {
    throw new Error(message);
};

const products = JSON.parse(read('products.json'));
const indexHtml = read('index.html');
const manifest = JSON.parse(read('manifest.json'));

if (!Array.isArray(products) || products.length === 0) {
    fail('products.json must contain at least one product');
}

const requiredProductFields = ['name', 'category', 'group', 'icon', 'description', 'url'];
const names = new Set();
const urls = new Set();

products.forEach((product, index) => {
    requiredProductFields.forEach(field => {
        if (!product[field]) {
            fail(`Product ${index + 1} is missing ${field}`);
        }
    });

    if (names.has(product.name)) {
        fail(`Duplicate product name: ${product.name}`);
    }

    if (urls.has(product.url)) {
        fail(`Duplicate product URL: ${product.url}`);
    }

    if (!exists(product.icon)) {
        fail(`Missing product icon: ${product.icon}`);
    }

    names.add(product.name);
    urls.add(product.url);
});

const embeddedMatch = indexHtml.match(/<script type="application\/json" id="productData">\s*([\s\S]*?)\s*<\/script>/);
if (!embeddedMatch) {
    fail('index.html is missing embedded productData fallback');
}

const embeddedProducts = JSON.parse(embeddedMatch[1]);
if (JSON.stringify(embeddedProducts) !== JSON.stringify(products)) {
    fail('Embedded productData is out of sync with products.json');
}

const jsonLdBlocks = Array.from(indexHtml.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g))
    .map(match => JSON.parse(match[1]));
const itemList = jsonLdBlocks.find(block => block['@type'] === 'ItemList');
if (!itemList) {
    fail('Missing ItemList structured data');
}

if (itemList.numberOfItems !== products.length || itemList.itemListElement.length !== products.length) {
    fail('ItemList structured data product count does not match products.json');
}

products.forEach((product, index) => {
    const item = itemList.itemListElement[index];
    if (!item || item.position !== index + 1 || item.name !== product.name || item.url !== product.url) {
        fail(`ItemList structured data mismatch at position ${index + 1}`);
    }
});

['assets/brand/social-card.svg', 'assets/brand/social-card.png'].forEach(file => {
    if (!exists(file)) {
        fail(`Missing brand asset: ${file}`);
    }
});

if (!indexHtml.includes('assets/brand/social-card.png')) {
    fail('Social card metadata must point to assets/brand/social-card.png');
}

if (/font-awesome|cdnjs\.cloudflare\.com|class="fa/.test(indexHtml)) {
    fail('index.html should not depend on Font Awesome CDN');
}

if (manifest.theme_color !== '#0f172a' || manifest.background_color !== '#f8fafc') {
    fail('Manifest colors do not match the site theme');
}

console.log(`Validated ${products.length} products, metadata, structured data, and brand assets.`);
