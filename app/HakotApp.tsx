"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import NearbyJunkshops from "./NearbyJunkshops";

type MobileView = "home" | "locations" | "scan" | "wallet" | "impact" | "profile";
type MaterialId = "pet" | "cardboard" | "metal" | "glass";
type Estimate = { material: MaterialId; weight: number; ecoPoints: number; cashLow: number; cashHigh: number };
type Transaction = { id: string; label: string; ecoPoints: number; cash: number; kg: number; date: string };

const materials: Record<MaterialId, { label: string; ecoRate: number; cashRange: [number, number]; mark: string; color: string }> = {
  pet: { label: "PET bottles", ecoRate: 20, cashRange: [8, 15], mark: "P", color: "aqua" },
  cardboard: { label: "Cardboard", ecoRate: 10, cashRange: [4, 8], mark: "C", color: "sand" },
  metal: { label: "Aluminum cans", ecoRate: 30, cashRange: [35, 70], mark: "M", color: "blue" },
  glass: { label: "Glass bottles", ecoRate: 15, cashRange: [1, 4], mark: "G", color: "lilac" },
};

const initialTransactions: Transaction[] = [
  { id: "t1", label: "PET bottles sold", ecoPoints: 40, cash: 40, kg: 2, date: "Jul 19" },
  { id: "t2", label: "Aluminum cans sold", ecoPoints: 36, cash: 36, kg: 1.2, date: "Jul 12" },
  { id: "t3", label: "Cardboard sold", ecoPoints: 15, cash: 30, kg: 1.5, date: "Jul 08" },
];

function Mark({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`mark ${tone}`} aria-hidden="true">{children}</span>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <span className={`logo ${light ? "light" : ""}`}><span className="logo-mark">B</span><strong>BasuCash</strong></span>;
}

function PesoValue({ amount }: { amount: number }) {
  return <>{new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)}</>;
}

export function HakotApp() {
  const [view, setView] = useState<MobileView>("home");
  const [ecoPoints, setEcoPoints] = useState(280);
  const [cashEarned, setCashEarned] = useState(245);
  const [recycledKg, setRecycledKg] = useState(18.4);
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
    const saved = window.localStorage.getItem("basucash-progress-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { ecoPoints: number; cashEarned: number; recycledKg: number; transactions: Transaction[] };
        queueMicrotask(() => { setEcoPoints(parsed.ecoPoints); setCashEarned(parsed.cashEarned); setRecycledKg(parsed.recycledKg); setTransactions(parsed.transactions); });
      } catch { /* keep safe demo defaults */ }
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("basucash-progress-v1", JSON.stringify({ ecoPoints, cashEarned, recycledKg, transactions }));
  }, [ecoPoints, cashEarned, recycledKg, transactions]);

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
      const info = materials[material];
      setEstimate({ material, weight, ecoPoints: Math.round(weight * info.ecoRate), cashLow: Math.round(weight * info.cashRange[0]), cashHigh: Math.round(weight * info.cashRange[1]) });
      setScanState("done");
    }, 900);
  }

  function submitEstimate() {
    if (!estimate) return;
    setToast("Estimate saved. Choose a nearby junkshop to sell your recyclables.");
    setScanOpen(false);
    setView("locations");
  }

  return (
    <main>
      <MarketingSite onTry={() => { window.location.href = "/app"; }} onScan={() => fileRef.current?.click()} />

      <section className="mobile-app" aria-label="BasuCash resident mobile app">
        <header className="mobile-header"><Logo /><button className="avatar-button" onClick={() => setView("profile")}>MS</button></header>
        <div className="mobile-scroll">
          <ResidentView view={view} ecoPoints={ecoPoints} cashEarned={cashEarned} recycledKg={recycledKg} transactions={transactions} imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onView={setView} onChoose={() => fileRef.current?.click()} onMaterial={setMaterial} onAnalyze={analyzePhoto} onSubmit={submitEstimate} />
        </div>
        <MobileNav view={view} onView={setView} onScan={() => fileRef.current?.click()} />
      </section>

      <input ref={fileRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={choosePhoto} />

      {demoOpen && (
        <div className="demo-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDemoOpen(false)}>
          <section className="desktop-demo" role="dialog" aria-modal="true" aria-label="BasuCash live app demo">
            <div className="demo-copy"><Logo light /><span className="site-kicker">Interactive preview</span><h2>Try the resident app.</h2><p>Estimate junkshop value, find a nearby location, and keep a personal recycling record.</p><ul><li><span>1</span>Snap sorted recyclables</li><li><span>2</span>Check the possible cash range</li><li><span>3</span>Sell directly and log the receipt</li></ul><button onClick={() => setDemoOpen(false)}>Close demo</button></div>
            <div className="demo-device">
              <div className="demo-status"><span>9:41</span><b>BASUCASH</b><span>● ●</span></div>
              <div className="demo-screen"><ResidentView view={view} ecoPoints={ecoPoints} cashEarned={cashEarned} recycledKg={recycledKg} transactions={transactions} imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onView={setView} onChoose={() => fileRef.current?.click()} onMaterial={setMaterial} onAnalyze={analyzePhoto} onSubmit={submitEstimate} /></div>
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
            <div className="modal-fields"><label>Material<select value={material} onChange={(event) => { setMaterial(event.target.value as MaterialId); setEstimate(null); setScanState("ready"); }}>{Object.entries(materials).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><div><span>Estimate status</span><strong>{estimate ? `${estimate.weight} kg · ₱${estimate.cashLow}–₱${estimate.cashHigh}` : "Waiting for photo"}</strong></div></div>
            <p className="verification-note">Photo results are estimates. The junkshop decides the final price after actual weighing.</p>
            <div className="modal-actions">{estimate ? <button className="primary-button" onClick={submitEstimate}>Find a junkshop</button> : <button className="primary-button" disabled={!imageUrl || scanState === "analyzing"} onClick={analyzePhoto}>{scanState === "analyzing" ? "Estimating…" : "Estimate value"}</button>}</div>
          </section>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function MarketingSite({ onTry, onScan }: { onTry: () => void; onScan: () => void }) {
  return <section className="marketing-site">
    <header className="site-nav"><a href="#top" aria-label="BasuCash home"><Logo /></a><nav><a href="#how">How it works</a><a href="#features">Features</a><a href="#impact">Impact</a><a href="#community">For communities</a></nav><div><button className="nav-ghost" onClick={onTry}>See the app</button><a className="nav-solid" href="#pilot">Join the pilot</a></div></header>

    <section className="site-hero" id="top">
      <div className="hero-copy"><span className="site-pill"><i />Your guide from basura to cash</span><h1>Your trash<br />has <em>value.</em></h1><p>Check what your recyclables may be worth, find a nearby junkshop, and track the cash they pay you—without BasuCash promising money it does not hold.</p><div className="hero-actions"><button className="hero-primary" onClick={onTry}>Try the live demo <span>→</span></button><button className="hero-secondary" onClick={onScan}><span>⌗</span> Check a photo</button></div><small>Free prototype · Junkshops pay residents directly</small></div>
      <HeroPhones />
      <div className="hero-float float-one"><Mark tone="mint">✓</Mark><span><strong>Sale recorded</strong><small>2.0 kg · +40 EcoPoints</small></span></div>
      <div className="hero-float float-two"><span>₱</span><strong>₱245</strong><small>earned at junkshops</small></div>
    </section>

    <div className="trust-strip"><span>Designed for everyday recycling</span><div><b>♻</b>Clean sorting guidance</div><div><b>⌗</b>Photo-first estimates</div><div><b>⌖</b>Nearby junkshops</div><div><b>₱</b>Cash records</div></div>

    <section className="story-section" id="how">
      <div className="section-copy"><span className="site-kicker">Simple by design</span><h2>One photo.<br />A clearer value.</h2><p>BasuCash gives a practical price range before the trip. The junkshop still decides and pays the final amount after weighing.</p><button onClick={onTry}>Walk through the app <span>→</span></button></div>
      <div className="story-stage"><div className="scan-demo-card"><div className="scan-demo-top"><span>Photo estimate</span><b>•••</b></div><div className="scan-photo-art"><span className="bottle one" /><span className="bottle two" /><span className="can" /><i>Checking material…</i></div><div className="scan-result"><Mark tone="mint">P</Mark><span><small>Detected material</small><strong>PET bottles</strong></span><b>92%</b></div><div className="estimate-demo"><span><small>Est. weight</small><strong>4.1 kg</strong></span><span><small>Possible cash</small><strong>₱33–₱62</strong></span><span><small>EcoPoints</small><strong>+82</strong></span></div></div></div>
    </section>

    <section className="feature-section" id="features"><div className="section-heading"><span className="site-kicker">Everything in one loop</span><h2>From kalat to useful value.</h2><p>Built around the few actions residents and collection teams actually need.</p></div><div className="bento-grid">
      <article className="bento scan-bento"><div><span className="number">01</span><h3>Check before you go</h3><p>Take a clear photo, choose the material, and see a sample junkshop price range before leaving home.</p></div><div className="focus-frame"><span>⌗</span><i /><b>Ready to check</b></div></article>
      <article className="bento wallet-bento"><span className="number">02</span><h3>Your earnings record</h3><p>Log what the junkshop actually paid and keep your receipts, kilograms, and EcoPoints together.</p><div className="mini-wallet"><small>Cash earned</small><strong>₱245</strong><span>paid directly by junkshops</span></div></article>
      <article className="bento proof-bento"><span className="number">03</span><h3>EcoPoints, not e-money</h3><p>EcoPoints measure participation and unlock progress levels. They do not convert to pesos.</p><div className="rate-list"><span>PET bottles <b>20 EcoPoints/kg</b></span><span>Cardboard <b>10 EcoPoints/kg</b></span><span>Aluminum <b>30 EcoPoints/kg</b></span></div></article>
      <article className="bento pickup-bento"><span className="number">04</span><h3>Find where to sell</h3><p>Use the map to compare nearby sample recycling locations, accepted materials, and directions.</p><div className="pickup-preview"><b>3</b><span><strong>Nearby locations</strong><small>Sorted from your position</small></span><em>Map</em></div></article>
    </div></section>

    <section className="steps-section"><div className="section-heading"><span className="site-kicker">How BasuCash works</span><h2>Four small steps. One cleaner habit.</h2></div><div className="steps-row">{[["01","Snap","Photograph clean, sorted recyclables."],["02","Estimate","See a possible local cash range."],["03","Sell","The junkshop weighs and pays you directly."],["04","Record","Log the receipt and build your EcoPoints."]].map(([n,title,copy]) => <article key={n}><span>{n}</span><Mark tone={n === "02" ? "sand" : n === "03" ? "sky" : "mint"}>{n === "01" ? "⌗" : n === "02" ? "₱" : n === "03" ? "✓" : "P"}</Mark><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="rewards-showcase" id="impact"><div className="reward-copy"><span className="site-kicker">Progress without financial promises</span><h2>Track cash.<br />Build impact.</h2><p>Junkshops pay residents directly. BasuCash records the amount and awards non-cash EcoPoints for consistent recycling.</p><button onClick={onTry}>Explore your impact <span>→</span></button></div><div className="reward-stack"><article className="reward-ticket ticket-1"><div><Mark tone="mint">₱</Mark><span><small>Paid by junkshops</small><strong>Cash earned</strong></span></div><b>₱245</b><footer><span>7 sales logged</span><em>View record</em></footer></article><article className="reward-ticket ticket-2"><div><Mark tone="sand">P</Mark><span><small>No peso conversion</small><strong>EcoPoints</strong></span></div><b>280</b><footer><span>Eco Starter level</span><em>Keep going</em></footer></article><article className="reward-ticket ticket-3"><div><Mark tone="sky">♻</Mark><span><small>Materials diverted</small><strong>Recycling impact</strong></span></div><b>18.4 kg</b><footer><span>3-week streak</span><em>Impact</em></footer></article></div></section>

    <section className="community-section" id="community"><div className="community-copy"><span className="site-kicker">Start without funding</span><h2>A useful first version that does not owe users money.</h2><p>BasuCash can begin as a recycling guide and personal record. Real sponsored rewards appear only after a partner actually funds them.</p></div><div className="audience-grid"><article><span>01</span><h3>Residents</h3><p>Photo estimates, nearby locations, sales records, and EcoPoints.</p></article><article><span>02</span><h3>Junkshops</h3><p>Residents contact and sell directly using each shop&apos;s actual price.</p></article><article><span>03</span><h3>Future partners</h3><p>Fund optional challenges only when budgets and agreements exist.</p></article></div></section>

    <section className="faq-section"><div><span className="site-kicker">Questions, answered</span><h2>Good to know.</h2></div><div className="faq-list"><details open><summary>Who pays me for the recyclables?<span>+</span></summary><p>The junkshop pays you directly after weighing. BasuCash only helps estimate and record the transaction.</p></details><details><summary>Can EcoPoints be withdrawn as cash?<span>+</span></summary><p>No. EcoPoints are progress points with no peso conversion. This keeps the prototype sustainable without sponsors.</p></details><details><summary>Are the map locations verified partners?<span>+</span></summary><p>Not yet. Current locations are clearly labeled samples. Contact a real shop before visiting and confirm its accepted materials and price.</p></details></div></section>

    <section className="final-cta" id="pilot"><span className="site-kicker">Ready for a realistic first step?</span><h2>Check it. Sell it.<br />Record it.</h2><p>Explore a BasuCash prototype built to work even before sponsors and formal junkshop partnerships.</p><button onClick={onTry}>Open the app demo <span>→</span></button><div className="cta-orbit one" /><div className="cta-orbit two" /></section>
    <footer className="site-footer"><Logo /><p>A practical recycling value guide built for the Philippines.</p><nav><a href="#how">How it works</a><a href="#features">Features</a><a href="#impact">Impact</a><a href="#top">Back to top ↑</a></nav><small>© 2026 BasuCash. Estimates and sample locations are for demonstration.</small></footer>
  </section>;
}

function HeroPhones() {
  return <div className="hero-visual" aria-label="BasuCash app screens preview">
    <div className="phone side-phone left-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-heading"><span>Your records</span><h3>Earnings</h3></div><div className="tiny-wallet"><small>Paid by junkshops</small><strong>₱245</strong><span>18.4 kg recycled</span></div><div className="tiny-list"><b>Sales</b><span><i>₱</i>PET bottles <em>₱40</em></span><span><i>₱</i>Aluminum cans <em>₱36</em></span></div></div>
    <div className="phone main-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-greeting"><span>Magandang umaga, Mia!</span><h3>Turn recyclables<br />into real cash.</h3></div><div className="tiny-wallet hero"><small>Cash earned at junkshops</small><strong>₱245</strong><span>paid directly · recorded here</span></div><div className="tiny-scan"><Mark tone="mint">⌗</Mark><span><strong>Check recyclable value</strong><small>See a possible cash range</small></span><b>→</b></div><div className="tiny-how"><strong>How it works</strong><div><span>1<small>Check</small></span><span>2<small>Sell</small></span><span>3<small>Record</small></span></div></div></div>
    <div className="phone side-phone right-phone"><div className="phone-top">9:41 <b>BASUCASH</b> ●</div><div className="tiny-heading"><span>Your progress</span><h3>Impact</h3></div><div className="tiny-reward"><b>280</b><span>EcoPoints</span><small>No cash conversion</small></div><div className="tiny-reward grocery"><b>3</b><span>Week streak</span><small>Keep recycling</small></div></div>
  </div>;
}

type ResidentProps = {
  view: MobileView; ecoPoints: number; cashEarned: number; recycledKg: number; transactions: Transaction[]; imageUrl: string; fileName: string; scanState: string; material: MaterialId; estimate: Estimate | null;
  onView: (view: MobileView) => void; onChoose: () => void; onMaterial: (id: MaterialId) => void; onAnalyze: () => void; onSubmit: () => void;
};

function ResidentView(props: ResidentProps) {
  const { view, ecoPoints, cashEarned, recycledKg, transactions, imageUrl, fileName, scanState, material, estimate, onView, onChoose, onMaterial, onAnalyze, onSubmit } = props;
  if (view === "scan") return <MobileScan imageUrl={imageUrl} fileName={fileName} scanState={scanState} material={material} estimate={estimate} onChoose={onChoose} onMaterial={onMaterial} onAnalyze={onAnalyze} onSubmit={onSubmit} />;
  if (view === "wallet") return <MobileEarnings cashEarned={cashEarned} ecoPoints={ecoPoints} recycledKg={recycledKg} transactions={transactions} />;
  if (view === "locations") return <NearbyJunkshops />;
  if (view === "impact") return <MobileImpact ecoPoints={ecoPoints} recycledKg={recycledKg} />;
  if (view === "profile") return <MobileProfile />;
  return <div className="cash-home">
    <section className="cash-wallet" aria-label="Recycling earnings">
      <span>Cash earned at junkshops</span>
      <strong><PesoValue amount={cashEarned} /></strong>
      <small>Paid directly by junkshops · not stored in BasuCash</small>
      <div className="cash-leaf leaf-one" /><div className="cash-leaf leaf-two" /><div className="cash-stem" />
    </section>
    <section className="home-stats"><div><strong>{ecoPoints}</strong><span>EcoPoints</span></div><div><strong>{recycledKg.toFixed(1)} kg</strong><span>Recycled</span></div></section>
    <section className="cash-actions" aria-label="Quick actions">
      <button onClick={onChoose}><Mark tone="mint">⌗</Mark><strong>Scan</strong><small>Estimate value</small></button>
      <button onClick={() => onView("locations")}><Mark tone="mint">⌖</Mark><strong>Find</strong><small>Nearby shops</small></button>
      <button onClick={() => onView("wallet")}><Mark tone="mint">✓</Mark><strong>Record</strong><small>Log a sale</small></button>
    </section>
    <section className="cash-transactions transaction-list">
      <div className="cash-section-head"><div><span>Recent recycling</span><h2>Sales record</h2></div><button onClick={() => onView("wallet")}>View all</button></div>
      {transactions.map((item, index) => <article key={item.id}><Mark tone="mint">{["P","M","C"][index] ?? "R"}</Mark><span><strong>{item.label}</strong><small>{item.date} · {item.kg} kg · +{item.ecoPoints} EcoPoints</small></span><b className="positive"><PesoValue amount={item.cash} /></b></article>)}
    </section>
    <button className="cash-scan-button" onClick={onChoose}><span>⌗</span> Check recyclable value</button>
  </div>;
}

function MobileNav({ view, onView, onScan }: { view: MobileView; onView: (view: MobileView) => void; onScan: () => void }) {
  return <nav className="bottom-nav"><button className={view === "home" ? "active" : ""} onClick={() => onView("home")}><span>⌂</span>Home</button><button className={view === "locations" ? "active" : ""} onClick={() => onView("locations")}><span>⌖</span>Nearby</button><button className="scan-tab" onClick={onScan}><span>⌗</span><small>Scan</small></button><button className={view === "impact" ? "active" : ""} onClick={() => onView("impact")}><span>◇</span>Impact</button><button className={view === "profile" ? "active" : ""} onClick={() => onView("profile")}><span>○</span>Profile</button></nav>;
}

function MobileScan({ imageUrl, fileName, scanState, material, estimate, onChoose, onMaterial, onAnalyze, onSubmit }: { imageUrl: string; fileName: string; scanState: string; material: MaterialId; estimate: Estimate | null; onChoose: () => void; onMaterial: (value: MaterialId) => void; onAnalyze: () => void; onSubmit: () => void }) {
  const info = estimate ? materials[estimate.material] : materials[material];
  return <div className="mobile-page scan-page"><div className="mobile-page-head"><span>Photo estimate</span><h1>Check its value</h1><p>Take one clear photo of clean, sorted recyclables before visiting a junkshop.</p></div><button className={`photo-zone ${imageUrl ? "has-photo" : ""}`} onClick={onChoose}>{imageUrl ? <img src={imageUrl} alt="Your selected recyclables" /> : <><span>⌗</span><strong>Open camera</strong><small>or choose from your gallery</small></>} {imageUrl && <em>Change photo</em>}</button>{fileName && <small className="file-name">{fileName}</small>}<section className="material-picker"><h2>What is in the photo?</h2><div>{(Object.entries(materials) as [MaterialId, typeof materials.pet][]).map(([id,item]) => <button key={id} className={material === id ? "active" : ""} onClick={() => onMaterial(id)}><Mark tone={item.color}>{item.mark}</Mark>{item.label}</button>)}</div></section>{estimate && <section className="estimate-card"><div className="estimate-title"><Mark tone="mint">₱</Mark><span><strong>Possible junkshop value</strong><small>Estimate only · shop price decides final cash</small></span></div><div className="estimate-values"><div><span>Material</span><strong>{info.label}</strong></div><div><span>Est. weight</span><strong>{estimate.weight} kg</strong></div><div><span>Possible cash</span><strong>₱{estimate.cashLow}–₱{estimate.cashHigh}</strong></div><div><span>EcoPoints</span><strong>+{estimate.ecoPoints}</strong></div></div><p>Typical sample range: ₱{info.cashRange[0]}–₱{info.cashRange[1]}/kg. Ask the junkshop for today&apos;s actual price.</p></section>}{estimate ? <button className="mobile-primary" onClick={onSubmit}>Find a nearby junkshop</button> : <button className="mobile-primary" disabled={!imageUrl || scanState === "analyzing"} onClick={onAnalyze}>{scanState === "analyzing" ? "Checking photo…" : "Estimate junkshop value"}</button>}</div>;
}

function MobileEarnings({ cashEarned, ecoPoints, recycledKg, transactions }: { cashEarned: number; ecoPoints: number; recycledKg: number; transactions: Transaction[] }) {
  return <div className="mobile-page"><div className="mobile-page-head"><span>Your recycling record</span><h1>Earnings</h1><p>Cash shown here was paid directly by junkshops and recorded in BasuCash.</p></div><section className="wallet-detail earnings-card"><span>Total cash earned</span><strong><PesoValue amount={cashEarned} /></strong><p>{recycledKg.toFixed(1)} kg recycled · {ecoPoints} EcoPoints</p><div><button>Record a sale</button><button>Upload proof</button></div></section><div className="conversion-note"><Mark tone="mint">i</Mark><span><strong>EcoPoints are not money</strong><small>They track your recycling progress. Cash comes directly from the junkshop after weighing.</small></span></div><section className="transaction-list"><h2>Sales history</h2>{transactions.map((item) => <article key={item.id}><Mark tone="mint">✓</Mark><span><strong>{item.label}</strong><small>{item.date} · {item.kg} kg · +{item.ecoPoints} EcoPoints</small></span><b className="positive"><PesoValue amount={item.cash} /></b></article>)}</section></div>;
}

function MobileImpact({ ecoPoints, recycledKg }: { ecoPoints: number; recycledKg: number }) {
  const nextLevel = 500;
  return <div className="mobile-page impact-page"><div className="mobile-page-head"><span>Your progress</span><h1>Eco impact</h1><p>EcoPoints celebrate consistent recycling. They have no cash conversion.</p></div><section className="impact-hero"><span>EcoPoints</span><strong>{ecoPoints}</strong><p>{nextLevel - ecoPoints} more to reach Eco Regular</p><div><i style={{ width: `${Math.min(100, ecoPoints / nextLevel * 100)}%` }} /></div></section><section className="impact-metrics"><article><strong>{recycledKg.toFixed(1)} kg</strong><span>Kept in circulation</span></article><article><strong>3 weeks</strong><span>Recycling streak</span></article></section><section className="challenge-list"><div className="section-title"><h2>Active challenges</h2></div><article><Mark tone="mint">P</Mark><span><strong>Plastic starter</strong><small>Recycle 5 kg of PET bottles</small></span><b>2 / 5 kg</b></article><article><Mark tone="sky">3</Mark><span><strong>Three-week streak</strong><small>Record one sale each week</small></span><b>Complete</b></article><article><Mark tone="sand">C</Mark><span><strong>Clean and sorted</strong><small>Upload three clear receipts</small></span><b>1 / 3</b></article></section><p className="reward-disclaimer">Sponsored rewards can be added later only when a real partner funds them.</p></div>;
}

function MobileProfile() {
  return <div className="mobile-page"><div className="profile-hero"><span>MS</span><h1>Mia Santos</h1><p>Palm Grove Residences · Member since 2026</p><div><b>18.4 kg<small>recycled</small></b><b>7<small>sales logged</small></b><b>280<small>EcoPoints</small></b></div></div><section className="profile-menu">{["Saved locations","My recycling proofs","Notification settings","Help center","Terms & privacy"].map((label, index) => <button key={label}><Mark tone={index % 2 ? "sand" : "mint"}>{["⌖","◇","◌","?","i"][index]}</Mark><span>{label}</span><b>›</b></button>)}</section></div>;
}
