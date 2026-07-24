import LandingPage from "../_components/LandingPage";
import Testimonials from "../_components/Testimonials";
import CTASectionSplit from "../_components/CTASectionSplit";
import DashboardExperience from "../_components/DashboardExperience";
import FreeVideos from "../_components/FreeVideos";

export default function HomePage() {
  return (
    <>
      <LandingPage />
      <DashboardExperience />
      <FreeVideos />
      <Testimonials />
      <CTASectionSplit />
      {/* <DashboardExperience />
      <TutoringConsultingAISection /> */}
      {/* <LatestCourses />
      <FeaturedProducts /> */}
      {/* <OnlineCoursesBanner />
      <DigitalProductsCatalog />
     
      <CTASectionSplit /> */}
    </>
  );
}
