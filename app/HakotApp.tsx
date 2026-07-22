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
  { id: "bag", icon: "H", title: "HAKOT eco-bag", meta: "Reusable canvas bag", price: 800, value: "₱80" },
];

const initialTransactions: Transaction[] = [
  { id: "t1", label: "PET pickup verified", points: 185, date: "Jul 19" },
  { id: "t2", label: "Cardboard pickup verified", points: 95, date: "Jul 12" },
  { id: "t3", label: "Mobile load redeemed", points: -200, date: "Jul 08" },
];

function Mark({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`mark ${tone}`} aria-hidden="true">{children}</span>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <span className="logo"><span className="logo-mark">H</span>{!compact && <strong>HAKOT</strong>}</span>;
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("hakot-wallet-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { points: number; transactions: Transaction[] };
        queueMicrotask(() => { setPoints(parsed.points); setTransactions(parsed.transactions); });
      } catch { /* keep demo defaults */ }
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hakot-wallet-v2", JSON.stringify({ points, transactions }));
  }, [points, transactions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => { if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const monthBars = [42, 58, 44, 72, 63, 88, 70];
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
      const base = Math.max(1.2, Math.min(6.8, ((fileName.length * 17) % 48) / 10 + 1.5));
      const weight = Number(base.toFixed(1));
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
    setTransactions((items) => [{
      id: String(Date.now()),
      label: `${reward.title} redeemed`,
      points: -reward.price,
      date: "Today",
    }, ...items]);
    setToast(`${reward.title} added to your vouchers.`);
  }

  return (
    <main>
      <section className="desktop-shell" aria-label="HAKOT operations dashboard">
        <DesktopSidebar />
        <div className="desktop-main">
          <DesktopTopbar />
          <div className="desktop-page">
            <div className="desktop-heading">
              <div><span className="eyebrow">Overview / Quezon City pilot</span><h1>Good morning, Bea.</h1><p>Here is today&apos;s collection and rewards activity.</p></div>
              <button className="primary-button" onClick={() => { setScanOpen(true); setView("scan"); }}>Review scan <span>→</span></button>
            </div>

            <div className="metric-grid">
              <Metric label="Pending reviews" value="12" delta="+3 today" mark="S" tone="mint" />
              <Metric label="Scheduled pickups" value="28" delta="4 routes" mark="T" tone="sky" />
              <Metric label="Points issued" value="8,420" delta="+18.6%" mark="P" tone="lime" />
              <Metric label="Wallet value" value="₱842" delta="This month" mark="₱" tone="sand" />
            </div>

            <div className="dashboard-grid">
              <section className="card chart-card">
                <CardHead title="Collection performance" meta="Last 7 days" />
                <div className="chart-summary"><strong>486.8 <small>kg</small></strong><span>↗ 18.6% from last week</span></div>
                <div className="bar-chart" aria-label="Daily collection chart">
                  {monthBars.map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{["M","T","W","T","F","S","S"][index]}</small></div>)}
                </div>
              </section>

              <section className="card review-card">
                <CardHead title="Scan reviews" meta="View all" />
                <div className="review-hero">
                  <div className="scan-illustration"><span>⌗</span><i /></div>
                  <div><span className="status-dot pending" />Needs verification<h2>PET bottles</h2><p>Estimated 3.6 kg · 162 pts</p><button onClick={() => setScanOpen(true)}>Review photo</button></div>
                </div>
                <div className="mini-review"><Mark tone="sand">C</Mark><span><strong>Cardboard bundle</strong><small>2.8 kg · 70 pts</small></span><b>Ready</b></div>
              </section>

              <section className="card mix-card">
                <CardHead title="Material mix" meta="This month" />
                <div className="donut"><div><strong>1.2t</strong><small>collected</small></div></div>
                <ul><li><i className="pet" />PET <b>42%</b></li><li><i className="cardboard" />Cardboard <b>31%</b></li><li><i className="metal" />Metal <b>18%</b></li><li><i className="other" />Other <b>9%</b></li></ul>
              </section>

              <section className="card activity-card">
                <CardHead title="Recent activity" meta="Today" />
                <div className="activity-table">
                  <div className="table-head"><span>Member</span><span>Material</span><span>Verified</span><span>Points</span><span>Status</span></div>
                  {[
                    ["Mia Santos","PET bottles","4.1 kg","+185","Credited"],
                    ["Carlo Reyes","Cardboard","3.8 kg","+95","Credited"],
                    ["Joy Lim","Aluminum","1.6 kg","+112","For review"],
                    ["Anna Cruz","Glass","5.2 kg","+156","Scheduled"],
                  ].map((row) => <div className="table-row" key={row[0]}><span><i>{row[0].split(" ").map(n => n[0]).join("")}</i><b>{row[0]}</b></span><span>{row[1]}</span><span>{row[2]}</span><strong>{row[3]}</strong><em className={row[4].toLowerCase().replace(" ","-")}>{row[4]}</em></div>)}
                </div>
              </section>

              <section className="card rewards-card">
                <CardHead title="Popular rewards" meta="Manage" />
                {rewards.slice(0, 2).map((reward) => <div className="reward-row" key={reward.id}><Mark tone="mint">{reward.icon}</Mark><span><strong>{reward.title}</strong><small>{reward.meta}</small></span><b>{reward.price} pts</b></div>)}
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="mobile-app" aria-label="HAKOT resident mobile app">
        <header className="mobile-header">
          <Logo />
          <button className="avatar-button" onClick={() => setView("profile")}>MS</button>
        </header>

        <div className="mobile-scroll">
          {view === "home" && (
            <>
              <div className="mobile-greeting"><span>Magandang umaga, Mia!</span><h1>Turn your recyclables<br />into rewards.</h1></div>
              <section className="wallet-hero">
                <span>Available balance</span><strong>{points.toLocaleString()} <small>points</small></strong><p><PesoValue points={points} /> redeemable value</p>
                <button onClick={() => setView("wallet")}>View wallet <span>→</span></button>
                <div className="wallet-orbit one" /><div className="wallet-orbit two" />
              </section>
              <button className="scan-cta" onClick={() => fileRef.current?.click()}>
                <span className="camera-mark">⌗</span><span><strong>Scan your recyclables</strong><small>Take a photo to estimate your points</small></span><b>→</b>
              </button>
              <section className="mobile-section">
                <div className="section-title"><h2>How it works</h2></div>
                <div className="how-grid"><div><Mark tone="mint">1</Mark><strong>Snap</strong><small>Take a clear photo</small></div><div><Mark tone="sky">2</Mark><strong>Verify</strong><small>We weigh at pickup</small></div><div><Mark tone="sand">3</Mark><strong>Redeem</strong><small>Use your points</small></div></div>
              </section>
              <section className="mobile-section">
                <div className="section-title"><h2>Next pickup</h2><button>See details</button></div>
                <article className="pickup-card"><div className="date-block"><b>26</b><span>JUL</span></div><div><strong>Community pickup</strong><p>Palm Grove · Lobby B</p><small>8:00 – 11:00 AM</small></div><em>Confirmed</em></article>
              </section>
            </>
          )}

          {view === "scan" && <MobileScan imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onChoose={() => fileRef.current?.click()} onMaterial={setMaterial} onAnalyze={analyzePhoto} onSubmit={submitEstimate} />}
          {view === "wallet" && <MobileWallet points={points} transactions={transactions} />}
          {view === "rewards" && <MobileRewards points={points} onRedeem={redeem} />}
          {view === "profile" && <MobileProfile />}
        </div>

        <nav className="bottom-nav">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><span>⌂</span>Home</button>
          <button className={view === "wallet" ? "active" : ""} onClick={() => setView("wallet")}><span>▣</span>Wallet</button>
          <button className="scan-tab" onClick={() => fileRef.current?.click()}><span>⌗</span><small>Scan</small></button>
          <button className={view === "rewards" ? "active" : ""} onClick={() => setView("rewards")}><span>◇</span>Rewards</button>
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}><span>○</span>Profile</button>
        </nav>
      </section>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={choosePhoto} />

      {scanOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setScanOpen(false)}>
          <section className="scan-modal" role="dialog" aria-modal="true" aria-labelledby="scan-review-title">
            <div className="modal-head"><div><span className="eyebrow">Photo estimate</span><h2 id="scan-review-title">Review recyclable scan</h2></div><button onClick={() => setScanOpen(false)}>×</button></div>
            {imageUrl ? <img src={imageUrl} alt="Selected recyclables" className="modal-photo" /> : <div className="modal-placeholder"><span>⌗</span><strong>No photo selected</strong><button onClick={() => fileRef.current?.click()}>Choose photo</button></div>}
            <div className="modal-fields">
              <label>Material<select value={material} onChange={(event) => { setMaterial(event.target.value as MaterialId); setEstimate(null); setScanState("ready"); }}>{Object.entries(materials).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
              <div><span>Estimate status</span><strong>{estimate ? `${estimate.weight} kg · ${estimate.points} pts` : "Waiting for photo"}</strong></div>
            </div>
            <p className="verification-note">Photo results are estimates. Final weight and points are confirmed by a collector at pickup.</p>
            <div className="modal-actions">{estimate ? <button className="primary-button" onClick={submitEstimate}>Add to pickup</button> : <button className="primary-button" disabled={!imageUrl || scanState === "analyzing"} onClick={analyzePhoto}>{scanState === "analyzing" ? "Estimating…" : "Estimate points"}</button>}</div>
          </section>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function DesktopSidebar() {
  const nav = [["▦","Overview"],["⌗","Scan reviews"],["T","Pickups"],["○","Members"],["▣","Wallet & rewards"],["◇","Partners"],["↗","Analytics"]];
  return <aside className="desktop-sidebar"><Logo /><nav>{nav.map(([icon,label], index) => <button key={label} className={index === 0 ? "active" : ""}><span>{icon}</span>{label}{label === "Scan reviews" && <b>12</b>}</button>)}</nav><div className="sidebar-card"><Mark tone="mint">♻</Mark><strong>1,248 kg</strong><p>kept out of landfill this month</p><span><i style={{ width: "72%" }} /></span></div><div className="user-card"><span>BL</span><div><strong>Bea Lim</strong><small>Operations admin</small></div><b>•••</b></div></aside>;
}

function DesktopTopbar() {
  return <header className="desktop-topbar"><div className="search"><span>⌕</span><input aria-label="Search dashboard" placeholder="Search members, scans, pickups…" /></div><div className="top-actions"><button>?</button><button>◌<i /></button><div className="top-profile"><span>BL</span><div><strong>Bea Lim</strong><small>Administrator</small></div><b>⌄</b></div></div></header>;
}

function Metric({ label, value, delta, mark, tone }: { label: string; value: string; delta: string; mark: string; tone: string }) {
  return <div className="metric-card"><Mark tone={tone}>{mark}</Mark><div><span>{label}</span><strong>{value}</strong><small>{delta}</small></div><b>↗</b></div>;
}

function CardHead({ title, meta }: { title: string; meta: string }) {
  return <div className="card-head"><h2>{title}</h2><button>{meta} <span>⌄</span></button></div>;
}

function MobileScan({ imageUrl, fileName, scanState, material, estimate, onChoose, onMaterial, onAnalyze, onSubmit }: { imageUrl: string; fileName: string; scanState: string; material: MaterialId; estimate: Estimate | null; onChoose: () => void; onMaterial: (value: MaterialId) => void; onAnalyze: () => void; onSubmit: () => void }) {
  const info = estimate ? materials[estimate.material] : materials[material];
  return <div className="mobile-page scan-page"><div className="mobile-page-head"><span>Photo estimate</span><h1>Scan recyclables</h1><p>Take one clear photo of sorted, clean materials.</p></div>
    <button className={`photo-zone ${imageUrl ? "has-photo" : ""}`} onClick={onChoose}>{imageUrl ? <img src={imageUrl} alt="Your selected recyclables" /> : <><span>⌗</span><strong>Open camera</strong><small>or choose from your gallery</small></>} {imageUrl && <em>Change photo</em>}</button>
    {fileName && <small className="file-name">{fileName}</small>}
    <section className="material-picker"><h2>What is in the photo?</h2><div>{(Object.entries(materials) as [MaterialId, typeof materials.pet][]).map(([id,item]) => <button key={id} className={material === id ? "active" : ""} onClick={() => onMaterial(id)}><Mark tone={item.color}>{item.mark}</Mark>{item.label}</button>)}</div></section>
    {estimate && <section className="estimate-card"><div className="estimate-title"><Mark tone="mint">✓</Mark><span><strong>Estimated value</strong><small>Pending pickup verification</small></span></div><div className="estimate-values"><div><span>Material</span><strong>{info.label}</strong></div><div><span>Est. weight</span><strong>{estimate.weight} kg</strong></div><div><span>Est. points</span><strong>{estimate.points} pts</strong></div><div><span>PHP value</span><strong><PesoValue points={estimate.points} /></strong></div></div><p>Rate: {info.rate} points/kg. Final points may change after weighing.</p></section>}
    {estimate ? <button className="mobile-primary" onClick={onSubmit}>Add to pickup request</button> : <button className="mobile-primary" disabled={!imageUrl || scanState === "analyzing"} onClick={onAnalyze}>{scanState === "analyzing" ? "Checking photo…" : "Estimate my points"}</button>}
  </div>;
}

function MobileWallet({ points, transactions }: { points: number; transactions: Transaction[] }) {
  return <div className="mobile-page"><div className="mobile-page-head"><span>Your balance</span><h1>Wallet</h1><p>Verified pickup points, all in one place.</p></div><section className="wallet-detail"><span>Available to redeem</span><strong>{points.toLocaleString()} <small>pts</small></strong><p><PesoValue points={points} /> wallet value</p><div><button>Redeem points</button><button>How it works</button></div></section><div className="conversion-note"><Mark tone="mint">₱</Mark><span><strong>10 points = ₱1 reward value</strong><small>Use points on available partner rewards. Points are not direct cash.</small></span></div><section className="transaction-list"><h2>Transactions</h2>{transactions.map((item) => <article key={item.id}><Mark tone={item.points > 0 ? "mint" : "sand"}>{item.points > 0 ? "+" : "−"}</Mark><span><strong>{item.label}</strong><small>{item.date}</small></span><b className={item.points > 0 ? "positive" : ""}>{item.points > 0 ? "+" : ""}{item.points} pts</b></article>)}</section></div>;
}

function MobileRewards({ points, onRedeem }: { points: number; onRedeem: (reward: (typeof rewards)[number]) => void }) {
  return <div className="mobile-page"><div className="mobile-page-head"><span>{points.toLocaleString()} points available</span><h1>Rewards</h1><p>Use verified points at HAKOT partner stores.</p></div><div className="reward-filter"><button className="active">All</button><button>Load</button><button>Vouchers</button><button>Products</button></div><section className="reward-grid">{rewards.map((reward) => <article key={reward.id}><div className={`reward-art ${reward.id}`}><span>{reward.icon}</span><b>{reward.value}</b></div><h2>{reward.title}</h2><p>{reward.meta}</p><div><strong>{reward.price} pts</strong><button disabled={points < reward.price} onClick={() => onRedeem(reward)}>Redeem</button></div></article>)}</section><p className="reward-disclaimer">Rewards are demo offers for this prototype. Partner availability and terms will appear before confirmation.</p></div>;
}

function MobileProfile() {
  return <div className="mobile-page"><div className="profile-hero"><span>MS</span><h1>Mia Santos</h1><p>Palm Grove Residences · Member since 2026</p><div><b>18.4 kg<small>recycled</small></b><b>7<small>pickups</small></b><b>580<small>pts earned</small></b></div></div><section className="profile-menu">{["Pickup addresses","My vouchers","Notification settings","Help center","Terms & privacy"].map((label, index) => <button key={label}><Mark tone={index % 2 ? "sand" : "mint"}>{["⌖","◇","◌","?","i"][index]}</Mark><span>{label}</span><b>›</b></button>)}</section></div>;
}
