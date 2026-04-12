"use client";
import React from "react";
import { Star, ExternalLink } from "lucide-react";

const GoogleReviews = () => {
  return (
    <section id="reviews" className="py-20 px-4 bg-heffblack text-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-6 h-6 fill-heffdark text-heffdark" />
          ))}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Don&apos;t take our word for it
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
          See what Bendigo homeowners say about their solar systems — real reviews,
          straight from Google.
        </p>
        <a
          href="https://g.page/r/CSOEwnVc3aFIEBE/review"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-heffdark text-heffblack font-bold px-10 py-4 rounded-xl text-lg
            hover:scale-105 hover:shadow-2xl transition-all duration-200"
        >
          Read Our Google Reviews
          <ExternalLink className="w-5 h-5" />
        </a>
        <p className="text-slate-600 text-sm mt-6">
          Opens Google — no account needed to read reviews
        </p>
      </div>
    </section>
  );
};

export default GoogleReviews;
