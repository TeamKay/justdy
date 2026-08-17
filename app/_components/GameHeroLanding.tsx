// app/components/HeroLanding.tsx
import Image from "next/image"
import { Check } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function GameHeroLanding() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT COLUMN — IMAGE */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-xl">
              <Image
                src="/images/gamehero.png"
                alt="Learning platform preview"
                width={1200}
                height={900}
                priority
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* RIGHT COLUMN — TEXT */}
          <div className="flex flex-col space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white-900">
              Learning that kids love <br className="hidden md:block" /> and parents trust
            </h1>

            <ul className="space-y-4 text-lg text-gray-100">
              {[
                "Unlimited access to 4,000+ games & activities",
                "Personalized daily learning path",
                "Meaningful screen time",
                "Add up to 3 children accounts",
                "Insightful and actionable reports",
                "Compatible with multiple devices",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={16} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6">
              <Link href="/signup" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Sign up for free
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}