"use client";
import React, { useEffect, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { HEA_GOOGLE_REVIEWS_URL } from "@/lib/constants";

type Review = { name: string; text: string; stars: number; time?: string };

const FALLBACK_REVIEWS: Review[] = [
  {
    name: "Sarah M.",
    text: "Jesse was straight with us from day one — sized the system properly instead of upselling. Our bills are down by more than he projected.",
    stars: 5,
  },
  {
    name: "Dave K.",
    text: "No rubbish, no middlemen. Jesse turned up, installed it, and it works exactly as quoted. Couldn't ask for more.",
    stars: 5,
  },
  {
    name: "Tracey B.",
    text: "Finally an installer who explained what data he was using to size our system. We knew exactly what we were getting before he started.",
    stars: 5,
  },
];

const SocialProofBar = () => {
  const [rating, setRating] = useState<number>(5.0);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.rating) setRating(data.rating);
        if (data.reviewCount) setReviewCount(data.reviewCount);
        if (data.reviews?.length >= 3) setReviews(data.reviews);
      })
      .catch(() => {
        // silently keep fallback data
      });
  }, []);

  return (
    <section className="py-16 px-4 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Google Rating Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-1.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {rating.toFixed(1)} on Google
            </p>
            <a
              href={HEA_GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-yellow-600 transition-colors flex items-center gap-1 mt-0.5"
            >
              {reviewCount ? `${reviewCount} reviews` : "Read our Google reviews"}{" "}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="hidden sm:block w-px h-14 bg-slate-200" />

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-2xl font-bold text-slate-900">Bendigo Local</p>
            <p className="text-sm text-slate-500">Solar & battery installer</p>
          </div>

          <div className="hidden sm:block w-px h-14 bg-slate-200" />

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-2xl font-bold text-slate-900">REC 37307</p>
            <p className="text-sm text-slate-500">Licensed & insured in Victoria</p>
          </div>

          <div className="hidden sm:block w-px h-14 bg-slate-200" />

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-2xl font-bold text-slate-900">&lt; 10yr</p>
            <p className="text-sm text-slate-500">Target payback on every job</p>
          </div>
        </div>

        {/* Review Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(r.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <div>
                <p className="text-slate-900 font-semibold text-sm">{r.name}</p>
                {r.time && (
                  <p className="text-slate-400 text-xs">{r.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Manufacturer / brand trust strip */}
        <div className="mt-10 mb-8 border-t border-slate-200 pt-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
            Brands we install
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Fronius", "Enphase", "SolarEdge", "BYD", "Alpha ESS"].map((brand) => (
              <span
                key={brand}
                className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 text-sm font-medium"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href={HEA_GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors border border-slate-200 hover:border-yellow-400 rounded-lg px-5 py-2.5"
          >
            See all Google reviews <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar;
