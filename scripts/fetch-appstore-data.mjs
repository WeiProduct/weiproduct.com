#!/usr/bin/env node
/**
 * fetch-appstore-data.mjs
 * Fetches real, Apple-published App Store data for every app in products.json
 * via the iTunes Lookup API and writes a committed snapshot to data/appstore.json.
 *
 * The site renders ONLY from the committed snapshot (no runtime dependency on
 * Apple). Re-run this script whenever you want to refresh versions, release
 * dates, ratings, or screenshot URLs, then commit the updated JSON.
 *
 *   node scripts/fetch-appstore-data.mjs
 *
 * Never hand-edit metrics into the snapshot: every field must come from Apple.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));

const idToProduct = new Map();
for (const product of products) {
    const match = /id(\d+)/.exec(product.appStoreUrl || '');
    if (match) {
        idToProduct.set(Number(match[1]), product);
    }
}

const ids = Array.from(idToProduct.keys());
if (!ids.length) {
    console.error('No App Store ids found in products.json');
    process.exit(1);
}

const lookupUrl = `https://itunes.apple.com/lookup?id=${ids.join(',')}&entity=software&country=us`;

async function fetchLookup(attempt = 1) {
    try {
        const response = await fetch(lookupUrl, { headers: { accept: 'application/json' } });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (attempt < 2) {
            console.warn(`Lookup failed (${error.message}), retrying once...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchLookup(attempt + 1);
        }
        throw error;
    }
}

const payload = await fetchLookup();
if (!payload || !Array.isArray(payload.results) || !payload.results.length) {
    console.error('iTunes Lookup returned no results; keeping existing snapshot.');
    process.exit(1);
}

const order = new Map(ids.map((id, index) => [id, index]));
const apps = payload.results
    .filter(result => result.wrapperType === 'software')
    .map(result => ({
        trackId: result.trackId,
        siteName: idToProduct.get(result.trackId)?.name || result.trackName,
        appleName: result.trackName,
        version: result.version,
        releaseDate: result.releaseDate,
        currentVersionReleaseDate: result.currentVersionReleaseDate,
        averageUserRating: result.averageUserRating || 0,
        userRatingCount: result.userRatingCount || 0,
        screenshotUrls: result.screenshotUrls || [],
        trackViewUrl: result.trackViewUrl,
        primaryGenreName: result.primaryGenreName,
        formattedPrice: result.formattedPrice,
        price: result.price || 0,
        currency: result.currency || 'USD',
        minimumOsVersion: result.minimumOsVersion,
        artworkUrl512: result.artworkUrl512
    }))
    .sort((a, b) => (order.get(a.trackId) ?? 99) - (order.get(b.trackId) ?? 99));

const snapshot = {
    source: 'https://itunes.apple.com/lookup (Apple iTunes Lookup API)',
    fetchedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    apps
};

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'appstore.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote data/appstore.json with ${apps.length} apps (fetched ${snapshot.fetchedAt}).`);
console.log('Remember: index.html embeds this snapshot in <script id="appstoreData"> — keep them in sync.');

const embedPath = path.join(root, 'index.html');
const html = fs.readFileSync(embedPath, 'utf8');
const embedPattern = /(<script type="application\/json" id="appstoreData">)[\s\S]*?(<\/script>)/;
if (embedPattern.test(html)) {
    fs.writeFileSync(embedPath, html.replace(embedPattern, `$1\n${JSON.stringify(snapshot, null, 2)}\n    $2`));
    console.log('Updated embedded appstoreData block in index.html.');
}
