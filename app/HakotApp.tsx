"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "resident" | "collector" | "operations";
type ResidentView = "home" | "pickups" | "impact";
type MaterialId = "cardboard" | "pet" | "metal" | "ewaste";
type PickupStatus = "Confirmed" | "Assigned" | "Collected" | "Needs review";

type Pickup = {
  id: string;
  material: MaterialId;
  label: string;
  quantity: string;
  date: string;
  window: string;
  location: string;
  status: PickupStatus;
  weight?: string;
  payout?: string;
};

const materials: Array<{
  id: MaterialId;
  icon: string;
  label: string;
  rate: string;
  note: string;
  accent: string;
}> = [
  { id: "cardboard", icon: "▤", label: "Cardboard", rate: "₱4–7 / kg", note: "Dry and bundled", accent: "sand" },
  { id: "pet", icon: "♻", label: "PET bottles", rate: "₱12–18 / kg", note: "Empty and rinsed", accent: "mint" },
  { id: "metal", icon: "◫", label: "Selected metal", rate: "Rate at pickup", note: "Sorted by type", accent: "blue" },
  { id: "ewaste", icon: "⌁", label: "Small e-waste", rate: "Free drop-off", note: "Devices and cables", accent: "lilac" },
];

const starterPickups: Pickup[] = [
  {
    id: "HK-240718",
    material: "cardboard",
    label: "Cardboard + PET bottles",
    quantity: "2 medium sacks",
    date: "Jul 26, 2026",
    window: "8:00–11:00 AM",
    location: "Palm Grove Residences · Lobby B",
    status: "Assigned",
  },
  {
    id: "HK-240602",
    material: "ewaste",
    label: "Small e-waste",
    quantity: "1 tote bag",
    date: "Jun 14, 2026",
    window: "Completed 10:42 AM",
    location: "Palm Grove Residences · Lobby B",
    status: "Collected",
    weight: "3.8 kg",
    payout: "Donation",
  },
];

const routeStops = [
  { id: "B-01", name: "Lobby B collection point", meta: "12 bookings · 48–62 kg", status: "Ready", time: "8:00 AM" },
  { id: "A-03", name: "Tower A guardhouse", meta: "8 bookings · 31–44 kg", status: "Next", time: "9:10 AM" },
  { id: "C-02", name: "Clubhouse service bay", meta: "6 bookings · 18–25 kg", status: "Queued", time: "10:05 AM" },
  { id: "J-01", name: "Green Loop Junkshop", meta: "Route transfer · all materials", status: "Transfer", time: "11:20 AM" },
];

const roleCopy: Record<Role, { eyebrow: string; title: string; description: string }> = {
  resident: {
    eyebrow: "Palm Grove Residences",
    title: "Good afternoon, Mia.",
    description: "Your next community pickup is open. Add your recyclables before Friday, 6:00 PM.",
  },
  collector: {
    eyebrow: "Green Loop Collection Team",
    title: "Saturday route is ready.",
    description: "Four stops, 26 bookings, and an estimated 97–131 kg are locked for collection.",
  },
  operations: {
    eyebrow: "HAKOT Operations · Quezon City pilot",
    title: "Routes are on track.",
    description: "One exception needs review before tomorrow’s collection cutoff.",
  },
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span aria-hidden="true" className="ui-icon">{children}</span>;
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status status-${key}`}><span className="status-dot" />{status}</span>;
}

export function HakotApp() {
  const [role, setRole] = useState<Role>("resident");
  const [residentView, setResidentView] = useState<ResidentView>("home");
  const [pickups, setPickups] = useState<Pickup[]>(starterPickups);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialId[]>(["cardboard"]);
  const [quantity, setQuantity] = useState("1–2 medium sacks");
  const [pickupDate, setPickupDate] = useState("2026-07-26");
  const [location, setLocation] = useState("Palm Grove Residences · Lobby B");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");
  const [completedStops, setCompletedStops] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("hakot-pickups");
    if (saved) {
      try {
        const storedPickups = JSON.parse(saved) as Pickup[];
        queueMicrotask(() => setPickups(storedPickups));
      } catch { /* Keep safe demo defaults. */ }
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hakot-pickups", JSON.stringify(pickups));
  }, [pickups]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedLabels = useMemo(
    () => materials.filter((material) => selectedMaterials.includes(material.id)).map((material) => material.label),
    [selectedMaterials],
  );

  function switchRole(next: Role) {
    setRole(next);
    setShowNotifications(false);
    if (next === "resident") setResidentView("home");
  }

  function openBooking(material?: MaterialId) {
    if (material) setSelectedMaterials([material]);
    setBookingStep(1);
    setBookingOpen(true);
  }

  function toggleMaterial(id: MaterialId) {
    setSelectedMaterials((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!selectedMaterials.length) return;
    const newPickup: Pickup = {
      id: `HK-${String(Date.now()).slice(-6)}`,
      material: selectedMaterials[0],
      label: selectedLabels.join(" + "),
      quantity,
      date: formatDate(pickupDate),
      window: "8:00–11:00 AM",
      location,
      status: "Confirmed",
    };
    setPickups((current) => [newPickup, ...current]);
    setBookingOpen(false);
    setResidentView("pickups");
    setToast("Pickup added to the community route.");
    setNotes("");
  }

  function markStop(id: string) {
    setCompletedStops((current) => current.includes(id) ? current : [...current, id]);
    setToast("Stop recorded. Weight and payout proof saved.");
  }

  const copy = roleCopy[role];

  return (
    <main className="app-shell">
      <aside className="side-rail" aria-label="Primary navigation">
        <button className="brand" onClick={() => switchRole("resident")} aria-label="HAKOT home">
          <span className="brand-mark"><span>H</span></span>
          <span className="brand-word">HAKOT</span>
        </button>

        <nav className="rail-nav">
          <button className={role === "resident" ? "active" : ""} onClick={() => switchRole("resident")}>
            <Icon>⌂</Icon><span>Resident</span>
          </button>
          <button className={role === "collector" ? "active" : ""} onClick={() => switchRole("collector")}>
            <Icon>▱</Icon><span>Collector</span>
          </button>
          <button className={role === "operations" ? "active" : ""} onClick={() => switchRole("operations")}>
            <Icon>▦</Icon><span>Operations</span>
          </button>
        </nav>

        <div className="pilot-chip"><span className="live-dot" />QC pilot live</div>
        <button className="profile-card" onClick={() => setToast("Profile settings are ready for backend integration.")}>
          <span className="avatar">MM</span>
          <span><strong>Mia M.</strong><small>Community member</small></span>
          <span aria-hidden="true">›</span>
        </button>
      </aside>

      <section className="app-content">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark small"><span>H</span></span><strong>HAKOT</strong></div>
          <div className="role-switcher" aria-label="Switch demo role">
            <button className={role === "resident" ? "active" : ""} onClick={() => switchRole("resident")}>Resident</button>
            <button className={role === "collector" ? "active" : ""} onClick={() => switchRole("collector")}>Collector</button>
            <button className={role === "operations" ? "active" : ""} onClick={() => switchRole("operations")}>Ops</button>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Open notifications" onClick={() => setShowNotifications((value) => !value)}>
              <Icon>◌</Icon><span className="notification-dot" />
            </button>
            {role === "resident" && <button className="button primary compact" onClick={() => openBooking()}><Icon>＋</Icon>Book pickup</button>}
          </div>
          {showNotifications && (
            <div className="notification-panel" role="status">
              <strong>Pickup reminder</strong>
              <p>Add or edit items before Friday at 6:00 PM.</p>
              <small>12 minutes ago</small>
            </div>
          )}
        </header>

        <div className="page-wrap">
          <section className="page-intro">
            <div>
              <span className="eyebrow">{copy.eyebrow}</span>
              <h1>{copy.title}</h1>
              <p>{copy.description}</p>
            </div>
            <div className="trust-badge"><Icon>✓</Icon><span><strong>Verified pilot</strong><small>2 local partners</small></span></div>
          </section>

          {role === "resident" && (
            <>
              <div className="subnav" aria-label="Resident sections">
                {(["home", "pickups", "impact"] as ResidentView[]).map((view) => (
                  <button key={view} onClick={() => setResidentView(view)} className={residentView === view ? "active" : ""}>
                    {view === "home" ? "Overview" : view === "pickups" ? "My pickups" : "My impact"}
                  </button>
                ))}
              </div>
              {residentView === "home" && <ResidentHome pickups={pickups} onBook={openBooking} onViewPickups={() => setResidentView("pickups")} />}
              {residentView === "pickups" && <PickupList pickups={pickups} onBook={() => openBooking()} />}
              {residentView === "impact" && <ImpactView pickups={pickups} />}
            </>
          )}

          {role === "collector" && <CollectorView completedStops={completedStops} onComplete={markStop} />}
          {role === "operations" && <OperationsView onResolve={() => setToast("Exception assigned to Ana for review.")} />}
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={role === "resident" ? "active" : ""} onClick={() => switchRole("resident")}><Icon>⌂</Icon><span>Resident</span></button>
        <button className={role === "collector" ? "active" : ""} onClick={() => switchRole("collector")}><Icon>▱</Icon><span>Collector</span></button>
        <button className="mobile-action" onClick={() => openBooking()} aria-label="Book pickup"><Icon>＋</Icon></button>
        <button className={role === "operations" ? "active" : ""} onClick={() => switchRole("operations")}><Icon>▦</Icon><span>Ops</span></button>
        <button onClick={() => setShowNotifications(true)}><Icon>◌</Icon><span>Alerts</span></button>
      </nav>

      {bookingOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setBookingOpen(false)}>
          <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <div className="modal-head">
              <div><span className="eyebrow">Community route · Jul 26</span><h2 id="booking-title">Book a pickup</h2></div>
              <button className="icon-button" aria-label="Close booking" onClick={() => setBookingOpen(false)}>×</button>
            </div>
            <div className="stepper" aria-label={`Step ${bookingStep} of 3`}>
              {[1, 2, 3].map((step) => <span key={step} className={bookingStep >= step ? "active" : ""}><b>{step}</b><small>{step === 1 ? "Materials" : step === 2 ? "Details" : "Review"}</small></span>)}
            </div>
            <form onSubmit={submitBooking}>
              {bookingStep === 1 && (
                <div className="modal-body">
                  <h3>What are we collecting?</h3>
                  <p className="muted">Choose all that apply. Final acceptance and value are confirmed after inspection and weighing.</p>
                  <div className="material-select-grid">
                    {materials.map((material) => (
                      <button type="button" key={material.id} className={selectedMaterials.includes(material.id) ? "selected" : ""} onClick={() => toggleMaterial(material.id)}>
                        <span className={`material-icon ${material.accent}`}>{material.icon}</span>
                        <span><strong>{material.label}</strong><small>{material.note}</small></span>
                        <span className="check">✓</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {bookingStep === 2 && (
                <div className="modal-body form-grid">
                  <label><span>Approximate amount</span><select value={quantity} onChange={(event) => setQuantity(event.target.value)}><option>1 small bag</option><option>1–2 medium sacks</option><option>3–5 medium sacks</option><option>Bulky item</option></select></label>
                  <label><span>Pickup date</span><input type="date" value={pickupDate} min="2026-07-26" onChange={(event) => setPickupDate(event.target.value)} /></label>
                  <label className="wide"><span>Handoff point</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>Palm Grove Residences · Lobby B</option><option>Palm Grove Residences · Tower A guardhouse</option><option>Palm Grove Residences · Clubhouse bay</option></select></label>
                  <label className="wide"><span>Access notes <small>optional</small></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Example: Ask the lobby guard for unit 8C items." /></label>
                  <div className="info-note wide"><Icon>i</Icon><p>Leave materials at the selected handoff point between 7:30 and 8:00 AM. Keep paper dry and separate e-waste from other materials.</p></div>
                </div>
              )}
              {bookingStep === 3 && (
                <div className="modal-body">
                  <div className="review-card">
                    <div className="review-icon"><Icon>✓</Icon></div>
                    <h3>Ready for the community route</h3>
                    <p>Your request will be grouped with nearby bookings.</p>
                    <dl><div><dt>Materials</dt><dd>{selectedLabels.join(", ")}</dd></div><div><dt>Amount</dt><dd>{quantity}</dd></div><div><dt>Date & window</dt><dd>{formatDate(pickupDate)} · 8:00–11:00 AM</dd></div><div><dt>Handoff</dt><dd>{location}</dd></div></dl>
                  </div>
                  <label className="consent"><input required type="checkbox" /><span>I understand that photos and listed rates are estimates. Actual acceptance, weight, and payout are confirmed at collection.</span></label>
                </div>
              )}
              <div className="modal-actions">
                {bookingStep > 1 ? <button type="button" className="button secondary" onClick={() => setBookingStep((step) => step - 1)}>Back</button> : <button type="button" className="button secondary" onClick={() => setBookingOpen(false)}>Cancel</button>}
                {bookingStep < 3 ? <button type="button" className="button primary" disabled={bookingStep === 1 && !selectedMaterials.length} onClick={() => setBookingStep((step) => step + 1)}>Continue <span aria-hidden="true">→</span></button> : <button type="submit" className="button primary">Confirm pickup</button>}
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}

function ResidentHome({ pickups, onBook, onViewPickups }: { pickups: Pickup[]; onBook: (material?: MaterialId) => void; onViewPickups: () => void }) {
  const next = pickups.find((pickup) => pickup.status !== "Collected") ?? pickups[0];
  return (
    <div className="dashboard-grid">
      <section className="next-pickup-card">
        <div className="card-kicker"><span className="live-dot pale" />Next community pickup</div>
        <div className="pickup-date-block"><span>JUL</span><strong>26</strong><small>SATURDAY</small></div>
        <div className="pickup-copy"><h2>Dry recyclables & e-waste</h2><p>8:00–11:00 AM · Lobby B collection point</p><div className="route-meta"><span><Icon>◎</Icon>Green Loop Junkshop</span><span><Icon>◷</Icon>Cutoff in 3 days</span></div></div>
        <button className="button light" onClick={() => onBook()}>Add my items <span>→</span></button>
      </section>

      <section className="metric-strip" aria-label="Community impact">
        <div><span className="metric-icon"><Icon>♻</Icon></span><p><strong>186.4 kg</strong><small>community diverted</small></p></div>
        <div><span className="metric-icon"><Icon>◇</Icon></span><p><strong>34</strong><small>participating homes</small></p></div>
        <div><span className="metric-icon"><Icon>✓</Icon></span><p><strong>96%</strong><small>successful handoffs</small></p></div>
      </section>

      <section className="panel materials-panel">
        <div className="panel-head"><div><span className="eyebrow">Prepare before you book</span><h2>What we collect</h2></div><button className="text-button" onClick={() => onBook()}>View full guide →</button></div>
        <div className="material-grid">
          {materials.map((material) => (
            <button className="material-card" key={material.id} onClick={() => onBook(material.id)}>
              <span className={`material-icon ${material.accent}`}>{material.icon}</span>
              <span><strong>{material.label}</strong><small>{material.note}</small><em>{material.rate}</em></span><span className="card-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel active-pickup-panel">
        <div className="panel-head"><div><span className="eyebrow">In progress</span><h2>Your active pickup</h2></div><button className="text-button" onClick={onViewPickups}>All pickups →</button></div>
        <div className="active-row"><span className="material-icon sand">{materials.find((item) => item.id === next.material)?.icon}</span><div><strong>{next.label}</strong><small>{next.quantity} · {next.id}</small></div><StatusPill status={next.status} /></div>
        <div className="timeline"><span className="done"><b>✓</b><small>Booked</small></span><i /><span className="done"><b>✓</b><small>Route assigned</small></span><i /><span><b>3</b><small>Pickup</small></span><i /><span><b>4</b><small>Verified</small></span></div>
        <div className="prep-note"><Icon>i</Icon><p><strong>Prepare by 7:30 AM</strong><span>Bundle cardboard and keep PET bottles in a separate sack.</span></p></div>
      </section>

      <section className="tip-card"><span className="tip-number">01</span><div><span className="eyebrow">HAKOT tip</span><h2>Keep it dry, keep its value.</h2><p>Wet cardboard is often rejected. Store it indoors and bundle it only on pickup day.</p></div></section>
    </div>
  );
}

function PickupList({ pickups, onBook }: { pickups: Pickup[]; onBook: () => void }) {
  return (
    <section className="panel list-panel">
      <div className="panel-head"><div><span className="eyebrow">Request history</span><h2>My pickups</h2></div><button className="button primary compact" onClick={onBook}>＋ New pickup</button></div>
      <div className="pickup-list">
        {pickups.map((pickup) => (
          <article key={pickup.id} className="pickup-list-item">
            <span className={`material-icon ${materials.find((item) => item.id === pickup.material)?.accent}`}>{materials.find((item) => item.id === pickup.material)?.icon}</span>
            <div className="pickup-main"><div><strong>{pickup.label}</strong><StatusPill status={pickup.status} /></div><p>{pickup.date} · {pickup.window}</p><small>{pickup.location} · {pickup.quantity}</small></div>
            <div className="pickup-proof"><small>{pickup.id}</small>{pickup.weight && <strong>{pickup.weight}</strong>}{pickup.payout && <span>{pickup.payout}</span>}<button aria-label={`View ${pickup.id}`}>›</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImpactView({ pickups }: { pickups: Pickup[] }) {
  const completed = pickups.filter((pickup) => pickup.status === "Collected").length;
  return (
    <div className="impact-layout">
      <section className="impact-hero"><span className="eyebrow">Verified personal record</span><h2>{completed ? "3.8" : "0"}<small> kg</small></h2><p>Materials transferred to a declared downstream partner.</p><div className="impact-ring"><span>{Math.min(100, completed * 25)}%</span><small>to 15 kg goal</small></div></section>
      <section className="panel"><div className="panel-head"><div><span className="eyebrow">How records work</span><h2>Proof before points</h2></div></div><div className="proof-steps"><div><b>1</b><span><strong>Collected</strong><small>Partner records actual accepted weight.</small></span></div><div><b>2</b><span><strong>Transferred</strong><small>Route is handed to the declared receiver.</small></span></div><div><b>3</b><span><strong>Verified</strong><small>Receipt or receiving evidence closes the batch.</small></span></div></div></section>
      <section className="panel wide-panel"><div className="panel-head"><div><span className="eyebrow">Community comparison</span><h2>Palm Grove this quarter</h2></div></div><div className="bar-list"><div><span>Cardboard</span><i><b style={{ width: "82%" }} /></i><strong>92.1 kg</strong></div><div><span>PET bottles</span><i><b style={{ width: "61%" }} /></i><strong>54.6 kg</strong></div><div><span>Metal</span><i><b style={{ width: "38%" }} /></i><strong>31.7 kg</strong></div><div><span>E-waste</span><i><b style={{ width: "16%" }} /></i><strong>8.0 kg</strong></div></div></section>
    </div>
  );
}

function CollectorView({ completedStops, onComplete }: { completedStops: string[]; onComplete: (id: string) => void }) {
  return (
    <div className="collector-layout">
      <section className="route-summary-card"><div><span className="eyebrow">Route PG-0726 · Locked</span><h2>Palm Grove Saturday route</h2><p>4 stops · 8:00–11:45 AM · Dry recyclables + e-waste</p></div><div className="route-stat"><strong>{completedStops.length}/4</strong><small>stops closed</small></div><button className="button light" onClick={() => document.getElementById("route-manifest")?.scrollIntoView({ behavior: "smooth" })}>Open manifest ↓</button></section>
      <section className="metric-strip collector-metrics"><div><span className="metric-icon"><Icon>▱</Icon></span><p><strong>97–131 kg</strong><small>expected volume</small></p></div><div><span className="metric-icon"><Icon>◎</Icon></span><p><strong>6.8 km</strong><small>planned route</small></p></div><div><span className="metric-icon"><Icon>◷</Icon></span><p><strong>3h 45m</strong><small>route window</small></p></div></section>
      <section className="panel route-panel" id="route-manifest"><div className="panel-head"><div><span className="eyebrow">Sequenced stops</span><h2>Route manifest</h2></div><StatusPill status="Accepted" /></div><div className="route-list">{routeStops.map((stop, index) => { const complete = completedStops.includes(stop.id); return <article key={stop.id} className={complete ? "complete" : ""}><div className="route-sequence"><span>{complete ? "✓" : index + 1}</span><i /></div><div className="route-stop-copy"><small>{stop.time} · Stop {stop.id}</small><strong>{stop.name}</strong><p>{stop.meta}</p></div><div className="route-stop-action">{complete ? <StatusPill status="Collected" /> : <><StatusPill status={stop.status} /><button className="button secondary compact" onClick={() => onComplete(stop.id)}>Record stop</button></>}</div></article>; })}</div></section>
      <section className="panel safety-panel"><span className="safety-icon">!</span><div><span className="eyebrow">Route-day safety</span><h2>Do not load unknown or unsafe items.</h2><p>Reject leaking batteries, chemicals, medical waste, pressurized containers, and unlisted materials. Record a reason and notify operations.</p></div><button className="text-button">Open safety guide →</button></section>
    </div>
  );
}

function OperationsView({ onResolve }: { onResolve: () => void }) {
  return (
    <div className="operations-layout">
      <section className="ops-metrics">
        <div><span>Active routes</span><strong>3</strong><small><b>2</b> locked · 1 building</small></div>
        <div><span>Expected volume</span><strong>284<em> kg</em></strong><small>Across 4 partner sites</small></div>
        <div><span>Successful stops</span><strong>96.2<em>%</em></strong><small><b>+2.4%</b> from last month</small></div>
        <div className="attention"><span>Needs attention</span><strong>1</strong><small>Weight evidence review</small></div>
      </section>
      <section className="panel ops-routes"><div className="panel-head"><div><span className="eyebrow">Saturday, July 26</span><h2>Route control board</h2></div><button className="button primary compact">＋ Build route</button></div><div className="ops-table" role="table" aria-label="Active routes"><div className="ops-table-head" role="row"><span>Route</span><span>Partner</span><span>Bookings</span><span>Volume</span><span>Status</span><span /></div>{[
        ["PG-0726", "Green Loop", "26", "97–131 kg", "Locked"],
        ["SC-0726", "JRM Recyclers", "18", "72–94 kg", "Building"],
        ["EV-0727", "ReCircuit PH", "11", "E-waste", "Review"],
      ].map((row) => <div className="ops-table-row" role="row" key={row[0]}>{row.map((cell, index) => index === 4 ? <StatusPill key={cell} status={cell} /> : <span key={cell}>{cell}</span>)}<button aria-label={`Open route ${row[0]}`}>›</button></div>)}</div></section>
      <section className="panel exception-panel"><div className="panel-head"><div><span className="eyebrow">Exception inbox</span><h2>1 item needs review</h2></div><button className="text-button">View all →</button></div><article><span className="exception-icon">!</span><div><div><strong>Weight evidence does not match entry</strong><StatusPill status="Needs review" /></div><p>Booking HK-240514 · JRM Recyclers entered 12.4 kg; scale photo appears to show 10.4 kg.</p><small>Reported 18 minutes ago · Route SC-0726</small></div><button className="button secondary compact" onClick={onResolve}>Assign review</button></article></section>
      <section className="panel rate-panel"><div className="panel-head"><div><span className="eyebrow">Effective Jul 20, 2026</span><h2>Material rate board</h2></div><button className="text-button">Manage rates →</button></div><div className="rate-list">{materials.slice(0,3).map((material) => <div key={material.id}><span className={`material-icon ${material.accent}`}>{material.icon}</span><span><strong>{material.label}</strong><small>{material.note}</small></span><b>{material.rate}</b></div>)}</div></section>
    </div>
  );
}
