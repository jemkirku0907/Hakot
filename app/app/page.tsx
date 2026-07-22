"use client";

import { useEffect } from "react";

export default function ResidentAppPage() {
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.location.replace("/?app=resident");
    }
  }, []);

  return (
    <main className="app-route-shell">
      <aside className="app-route-copy">
        <a href="/" className="app-route-back">← Back to website</a>
        <span className="site-kicker">HAKOT resident app</span>
        <h1>Snap. Verify.<br />Earn rewards.</h1>
        <p>Use the working app demo to scan recyclables, check estimated points, view your wallet, and explore rewards.</p>
        <div>
          <span><b>1</b>Take a photo</span>
          <span><b>2</b>See estimated points</span>
          <span><b>3</b>Verify at pickup</span>
        </div>
      </aside>
      <section className="app-route-device" aria-label="HAKOT mobile application">
        <iframe src="/?app=resident" title="HAKOT resident app" allow="camera" />
      </section>
      <a href="/" className="app-route-mobile-back">← Website</a>
    </main>
  );
}
