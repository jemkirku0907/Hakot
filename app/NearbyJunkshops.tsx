"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };
type Partner = Coordinates & {
  id: string;
  name: string;
  address: string;
  hours: string;
  materials: string[];
};

const partners: Partner[] = [
  { id: "cubao", name: "Cubao Recycle Hub", address: "Project 4, Quezon City", hours: "Open until 5:30 PM", lat: 14.6235, lng: 121.0617, materials: ["PET", "Cardboard", "Metal"] },
  { id: "loyola", name: "Loyola Heights Eco Center", address: "Loyola Heights, Quezon City", hours: "Open until 4:00 PM", lat: 14.6416, lng: 121.0732, materials: ["PET", "Glass", "Metal"] },
  { id: "kamuning", name: "Kamuning Materials Hub", address: "Kamuning, Quezon City", hours: "Open until 6:00 PM", lat: 14.6321, lng: 121.0348, materials: ["Cardboard", "PET", "Metal", "Glass"] },
];

function distanceKm(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyJunkshops() {
  const mapElement = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(partners[0].id);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const orderedPartners = useMemo(() => [...partners].sort((a, b) => {
    if (!location) return 0;
    return distanceKm(location, a) - distanceKm(location, b);
  }), [location]);

  const selected = partners.find((partner) => partner.id === selectedId) ?? partners[0];

  useEffect(() => {
    if (!mapElement.current) return;
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

      partners.forEach((partner) => {
        const active = partner.id === selectedId;
        L.circleMarker([partner.lat, partner.lng], {
          radius: active ? 11 : 8,
          color: "#ffffff",
          weight: 3,
          fillColor: active ? "#07543f" : "#17aa82",
          fillOpacity: 1,
        }).addTo(map!).bindTooltip(partner.name).on("click", () => setSelectedId(partner.id));
      });

      if (location) {
        L.circleMarker([location.lat, location.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#2878d0", fillOpacity: 1 })
          .addTo(map).bindTooltip("Your location");
        const bounds = L.latLngBounds([...partners.map((partner) => [partner.lat, partner.lng] as [number, number]), [location.lat, location.lng]]);
        map.fitBounds(bounds, { padding: [28, 28] });
      } else {
        map.setView([selected.lat, selected.lng], 13);
      }
    });

    return () => { disposed = true; map?.remove(); };
  }, [location, selected.lat, selected.lng, selectedId]);

  function useMyLocation() {
    if (!navigator.geolocation) { setLocationState("error"); return; }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude };
        const nearest = [...partners].sort((a, b) => distanceKm(current, a) - distanceKm(current, b))[0];
        setLocation(current); setSelectedId(nearest.id); setLocationState("ready");
      },
      () => setLocationState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  return <div className="nearby-page">
    <header className="nearby-head"><span>Verified drop-off partners</span><h1>Nearby junkshops</h1><p>Find a BasuCash partner that accepts your sorted recyclables.</p></header>
    <div className="partner-map" ref={mapElement} aria-label="Map of nearby recycling partners" />
    <div className="map-location-row">
      <button onClick={useMyLocation} disabled={locationState === "loading"}><span>⌖</span>{locationState === "loading" ? "Finding you…" : location ? "Location updated" : "Use my location"}</button>
      <small>{locationState === "error" ? "Location unavailable. Enable permission and try again." : location ? "Sorted by distance from you" : "Location is used only to calculate distance."}</small>
    </div>
    <section className="partner-results">
      <div className="partner-results-title"><h2>Drop-off points</h2><span>{partners.length} sample partners</span></div>
      {orderedPartners.map((partner) => {
        const active = partner.id === selectedId;
        const distance = location ? distanceKm(location, partner) : null;
        return <article key={partner.id} className={active ? "active" : ""}>
          <button className="partner-main" onClick={() => setSelectedId(partner.id)} aria-label={`Show ${partner.name} on map`}>
            <span className="partner-pin">⌖</span><span><b>{partner.name}</b><small>{partner.address}</small><em>{partner.hours}</em></span><strong>{distance === null ? "Sample" : `${distance.toFixed(1)} km`}</strong>
          </button>
          <div className="material-tags">{partner.materials.map((material) => <span key={material}>{material}</span>)}</div>
          {active && <div className="partner-actions"><button onClick={() => setConfirmedId(partner.id)}>{confirmedId === partner.id ? "Drop-off selected ✓" : "Choose drop-off"}</button><a href={`https://www.google.com/maps/dir/?api=1&destination=${partner.lat},${partner.lng}`} target="_blank" rel="noreferrer">Directions ↗</a></div>}
          {confirmedId === partner.id && <p className="partner-confirmation">Bring sorted recyclables and show your BasuCash QR at weighing. Final points are credited after verification.</p>}
        </article>;
      })}
    </section>
    <p className="partner-note">Prototype locations only. Production partners must be verified before appearing in BasuCash.</p>
  </div>;
}
