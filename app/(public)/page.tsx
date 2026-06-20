import AITutor from "../_components/AITutor";
import CallToAction from "../_components/CallToAction";
import HowItWorks from "../_components/HowItWorks";
import LandingPage from "../_components/LandingPage";
import LatestCourses from "../_components/LatestCourses";
import Testimonials from "../_components/Testimonials";

export default function Home() {
  return (
    <>
      <LandingPage />
      <HowItWorks />
      <LatestCourses />
      <AITutor />
      <Testimonials />
      <CallToAction />
    </>
  );
}
