import type { Metadata } from "next";
import { HakotApp } from "./HakotApp";

export const metadata: Metadata = {
  title: "HAKOT | Ipunin. Ipa-hakot. Masundan.",
  description: "Schedule community recycling pickups, track proof, and coordinate routes with verified local partners.",
};

export default function Home() {
  return <HakotApp />;
}
