import type { Metadata } from "next";
import { HakotApp } from "./HakotApp";

export const metadata: Metadata = {
  title: "BasuCash | Basura mo, may value.",
  description: "Snap recyclables, see estimated points, and turn verified pickups into useful local rewards.",
};

export default function Home() {
  return <HakotApp />;
}
