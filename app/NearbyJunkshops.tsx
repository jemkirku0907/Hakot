"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };
type Partner = Coordinates & {
  id: string;
  name: string;
  address: string;
  contact: string;
  hours: string;
  materials: string[];
  source: "sample" | "community";
};

const materialOptions = ["PET", "Cardboard", "Metal", "Glass"];
const starterPartners: Partner[] = [
  { id: "cubao", name: "Cubao Recycle Hub", address: "Project 4, Quezon City", contact: "", hours: "Hours unconfirmed", lat: 14.6235, lng: 121.0617, materials: ["PET", "Cardboard", "Metal"], source: "sample" },
  { id: "loyola", name: "Loyola Heights Eco Center", address: "Loyola Heights, Quezon City", contact: "", hours: "Hours unconfirmed", lat: 14.6416, lng: 121.0732, materials: ["PET", "Glass", "Metal"], source: "sample" },
  { id: "kamuning", name: "Kamuning Materials Hub", address: "Kamuning, Quezon City", contact: "", hours: "Hours unconfirmed", lat: 14.6321, lng: 121.0348, materials: ["Cardboard", "PET", "Metal", "Glass"], source: "sample" },
];

const blankDraft = { name: "", address: "", contact: "", hours: "", materials: ["PET"] };

function distanceKm(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyJunkshops() {
  const mapElement = useRef<HTMLDivElement>(null);
  const [communityPartners, setCommunityPartners] = useState<Partner[]>([]);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [selectedId, setSelectedId] = useState(starterPartners[0].id);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [showAdd, setShowAdd] = useState(false);
  const [draftPin, setDraftPin] = useState<Coordinates | null>(null);
  const [draft, setDraft] = useState(blankDraft);
  const [notice, setNotice] = useState("");

  const allPartners = useMemo(
    () => [...starterPartners, ...communityPartners].filter((partner) => !reportedIds.includes(partner.id)),
    [communityPartners, reportedIds],
  );

  const orderedPartners = useMemo(() => [...allPartners].sort((a, b) => {
    if (!location) return a.source === b.source ? 0 : a.source === "community" ? -1 : 1;
    return distanceKm(location, a) - distanceKm(location, b);
  }), [allPartners, location]);

  const selected = allPartners.find((partner) => partner.id === selectedId) ?? allPartners[0];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("basucash-community-shops-v1");
      const reports = window.localStorage.getItem("basucash-reported-shops-v1");
      if (saved) setCommunityPartners(JSON.parse(saved) as Partner[]);
      if (reports) setReportedIds(JSON.parse(reports) as string[]);
    } catch { /* keep safe local defaults */ }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("basucash-community-shops-v1", JSON.stringify(communityPartners));
    window.localStorage.setItem("basucash-reported-shops-v1", JSON.stringify(reportedIds));
  }, [communityPartners, reportedIds, storageReady]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!mapElement.current || !selected) return;
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    void import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      map = L.map(mapElement.current, { zoomControl: false, attributionControl: true }).setView([selected.lat, selected.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      allPartners.forEach((partner) => {
        const active = partner.id === selectedId;
        L.circleMarker([partner.lat, partner.lng], {
          radius: active ? 11 : 8,
          color: "#ffffff",
          weight: 3,
          fillColor: partner.source === "community" ? "#f2a93b" : active ? "#07543f" : "#17aa82",
          fillOpacity: 1,
        }).addTo(map!).bindTooltip(`${partner.name}${partner.source === "community" ? " · Community" : ""}`).on("click", () => setSelectedId(partner.id));
      });

      if (location) {
        L.circleMarker([location.lat, location.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#2878d0", fillOpacity: 1 })
          .addTo(map).bindTooltip("Your location");
      }

      if (showAdd && draftPin) {
        L.circleMarker([draftPin.lat, draftPin.lng], { radius: 11, color: "#ffffff", weight: 3, fillColor: "#f2a93b", fillOpacity: 1 })
          .addTo(map).bindTooltip("New junkshop pin");
      }

      if (location && !showAdd) {
        const bounds = L.latLngBounds([...allPartners.map((partner) => [partner.lat, partner.lng] as [number, number]), [location.lat, location.lng]]);
        map.fitBounds(bounds, { padding: [28, 28] });
      }

      map.on("click", (event) => {
        if (showAdd) setDraftPin({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
    });

    return () => { disposed = true; map?.remove(); };
  }, [allPartners, draftPin, location, selected, selectedId, showAdd]);

  function useMyLocation(forPin = false) {
    if (!navigator.geolocation) { setLocationState("error"); return; }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude };
        const nearest = [...allPartners].sort((a, b) => distanceKm(current, a) - distanceKm(current, b))[0];
        setLocation(current);
        if (forPin) setDraftPin(current);
        else if (nearest) setSelectedId(nearest.id);
        setLocationState("ready");
      },
      () => setLocationState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  function openAddForm() {
    setDraft(blankDraft);
    setDraftPin(location);
    setShowAdd(true);
    setNotice("");
  }

  function toggleMaterial(material: string) {
    setDraft((current) => ({
      ...current,
      materials: current.materials.includes(material)
        ? current.materials.filter((item) => item !== material)
        : [...current.materials, material],
    }));
  }

  function addCommunityShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftPin) { setNotice("Add a map pin first—tap the map or use your current location."); return; }
    if (!draft.materials.length) { setNotice("Choose at least one accepted material."); return; }
    const partner: Partner = {
      id: `community-${Date.now()}`,
      name: draft.name.trim(),
      address: draft.address.trim(),
      contact: draft.contact.trim(),
      hours: draft.hours.trim() || "Hours unconfirmed",
      materials: draft.materials,
      lat: draftPin.lat,
      lng: draftPin.lng,
      source: "community",
    };
    setCommunityPartners((current) => [...current, partner]);
    setSelectedId(partner.id);
    setShowAdd(false);
    setDraftPin(null);
    setNotice("Community listing saved on this device. Contact the shop before visiting.");
  }

  function reportListing(partner: Partner) {
    setReportedIds((current) => [...current, partner.id]);
    setSelectedId(starterPartners[0].id);
    setNotice(`${partner.name} was hidden on this device. Thanks for reporting it.`);
  }

  return <div className="nearby-page">
    <header className="nearby-head"><span>GPS + community directory</span><h1>Nearby junkshops</h1><p>Find saved community pins or search Google Maps. Always contact the shop to confirm materials and today&apos;s price.</p></header>
    <div className={`partner-map ${showAdd ? "pinning" : ""}`} ref={mapElement} aria-label="Map of nearby recycling locations" />
    {showAdd && <p className="map-pin-help">Tap the map to move the orange pin to the junkshop&apos;s exact entrance.</p>}
    <div className="map-location-row">
      <button onClick={() => useMyLocation(showAdd)} disabled={locationState === "loading"}><span>⌖</span>{locationState === "loading" ? "Finding you…" : showAdd ? "Pin my location" : location ? "Location updated" : "Use my location"}</button>
      <small>{locationState === "error" ? "Location unavailable. Enable permission and try again." : location ? "Results sorted by distance" : "Your location stays on this device."}</small>
    </div>

    <div className="junkshop-discovery-actions">
      <button onClick={openAddForm}>+ Add local junkshop</button>
      <a href="https://www.google.com/maps/search/?api=1&query=junkshop%20near%20me" target="_blank" rel="noreferrer">Search Google Maps ↗</a>
    </div>

    {showAdd && <form className="community-shop-form" onSubmit={addCommunityShop}>
      <div className="community-form-head"><div><span>Community contribution</span><h2>Add a small local junkshop</h2></div><button type="button" onClick={() => { setShowAdd(false); setDraftPin(null); }}>×</button></div>
      <p>Only add a shop you have seen or contacted. Your report is stored on this device for now.</p>
      <label>Shop name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Aling Rosa Junk Shop" /></label>
      <label>Address or landmark<input required value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="Street, barangay, or nearby landmark" /></label>
      <div className="community-form-grid"><label>Contact (optional)<input value={draft.contact} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} placeholder="09xx or landline" /></label><label>Hours (optional)<input value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: event.target.value })} placeholder="e.g. Mon–Sat, 8–5" /></label></div>
      <fieldset><legend>Known accepted materials</legend><div>{materialOptions.map((material) => <label key={material}><input type="checkbox" checked={draft.materials.includes(material)} onChange={() => toggleMaterial(material)} />{material}</label>)}</div></fieldset>
      <div className="pin-status"><span className={draftPin ? "ready" : ""}>⌖</span><p><strong>{draftPin ? "Map pin ready" : "Map pin required"}</strong><small>{draftPin ? `${draftPin.lat.toFixed(5)}, ${draftPin.lng.toFixed(5)}` : "Tap the map or use your current location."}</small></p></div>
      <button className="save-community-shop" type="submit">Save community listing</button>
    </form>}

    {notice && <p className="map-notice" role="status">{notice}</p>}

    <section className="partner-results">
      <div className="partner-results-title"><h2>Drop-off points</h2><span>{communityPartners.length} community · {starterPartners.length} examples</span></div>
      {orderedPartners.map((partner) => {
        const active = partner.id === selectedId;
        const distance = location ? distanceKm(location, partner) : null;
        return <article key={partner.id} className={`${active ? "active" : ""} ${partner.source}`}>
          <button className="partner-main" onClick={() => setSelectedId(partner.id)} aria-label={`Show ${partner.name} on map`}>
            <span className="partner-pin">⌖</span><span><b>{partner.name}</b><small>{partner.address}</small><em>{partner.source === "community" ? "Community reported · Not yet verified" : "Example listing · Not verified"}</em></span><strong>{distance === null ? (partner.source === "community" ? "Saved" : "Example") : `${distance.toFixed(1)} km`}</strong>
          </button>
          <div className="material-tags">{partner.materials.map((material) => <span key={material}>{material}</span>)}</div>
          {active && <><div className="partner-detail-row"><span>{partner.hours}</span>{partner.contact && <a href={`tel:${partner.contact}`}>Call {partner.contact}</a>}</div><div className="partner-actions"><button onClick={() => setConfirmedId(partner.id)}>{confirmedId === partner.id ? "Drop-off selected ✓" : "Choose drop-off"}</button><a href={`https://www.google.com/maps/dir/?api=1&destination=${partner.lat},${partner.lng}`} target="_blank" rel="noreferrer">Directions ↗</a></div>{partner.source === "community" && <button className="report-listing" onClick={() => reportListing(partner)}>Report incorrect or closed listing</button>}</>}
          {confirmedId === partner.id && <p className="partner-confirmation">Bring clean, sorted recyclables. Keep the receipt or photograph the scale, then record the cash the junkshop paid you.</p>}
        </article>;
      })}
    </section>
    <p className="partner-note">BasuCash does not verify prices or ownership yet. Community pins stay on this device until a moderated shared directory is funded.</p>
  </div>;
}
