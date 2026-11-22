"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderArchive,
  Download,
  FileCode2,
  BookOpenText,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DigitalProductsCatalog() {
  const [products] = useState([
    {
      title: "The Ultimate Guide Blueprint",
      type: "E-Book (PDF)",
      price: "$29",
      desc: "A comprehensive, step-by-step master book mapping out the exact formulas and strategies used by top industry professionals.",
      rating: "5.0",
      reviews: 48,
      icon: <BookOpenText className="w-5 h-5 text-orange-400" />,
      tag: "Best Seller",
    },
    {
      title: "Premium Component & Code Toolkit",
      type: "Source Files",
      price: "$49",
      desc: "Ready-to-deploy architectural file templates, production layouts, and clean utility boilerplates optimized for rapid scaling.",
      rating: "4.9",
      reviews: 32,
      icon: <FileCode2 className="w-5 h-5 text-orange-400" />,
      tag: "Popular",
    },
    {
      title: "Strategic Action Checklists",
      type: "Resource Assets",
      price: "$19",
      desc: "High-density checklist planners, milestone sheets, and calculator sheets to systematic track execution parameters.",
      rating: "5.0",
      reviews: 19,
      icon: <FolderArchive className="w-5 h-5 text-orange-400" />,
      tag: "New",
    },
  ]);

  return (
    <section className="relative overflow-hidden py-24 bg-background text-white">
      {/* Blueprint Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Cybernetic Core Lighting Glows */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-160 h-160 bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto max-w-7xl px-6 lg:px-12 z-10">
        {/* Header Block */}
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400">
            <Download className="w-3.5 h-3.5" />
            <span>Instant Access Resources</span>
          </div>

          <h1 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            Skip the boilerplate. <br />
            Accelerate with{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-amber-200 to-white">
              Premium Assets.
            </span>
          </h1>

          <p className="text-neutral-400 text-base max-w-2xl mx-auto">
            Level up your workflow instantly. Discover curated, expert-vetted
            digital tools, code repositories, frameworks, and resource toolkits
            built to save you thousands of execution hours.
          </p>
        </div>

        {/* Product Catalog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-800/80 bg-neutral-950/40 p-8 backdrop-blur-xl transition-all duration-500 ease-out hover:border-neutral-700 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)]"
            >
              <div>
                {/* Card Top Utility Bar */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {product.icon}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400/80 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-md">
                    {product.tag}
                  </span>
                </div>

                {/* Rating Node */}
                <div className="flex items-center gap-1.5 mb-3 text-xs font-mono text-neutral-400">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-neutral-200 font-bold">
                    {product.rating}
                  </span>
                  <span>({product.reviews} downloads)</span>
                </div>

                {/* Title and Meta */}
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors duration-300">
                  {product.title}
                </h3>
                <span className="text-xs font-mono text-neutral-500 block mb-4">
                  Asset Classification: {product.type}
                </span>

                {/* Description Description */}
                <p className="text-sm text-neutral-400 leading-relaxed font-light mb-8">
                  {product.desc}
                </p>
              </div>

              {/* Pricing and Action Strip */}
              <div className="pt-6 border-t border-neutral-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block tracking-wider">
                    One-Time Purchase
                  </span>
                  <span className="text-2xl font-black text-white">
                    {product.price}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-neutral-800 border border-neutral-700 text-white hover:bg-orange-500 hover:border-orange-400 transition-all duration-300 group/btn"
                  asChild
                >
                  <Link href={`/shop/checkout-${idx}`}>
                    <span>Download</span>
                    <Download className="w-3.5 h-3.5 ml-2 transition-transform duration-300 group-hover/btn:translate-y-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
