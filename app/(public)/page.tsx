import Testimonials from "../_components/Testimonials";
import CallToAction from "../_components/CallToAction";
import LandingPage from "../_components/LandingPage";
import AITutor from "../_components/AITutor";
import HowItWorks from "../_components/HowItWorks";
import LatestCourses from "../_components/LatestCourses";
import { PricingTable } from "../_components/PricingTable";

export default async function HomePage() {
  return (
    <>
      <LandingPage />
      <HowItWorks />
      <LatestCourses />
      <PricingTable />
      <AITutor />
      <Testimonials />
      <CallToAction />
    </>
  );
}
