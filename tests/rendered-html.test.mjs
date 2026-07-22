import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the HAKOT application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>HAKOT \| Ipunin\. Ipa-hakot\. Masundan\. \| HAKOT<\/title>/i);
  assert.match(html, /manifest\.webmanifest/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
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
