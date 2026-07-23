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
        <span className="site-kicker">BasuCash resident app</span>
        <h1>Check. Sell.<br />Record.</h1>
        <p>Use the working app demo to check possible junkshop value, find nearby buyers, and track your cash earnings and EcoPoints.</p>
        <div>
          <span><b>1</b>Take a photo</span>
          <span><b>2</b>Check the possible range</span>
          <span><b>3</b>Sell and record</span>
        </div>
      </aside>
      <section className="app-route-device" aria-label="BasuCash mobile application">
        <iframe src="/?app=resident" title="BasuCash resident app" allow="camera" />
      </section>
      <a href="/" className="app-route-mobile-back">← Website</a>
    </main>
  );
}
