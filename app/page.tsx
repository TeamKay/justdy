import { getYoutubeVideos, type Video as YouTubeVideo } from "@/lib/youtube";
import { Inter, Instrument_Serif } from "next/font/google";
import MarketingNavbar from "@/app/_components/public/MarketingNavbar";
import MarketingFooter from "@/app/_components/public/MarketingFooter";
import StatsSection from "./_components/public/StatsSection";
import TutoringSection from "./_components/public/TutoringSection";
import LatestVideosSection from "./_components/public/LatestVideosSection";
import MathHero from "./_components/public/MathHero";
import TestimonialsSection from "./_components/public/TestimonialsSection";
import LearningPathwaysSection from "./_components/public/LearningPathwaysSection";
import CallToActionSection from "./_components/public/CallToActionSection";
import Announcements from "./_components/public/Announcements";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});


export default async function LandingPage() {
   // Fetch videos from both existing YouTube channels
  const [mathVideos, techVideos] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
  ]);

  // Combine, sort by publication date, and select the latest three
  const latestVideos = [...mathVideos, ...techVideos]
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt ?? "") -
        Date.parse(a.publishedAt ?? ""),
    )
    .slice(0, 3);
  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-white text-[#302044]`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
        <MarketingNavbar />
        <Announcements/>
        <MathHero/>
        <StatsSection />
        <TutoringSection />
        <LatestVideosSection videos={latestVideos} />
        <LearningPathwaysSection />
        <TestimonialsSection />
        <CallToActionSection />
        <MarketingFooter />
     
    </div>
  );
}


