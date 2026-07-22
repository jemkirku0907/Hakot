"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type MobileView = "home" | "scan" | "wallet" | "rewards" | "profile";
type MaterialId = "pet" | "cardboard" | "metal" | "glass";
type Estimate = { material: MaterialId; weight: number; points: number };
type Transaction = { id: string; label: string; points: number; date: string };

const materials: Record<MaterialId, { label: string; rate: number; mark: string; color: string }> = {
  pet: { label: "PET bottles", rate: 45, mark: "P", color: "aqua" },
  cardboard: { label: "Cardboard", rate: 25, mark: "C", color: "sand" },
  metal: { label: "Aluminum cans", rate: 70, mark: "M", color: "blue" },
  glass: { label: "Glass bottles", rate: 30, mark: "G", color: "lilac" },
};

const rewards = [
  { id: "load", icon: "₱", title: "Mobile load", meta: "Any local network", price: 200, value: "₱20" },
  { id: "grocery", icon: "B", title: "Grocery voucher", meta: "Partner stores", price: 500, value: "₱50" },
  { id: "bag", icon: "B", title: "BasuCash eco-bag", meta: "Reusable canvas bag", price: 800, value: "₱80" },
];

const initialTransactions: Transaction[] = [
  { id: "t1", label: "PET pickup verified", points: 185, date: "Jul 19" },
  { id: "t2", label: "Cardboard pickup verified", points: 95, date: "Jul 12" },
  { id: "t3", label: "Mobile load redeemed", points: -200, date: "Jul 08" },
];

function Mark({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`mark ${tone}`} aria-hidden="true">{children}</span>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <span className={`logo ${light ? "light" : ""}`}><span className="logo-mark">B</span><strong>BasuCash</strong></span>;
}

function PesoValue({ points }: { points: number }) {
  return <>{new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(points / 10)}</>;
}

export function HakotApp() {
  const [view, setView] = useState<MobileView>("home");
  const [points, setPoints] = useState(1280);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [material, setMaterial] = useState<MaterialId>("pet");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [scanState, setScanState] = useState<"empty" | "ready" | "analyzing" | "done">("empty");
  const [toast, setToast] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("basucash-wallet-v1") ?? window.localStorage.getItem("hakot-wallet-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { points: number; transactions: Transaction[] };
        queueMicrotask(() => { setPoints(parsed.points); setTransactions(parsed.transactions); });
      } catch { /* keep safe demo defaults */ }
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("basucash-wallet-v1", JSON.stringify({ points, transactions }));
  }, [points, transactions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => { if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setEstimate(null);
    setScanState("ready");
    setView("scan");
    setScanOpen(true);
  }

  function analyzePhoto() {
    setScanState("analyzing");
    window.setTimeout(() => {
      const weight = Number(Math.max(1.2, Math.min(6.8, ((fileName.length * 17) % 48) / 10 + 1.5)).toFixed(1));
      setEstimate({ material, weight, points: Math.round(weight * materials[material].rate) });
      setScanState("done");
    }, 900);
  }

  function submitEstimate() {
    if (!estimate) return;
    setToast("Pickup request sent for verification.");
    setScanOpen(false);
    setView("home");
  }

  function redeem(reward: (typeof rewards)[number]) {
    if (points < reward.price) {
      setToast(`You need ${reward.price - points} more points.`);
      return;
    }
    setPoints((value) => value - reward.price);
    setTransactions((items) => [{ id: String(Date.now()), label: `${reward.title} redeemed`, points: -reward.price, date: "Today" }, ...items]);
    setToast(`${reward.title} added to your vouchers.`);
  }

  return (
    <main>
      <MarketingSite onTry={() => { window.location.href = "/app"; }} onScan={() => fileRef.current?.click()} />

      <section className="mobile-app" aria-label="BasuCash resident mobile app">
        <header className="mobile-header"><Logo /><button className="avatar-button" onClick={() => setView("profile")}>MS</button></header>
        <div className="mobile-scroll">
          <ResidentView view={view} points={points} transactions={transactions} imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onView={setView} onChoose={() => fileRef.current?.click()} onMaterial={setMaterial} onAnalyze={analyzePhoto} onSubmit={submitEstimate} onRedeem={redeem} />
        </div>
        <MobileNav view={view} onView={setView} onScan={() => fileRef.current?.click()} />
      </section>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={choosePhoto} />

      {demoOpen && (
        <div className="demo-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDemoOpen(false)}>
          <section className="desktop-demo" role="dialog" aria-modal="true" aria-label="BasuCash live app demo">
            <div className="demo-copy"><Logo light /><span className="site-kicker">Interactive preview</span><h2>Try the resident app.</h2><p>Explore the wallet and rewards, or upload a sample photo to see the estimate flow.</p><ul><li><span>1</span>Snap sorted recyclables</li><li><span>2</span>See estimated points</li><li><span>3</span>Verify at pickup and redeem</li></ul><button onClick={() => setDemoOpen(false)}>Close demo</button></div>
            <div className="demo-device">
              <div className="demo-status"><span>9:41</span><b>BASUCASH</b><span>● ●</span></div>
              <div className="demo-screen"><ResidentView view={view} points={points} transactions={transactions} imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onView={setView} onChoose={() => fileRef.current?.click()} onMaterial={setMaterial} onAnalyze={analyzePhoto} onSubmit={submitEstimate} onRedeem={redeem} /></div>
              <MobileNav view={view} onView={setView} onScan={() => fileRef.current?.click()} />
            </div>
            <button className="demo-close" aria-label="Close app demo" onClick={() => setDemoOpen(false)}>×</button>
          </section>
        </div>
      )}

      {scanOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setScanOpen(false)}>
          <section className="scan-modal" role="dialog" aria-modal="true" aria-labelledby="scan-review-title">
            <div className="modal-head"><div><span className="eyebrow">Photo estimate</span><h2 id="scan-review-title">Review recyclable scan</h2></div><button onClick={() => setScanOpen(false)}>×</button></div>
            {imageUrl ? <img src={imageUrl} alt="Selected recyclables" className="modal-photo" /> : <div className="modal-placeholder"><span>⌗</span><strong>No photo selected</strong><button onClick={() => fileRef.current?.click()}>Choose photo</button></div>}
            <div className="modal-fields"><label>Material<select value={material} onChange={(event) => { setMaterial(event.target.value as MaterialId); setEstimate(null); setScanState("ready"); }}>{Object.entries(materials).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><div><span>Estimate status</span><strong>{estimate ? `${estimate.weight} kg · ${estimate.points} pts` : "Waiting for photo"}</strong></div></div>
            <p className="verification-note">Photo results are estimates. Final weight and points are confirmed by a collector at pickup.</p>
            <div className="modal-actions">{estimate ? <button className="primary-button" onClick={submitEstimate}>Add to pickup</button> : <button className="primary-button" disabled={!imageUrl || scanState === "analyzing"} onClick={analyzePhoto}>{scanState === "analyzing" ? "Estimating…" : "Estimate points"}</button>}</div>
          </section>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function MarketingSite({ onTry, onScan }: { onTry: () => void; onScan: () => void }) {
  return <section className="marketing-site">
    <header className="site-nav"><a href="#top" aria-label="BasuCash home"><Logo /></a><nav><a href="#how">How it works</a><a href="#features">Features</a><a href="#rewards">Rewards</a><a href="#community">For communities</a></nav><div><button className="nav-ghost" onClick={onTry}>See the app</button><a className="nav-solid" href="#pilot">Join the pilot</a></div></header>

    <section className="site-hero" id="top">
      <div className="hero-copy"><span className="site-pill"><i />Community recycling, rewarded</span><h1>Your trash<br />has <em>value.</em></h1><p>Snap your sorted recyclables, get a clear point estimate, and turn verified pickups into rewards you can actually use.</p><div className="hero-actions"><button className="hero-primary" onClick={onTry}>Try the live demo <span>→</span></button><button className="hero-secondary" onClick={onScan}><span>⌗</span> Test a photo</button></div><small>No payment needed · Demo points only</small></div>
      <HeroPhones />
      <div className="hero-float float-one"><Mark tone="mint">✓</Mark><span><strong>Pickup verified</strong><small>+185 points earned</small></span></div>
      <div className="hero-float float-two"><span>₱</span><strong>1,280 pts</strong><small>₱128 reward value</small></div>
    </section>

    <div className="trust-strip"><span>Designed for everyday recycling</span><div><b>♻</b>Clear material rates</div><div><b>⌗</b>Photo-first estimates</div><div><b>✓</b>Verified at pickup</div><div><b>₱</b>Useful local rewards</div></div>

    <section className="story-section" id="how">
      <div className="section-copy"><span className="site-kicker">Simple by design</span><h2>One photo.<br />A clearer reward.</h2><p>BasuCash makes the value of recyclable waste understandable before collection—then confirms the final points after weighing.</p><button onClick={onTry}>Walk through the app <span>→</span></button></div>
      <div className="story-stage"><div className="scan-demo-card"><div className="scan-demo-top"><span>Photo estimate</span><b>•••</b></div><div className="scan-photo-art"><span className="bottle one" /><span className="bottle two" /><span className="can" /><i>Scanning material…</i></div><div className="scan-result"><Mark tone="mint">P</Mark><span><small>Detected material</small><strong>PET bottles</strong></span><b>92%</b></div><div className="estimate-demo"><span><small>Est. weight</small><strong>4.1 kg</strong></span><span><small>Est. points</small><strong>185 pts</strong></span><span><small>Reward value</small><strong>₱18.50</strong></span></div></div></div>
    </section>

    <section className="feature-section" id="features"><div className="section-heading"><span className="site-kicker">Everything in one loop</span><h2>From kalat to useful value.</h2><p>Built around the few actions residents and collection teams actually need.</p></div><div className="bento-grid">
      <article className="bento scan-bento"><div><span className="number">01</span><h3>Scan before pickup</h3><p>Take a clear photo and choose the material. BasuCash shows an estimated weight, points, and peso reward value.</p></div><div className="focus-frame"><span>⌗</span><i /><b>Ready to scan</b></div></article>
      <article className="bento wallet-bento"><span className="number">02</span><h3>A wallet that makes sense</h3><p>See confirmed points, conversion value, and every earned or redeemed transaction.</p><div className="mini-wallet"><small>Available balance</small><strong>1,280 <em>pts</em></strong><span>≈ ₱128 reward value</span></div></article>
      <article className="bento proof-bento"><span className="number">03</span><h3>No mystery points</h3><p>Rates stay visible. Estimates are clearly labeled and final credit only happens after weighing.</p><div className="rate-list"><span>PET bottles <b>45 pts/kg</b></span><span>Cardboard <b>25 pts/kg</b></span><span>Aluminum <b>70 pts/kg</b></span></div></article>
      <article className="bento pickup-bento"><span className="number">04</span><h3>Neighborhood pickups</h3><p>Combine nearby requests into practical community collection schedules.</p><div className="pickup-preview"><b>26</b><span><strong>Community pickup</strong><small>Palm Grove · Lobby B</small></span><em>Confirmed</em></div></article>
    </div></section>

    <section className="steps-section"><div className="section-heading"><span className="site-kicker">How BasuCash works</span><h2>Four small steps. One cleaner habit.</h2></div><div className="steps-row">{[["01","Snap","Photograph clean, sorted recyclables."],["02","Estimate","See the material rate and likely points."],["03","Verify","A collector weighs and confirms the pickup."],["04","Redeem","Use verified points on available rewards."]].map(([n,title,copy]) => <article key={n}><span>{n}</span><Mark tone={n === "02" ? "sand" : n === "03" ? "sky" : "mint"}>{n === "01" ? "⌗" : n === "02" ? "P" : n === "03" ? "✓" : "₱"}</Mark><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="rewards-showcase" id="rewards"><div className="reward-copy"><span className="site-kicker">Rewards with real use</span><h2>Earn points.<br />Choose what helps.</h2><p>Redeem verified points for mobile load, grocery vouchers, reusable products, and future local partner offers.</p><button onClick={onTry}>Explore rewards <span>→</span></button></div><div className="reward-stack">{rewards.map((reward, index) => <article key={reward.id} className={`reward-ticket ticket-${index + 1}`}><div><Mark tone={index === 1 ? "sand" : index === 2 ? "sky" : "mint"}>{reward.icon}</Mark><span><small>{reward.meta}</small><strong>{reward.title}</strong></span></div><b>{reward.value}</b><footer><span>{reward.price} points</span><em>Redeem →</em></footer></article>)}</div></section>

    <section className="community-section" id="community"><div className="community-copy"><span className="site-kicker">Made for local systems</span><h2>One simple loop for residents, collectors, and communities.</h2><p>BasuCash can help condos, barangays, schools, and recycling partners coordinate collection while keeping rewards understandable.</p></div><div className="audience-grid"><article><span>01</span><h3>Residents</h3><p>Easy photo estimates, pickup status, wallet, and rewards.</p></article><article><span>02</span><h3>Collectors</h3><p>Grouped stops, material details, and verification records.</p></article><article><span>03</span><h3>Communities</h3><p>Participation, diversion, and reward activity in one view.</p></article></div></section>

    <section className="faq-section"><div><span className="site-kicker">Questions, answered</span><h2>Good to know.</h2></div><div className="faq-list"><details open><summary>Are photo points final?<span>+</span></summary><p>No. The photo gives a helpful estimate. Final points are confirmed only after the collector inspects and weighs the accepted materials.</p></details><details><summary>Can points be withdrawn as cash?<span>+</span></summary><p>Not in this prototype. Ten points equal ₱1 of reward value for eligible offers inside the BasuCash marketplace.</p></details><details><summary>What materials can I submit?<span>+</span></summary><p>The pilot supports PET bottles, cardboard, selected metal, and glass. Availability can change by collection partner.</p></details></div></section>

    <section className="final-cta" id="pilot"><span className="site-kicker">Ready for a cleaner loop?</span><h2>Snap it. Verify it.<br />Make it count.</h2><p>Explore the working BasuCash prototype and see how recycling can feel more rewarding.</p><button onClick={onTry}>Open the app demo <span>→</span></button><div className="cta-orbit one" /><div className="cta-orbit two" /></section>
    <footer className="site-footer"><Logo /><p>A community recycling rewards prototype built for the Philippines.</p><nav><a href="#how">How it works</a><a href="#features">Features</a><a href="#rewards">Rewards</a><a href="#top">Back to top ↑</a></nav><small>© 2026 BasuCash. Prototype offers and values are for demonstration.</small></footer>
  </section>;
}

function HeroPhones() {
  return <div className="hero-visual" aria-label="BasuCash app screens preview">
    <div className="phone side-phone left-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-heading"><span>Your balance</span><h3>Wallet</h3></div><div className="tiny-wallet"><small>Available</small><strong>1,280 pts</strong><span>₱128.00 value</span></div><div className="tiny-list"><b>Transactions</b><span><i>+</i>PET pickup <em>+185</em></span><span><i>−</i>Mobile load <em>−200</em></span></div></div>
    <div className="phone main-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-greeting"><span>Magandang umaga, Mia!</span><h3>Turn recyclables<br />into rewards.</h3></div><div className="tiny-wallet hero"><small>Available balance</small><strong>1,280 <em>points</em></strong><span>₱128 redeemable value</span></div><div className="tiny-scan"><Mark tone="mint">⌗</Mark><span><strong>Scan recyclables</strong><small>Estimate your points</small></span><b>→</b></div><div className="tiny-how"><strong>How it works</strong><div><span>1<small>Snap</small></span><span>2<small>Verify</small></span><span>3<small>Redeem</small></span></div></div></div>
    <div className="phone side-phone right-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-heading"><span>Use your points</span><h3>Rewards</h3></div><div className="tiny-reward"><b>₱20</b><span>Mobile load</span><small>200 pts</small></div><div className="tiny-reward grocery"><b>₱50</b><span>Grocery voucher</span><small>500 pts</small></div></div>
  </div>;
}

type ResidentProps = {
  view: MobileView; points: number; transactions: Transaction[]; imageUrl: string; fileName: string; scanState: string; material: MaterialId; estimate: Estimate | null;
  onView: (view: MobileView) => void; onChoose: () => void; onMaterial: (id: MaterialId) => void; onAnalyze: () => void; onSubmit: () => void; onRedeem: (reward: (typeof rewards)[number]) => void;
};

function ResidentView(props: ResidentProps) {
  const { view, points, transactions, imageUrl, fileName, scanState, material, estimate, onView, onChoose, onMaterial, onAnalyze, onSubmit, onRedeem } = props;
  if (view === "scan") return <MobileScan imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onChoose={onChoose} onMaterial={onMaterial} onAnalyze={onAnalyze} onSubmit={onSubmit} />;
  if (view === "wallet") return <MobileWallet points={points} transactions={transactions} />;
  if (view === "rewards") return <MobileRewards points={points} onRedeem={onRedeem} />;
  if (view === "profile") return <MobileProfile />;
  return <><div className="mobile-greeting"><span>Magandang umaga, Mia!</span><h1>Turn your recyclables<br />into rewards.</h1></div><section className="wallet-hero"><span>Available balance</span><strong>{points.toLocaleString()} <small>points</small></strong><p><PesoValue points={points} /> redeemable value</p><button onClick={() => onView("wallet")}>View wallet <span>→</span></button><div className="wallet-orbit one" /><div className="wallet-orbit two" /></section><button className="scan-cta" onClick={onChoose}><span className="camera-mark">⌗</span><span><strong>Scan your recyclables</strong><small>Take a photo to estimate your points</small></span><b>→</b></button><section className="mobile-section"><div className="section-title"><h2>How it works</h2></div><div className="how-grid"><div><Mark tone="mint">1</Mark><strong>Snap</strong><small>Take a clear photo</small></div><div><Mark tone="sky">2</Mark><strong>Verify</strong><small>We weigh at pickup</small></div><div><Mark tone="sand">3</Mark><strong>Redeem</strong><small>Use your points</small></div></div></section><section className="mobile-section"><div className="section-title"><h2>Next pickup</h2><button>See details</button></div><article className="pickup-card"><div className="date-block"><b>26</b><span>JUL</span></div><div><strong>Community pickup</strong><p>Palm Grove · Lobby B</p><small>8:00 – 11:00 AM</small></div><em>Confirmed</em></article></section></>;
}

function MobileNav({ view, onView, onScan }: { view: MobileView; onView: (view: MobileView) => void; onScan: () => void }) {
  return <nav className="bottom-nav"><button className={view === "home" ? "active" : ""} onClick={() => onView("home")}><span>⌂</span>Home</button><button className={view === "wallet" ? "active" : ""} onClick={() => onView("wallet")}><span>▣</span>Wallet</button><button className="scan-tab" onClick={onScan}><span>⌗</span><small>Scan</small></button><button className={view === "rewards" ? "active" : ""} onClick={() => onView("rewards")}><span>◇</span>Rewards</button><button className={view === "profile" ? "active" : ""} onClick={() => onView("profile")}><span>○</span>Profile</button></nav>;
}

function MobileScan({ imageUrl, fileName, scanState, material, estimate, onChoose, onMaterial, onAnalyze, onSubmit }: { imageUrl: string; fileName: string; scanState: string; material: MaterialId; estimate: Estimate | null; onChoose: () => void; onMaterial: (value: MaterialId) => void; onAnalyze: () => void; onSubmit: () => void }) {
  const info = estimate ? materials[estimate.material] : materials[material];
  return <div className="mobile-page scan-page"><div className="mobile-page-head"><span>Photo estimate</span><h1>Scan recyclables</h1><p>Take one clear photo of sorted, clean materials.</p></div><button className={`photo-zone ${imageUrl ? "has-photo" : ""}`} onClick={onChoose}>{imageUrl ? <img src={imageUrl} alt="Your selected recyclables" /> : <><span>⌗</span><strong>Open camera</strong><small>or choose from your gallery</small></>} {imageUrl && <em>Change photo</em>}</button>{fileName && <small className="file-name">{fileName}</small>}<section className="material-picker"><h2>What is in the photo?</h2><div>{(Object.entries(materials) as [MaterialId, typeof materials.pet][]).map(([id,item]) => <button key={id} className={material === id ? "active" : ""} onClick={() => onMaterial(id)}><Mark tone={item.color}>{item.mark}</Mark>{item.label}</button>)}</div></section>{estimate && <section className="estimate-card"><div className="estimate-title"><Mark tone="mint">✓</Mark><span><strong>Estimated value</strong><small>Pending pickup verification</small></span></div><div className="estimate-values"><div><span>Material</span><strong>{info.label}</strong></div><div><span>Est. weight</span><strong>{estimate.weight} kg</strong></div><div><span>Est. points</span><strong>{estimate.points} pts</strong></div><div><span>PHP value</span><strong><PesoValue points={estimate.points} /></strong></div></div><p>Rate: {info.rate} points/kg. Final points may change after weighing.</p></section>}{estimate ? <button className="mobile-primary" onClick={onSubmit}>Add to pickup request</button> : <button className="mobile-primary" disabled={!imageUrl || scanState === "analyzing"} onClick={onAnalyze}>{scanState === "analyzing" ? "Checking photo…" : "Estimate my points"}</button>}</div>;
}

function MobileWallet({ points, transactions }: { points: number; transactions: Transaction[] }) {
  return <div className="mobile-page"><div className="mobile-page-head"><span>Your balance</span><h1>Wallet</h1><p>Verified pickup points, all in one place.</p></div><section className="wallet-detail"><span>Available to redeem</span><strong>{points.toLocaleString()} <small>pts</small></strong><p><PesoValue points={points} /> wallet value</p><div><button>Redeem points</button><button>How it works</button></div></section><div className="conversion-note"><Mark tone="mint">₱</Mark><span><strong>10 points = ₱1 reward value</strong><small>Use points on available partner rewards. Points are not direct cash.</small></span></div><section className="transaction-list"><h2>Transactions</h2>{transactions.map((item) => <article key={item.id}><Mark tone={item.points > 0 ? "mint" : "sand"}>{item.points > 0 ? "+" : "−"}</Mark><span><strong>{item.label}</strong><small>{item.date}</small></span><b className={item.points > 0 ? "positive" : ""}>{item.points > 0 ? "+" : ""}{item.points} pts</b></article>)}</section></div>;
}

function MobileRewards({ points, onRedeem }: { points: number; onRedeem: (reward: (typeof rewards)[number]) => void }) {
  return <div className="mobile-page"><div className="mobile-page-head"><span>{points.toLocaleString()} points available</span><h1>Rewards</h1><p>Use verified points at BasuCash partner stores.</p></div><div className="reward-filter"><button className="active">All</button><button>Load</button><button>Vouchers</button><button>Products</button></div><section className="reward-grid">{rewards.map((reward) => <article key={reward.id}><div className={`reward-art ${reward.id}`}><span>{reward.icon}</span><b>{reward.value}</b></div><h2>{reward.title}</h2><p>{reward.meta}</p><div><strong>{reward.price} pts</strong><button disabled={points < reward.price} onClick={() => onRedeem(reward)}>Redeem</button></div></article>)}</section><p className="reward-disclaimer">Rewards are demo offers for this prototype. Partner availability and terms will appear before confirmation.</p></div>;
}

function MobileProfile() {
  return <div className="mobile-page"><div className="profile-hero"><span>MS</span><h1>Mia Santos</h1><p>Palm Grove Residences · Member since 2026</p><div><b>18.4 kg<small>recycled</small></b><b>7<small>pickups</small></b><b>580<small>pts earned</small></b></div></div><section className="profile-menu">{["Pickup addresses","My vouchers","Notification settings","Help center","Terms & privacy"].map((label, index) => <button key={label}><Mark tone={index % 2 ? "sand" : "mint"}>{["⌖","◇","◌","?","i"][index]}</Mark><span>{label}</span><b>›</b></button>)}</section></div>;
}
