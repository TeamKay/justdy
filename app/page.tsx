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
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-[#352715] text-[#302044]`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="relative isolate overflow-hidden bg-[#FFD6A5] text-[#171717]">
        {/* Warm peach background with the fine orange dotted pattern from the reference. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(244,171,82,0.72) 1.15px, transparent 1.3px)",
            backgroundSize: "18px 18px",
          }}
        />
     
        <MarketingNavbar />
        <MathHero/>
        <StatsSection />
        <TutoringSection />
        <LatestVideosSection videos={latestVideos} />
        <LearningPathwaysSection />
        <TestimonialsSection />
        <CallToActionSection />
        <MarketingFooter />
      </div>
    </div>
  );
}


