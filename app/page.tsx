import { getYoutubeVideos, type Video as YouTubeVideo } from "@/lib/youtube";
import { Inter, Instrument_Serif } from "next/font/google";
import MarketingNavbar from "@/app/_components/MarketingNavbar";
import MarketingFooter from "@/app/_components/MarketingFooter";
import TutoringSection from "./_components/TutoringSection";
import LatestVideosSection from "./_components/LatestVideosSection";
import MathHero from "./_components/MathHero";
import TestimonialsSection from "./_components/TestimonialsSection";
import LearningPathwaysSection from "./_components/LearningPathwaysSection";
import CallToActionSection from "./_components/CallToActionSection";
import Announcements from "./_components/Announcements";


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
        <TutoringSection />
        <LatestVideosSection videos={latestVideos} />
        <LearningPathwaysSection />
        <TestimonialsSection />
        <CallToActionSection />
        <MarketingFooter />
     
    </div>
  );
}


