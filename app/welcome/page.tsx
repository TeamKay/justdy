
import type { Metadata } from "next";
import LandingPage from "@/app/_components/general/LandingPage";

export const metadata: Metadata = {
  title: "Welcome to Justdy",
  description:
    "Discover Justdy, connect with tutors and learners, and explore learning opportunities.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
