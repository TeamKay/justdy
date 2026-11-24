import { getYoutubeVideos } from "@/lib/youtube";
import { Inter, Instrument_Serif } from "next/font/google";
import MarketingNavbar from "@/app/_components/Navbar";
import MarketingFooter from "@/app/_components/Footer";
import TutoringSection from "./_components/TutoringSection";
import LatestVideosSection from "./_components/LatestVideosSection";
import MathHero from "./_components/MathHero";
import TestimonialsSection from "./_components/TestimonialsSection";
import LearningPathwaysSection from "./_components/LearningPathwaysSection";
import CallToActionSection from "./_components/CallToActionSection";
import prisma from "@/lib/prisma";

export const revalidate = 60;


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});


export default async function LandingPage() {
  const [mathVideos, techVideos, announcement] = await Promise.all([
    getYoutubeVideos("math"),
    getYoutubeVideos("tech"),
    prisma.announcement.findFirst({
      where: {
        isPublished: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        message: true,
        linkLabel: true,
        linkUrl: true,
      },
    }),
  ]);

  const latestVideos = [...mathVideos, ...techVideos]
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt ?? "") -
        Date.parse(a.publishedAt ?? ""),
    )
    .slice(0, 3);

  return (
    <div
      className={`${inter.variable} ${instrumentSerif.variable} min-h-screen overflow-x-hidden bg-[#ffffff] text-[#302044]`}
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <MarketingNavbar />
      <MathHero announcement={announcement} />
      <TutoringSection />
      <LatestVideosSection videos={latestVideos} />
      <LearningPathwaysSection />
      <TestimonialsSection />
      <CallToActionSection />
      <MarketingFooter />
    </div>
  );
}
