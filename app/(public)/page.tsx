import Testimonials from "../_components/Testimonials";
import CallToAction from "../_components/CallToAction";
import LandingPage from "../_components/LandingPage";
import AITutor from "../_components/AITutor";
import HowItWorks from "../_components/HowItWorks";
import LatestCourses from "../_components/LatestCourses";
import PricingPage from "../_components/Pricing";

export default async function HomePage() {
  //  const categories = await getCategories();
  return (
    <>
      <LandingPage />
      <HowItWorks />
      <LatestCourses />
      <PricingPage />
      <AITutor />
      <Testimonials />
      <CallToAction />
    </>
  );
}
