import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("includes production metadata and app manifest", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title: \{ default: "BasuCash"/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /images: \["\/og-basucash-v2\.png"\]/);
  assert.doesNotMatch(layout, /codex-preview|Your site is taking shape/i);
});

test("provides a dedicated resident app route", async () => {
  const appRoute = await readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../app/HakotApp.tsx", import.meta.url), "utf8");
  assert.match(appRoute, /BasuCash resident app/);
  assert.match(appRoute, /iframe src="\/\?app=resident"/);
  assert.match(appRoute, /Check\. Sell\./);
  assert.match(app, /window\.location\.href = "\/app"/);
});

test("includes the responsive photo, earnings, map, and impact workflows", async () => {
  const [app, css, page, layout, packageJson, nearby] = await Promise.all([
    readFile(new URL("../app/HakotApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/NearbyJunkshops.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /type MobileView = "home" \| "locations" \| "scan" \| "wallet" \| "impact" \| "profile"/);
  assert.match(app, /accept="image\/\*"/);
  assert.match(app, /capture="environment"/);
  assert.match(app, /Estimate junkshop value/);
  assert.match(app, /EcoPoints are not money/);
  assert.match(app, /Junkshops pay residents directly/);
  assert.match(app, /Try the live demo/);
  assert.match(app, /How BasuCash works/);
  assert.match(app, /cash-wallet/);
  assert.match(app, /Sales record/);
  assert.match(app, /Check[\s\S]*Sell[\s\S]*Record/);
  assert.match(app, /localStorage\.setItem\("basucash-progress-v1"/);
  assert.doesNotMatch(app, /10 points = .*reward value|basucash-wallet-v1|Available to redeem/);
  assert.match(app, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /\.marketing-site/);
  assert.match(css, /\.site-hero/);
  assert.match(css, /\.desktop-demo/);
  assert.match(css, /\.mobile-app/);
  assert.match(css, /\.cash-wallet/);
  assert.match(css, /\.partner-map/);
  assert.match(css, /\.impact-hero/);
  assert.match(nearby, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(nearby, /tile\.openstreetmap\.org/);
  assert.match(nearby, /Directions/);
  assert.match(nearby, /basucash-community-shops-v1/);
  assert.match(nearby, /Add a small local junkshop/);
  assert.match(nearby, /Search Google Maps/);
  assert.match(nearby, /Community reported · Not yet verified/);
  assert.match(nearby, /Report incorrect or closed listing/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /family=Poppins/);
  assert.doesNotMatch(css, /DM\+Sans|Manrope/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
