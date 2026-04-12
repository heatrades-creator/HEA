"use client";
import React from "react";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
}

interface TestimonialsProps {
  data?: Testimonial[] | null;
}

const defaultTestimonials = [
  {
    name: "Sarah Mitchell",
    location: "Residential Client",
    rating: 5,
    text: "The smart home installation exceeded our expectations. Everything works seamlessly and the team was incredibly professional.",
  },
  {
    name: "David Chen",
    location: "Business Owner",
    rating: 5,
    text: "Our office automation project was completed on time and under budget. The energy savings have been remarkable.",
  },
  {
    name: "Emma Thompson",
    location: "Solar Customer",
    rating: 5,
    text: "From consultation to installation, the solar panel project was handled expertly. We're already seeing significant savings!",
  },
];

const Testimonials = ({ data }: TestimonialsProps) => {
  const testimonials = data || defaultTestimonials;
  return (
    <section id="testimonials" className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Client Reviews
          </h2>
          <p className="text-xl text-slate-600">
            See what our customers say about us
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-slate-600 mb-6 italic">"{testimonial.text}"</p>
              <div>
                <div className="font-bold text-slate-900">
                  {testimonial.name}
                </div>
                <div className="text-sm text-slate-500">
                  {testimonial.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
