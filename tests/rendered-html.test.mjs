import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("includes production metadata and app manifest", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title: \{ default: "HAKOT"/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /images: \["\/og\.png"\]/);
  assert.doesNotMatch(layout, /codex-preview|Your site is taking shape/i);
});

test("provides a dedicated resident app route", async () => {
  const appRoute = await readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../app/HakotApp.tsx", import.meta.url), "utf8");
  assert.match(appRoute, /HAKOT resident app/);
  assert.match(appRoute, /iframe src="\/\?app=resident"/);
  assert.match(app, /window\.location\.href = "\/app"/);
});

test("includes the responsive photo, wallet, and reward workflows", async () => {
  const [app, css, page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/HakotApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(app, /type MobileView = "home" \| "scan" \| "wallet" \| "rewards" \| "profile"/);
  assert.match(app, /accept="image\/\*"/);
  assert.match(app, /capture="environment"/);
  assert.match(app, /Estimate my points/);
  assert.match(app, /10 points = ₱1 reward value/);
  assert.match(app, /Your trash/);
  assert.match(app, /Try the live demo/);
  assert.match(app, /How HAKOT works/);
  assert.match(app, /localStorage\.setItem\("hakot-wallet-v2"/);
  assert.match(app, /serviceWorker\.register\("\/sw\.js"/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /\.marketing-site/);
  assert.match(css, /\.site-hero/);
  assert.match(css, /\.desktop-demo/);
  assert.match(css, /\.mobile-app/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
