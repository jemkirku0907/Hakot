import type { Metadata } from "next";
import { HakotApp } from "./HakotApp";

export const metadata: Metadata = {
  title: "BasuCash | Basura mo, may value.",
  description: "Check recyclable value, find nearby junkshops, and track your cash earnings and EcoPoints.",
};

export default function Home() {
  return <HakotApp />;
}
