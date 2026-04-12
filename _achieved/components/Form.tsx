'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Send,
  User,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  X,
  Zap,
  Sun,
  Battery,
} from "lucide-react";

const SOLAR_TIERS = [
  {
    id: "small",
    name: "Small System",
    intent: "Minimise your bill",
    specs: ["5 kW Inverter", "6.6 kW Solar Array"],
    icon: "Zap",
  },
  {
    id: "medium",
    name: "Medium System",
    intent: "Replace your bill",
    specs: ["5 kW Inverter", "Maximum Roof Space"],
    icon: "Sun",
    popular: true,
  },
  {
    id: "large",
    name: "Large System",
    intent: "Build an asset",
    specs: ["10 kW Solar", "42 kW Battery Storage"],
    icon: "Battery",
  },
];

const ModernContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
    solarTier: "",
  });

  const [focused, setFocused] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Accessibility features for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    // Validate fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.service ||
      !formData.message
    ) {
      alert("Please fill in all fields");
      return;
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          service: "",
          message: "",
          solarTier: "",
        });
        alert("Thank you! We'll contact you soon.");
      } else {
        // Optionally parse error message from server
        const data = await response.json();
        setSubmitStatus("error");
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setSubmitStatus("error");
      alert("Failed to send message. Please try again.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-heffdark">
        {/* Header Ribbon */}
        <div className="space-y-6">
          {/* Name Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused("")}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-300 text-slate-700 placeholder-slate-400 ${
                  focused === "name"
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                placeholder="Name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-300 text-slate-700 placeholder-slate-400 ${
                  focused === "email"
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused("")}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-300 text-slate-700 placeholder-slate-400  ${
                  focused === "phone"
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                placeholder="0412345678"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Service Select */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Service Interested In
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Briefcase className="w-5 h-5" />
              </div>
              <select
                value={formData.service}
                onChange={(e) => {
                  const selectedService = e.target.value;
                  setFormData({ ...formData, service: selectedService });

                  // Auto-open modal when solar is selected
                  if (selectedService === "solar") {
                    setIsModalOpen(true);
                  } else if (formData.service === "solar") {
                    // Clear solar tier when changing away from solar
                    setFormData((prev) => ({
                      ...prev,
                      service: selectedService,
                      solarTier: "",
                    }));
                  }
                }}
                onFocus={() => setFocused("service")}
                onBlur={() => setFocused("")}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-300 appearance-none cursor-pointer ${
                  focused === "service"
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                } ${!formData.service ? "text-slate-400" : "text-slate-900"}`}
                disabled={isSubmitting}
              >
                <option value="">Select a service</option>
                <option value="smart-home">Smart Home Automation</option>
                <option value="solar">Solar Installation</option>
                <option value="electrical">General Electrical</option>
                <option value="ev">EV Charger</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Solar Field selected */}
          {formData.service === "solar" && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              {formData.solarTier ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Selected:{" "}
                      {
                        SOLAR_TIERS.find((t) => t.id === formData.solarTier)
                          ?.name
                      }
                    </p>
                    <p className="text-xs text-slate-600">
                      {
                        SOLAR_TIERS.find((t) => t.id === formData.solarTier)
                          ?.intent
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Change Selection
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Solar system tier (optional)
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Select Tier
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              Your Message
            </label>
            <div className="relative">
              <div className="absolute left-4 top-4 text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused("")}
                rows={5}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl outline-none transition-all duration-300 resize-none text-slate-700 placeholder-slate-400 ${
                  focused === "message"
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                placeholder="Tell us about your project..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl hover:shadow-blue-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Success/Error Message */}
          {submitStatus === "success" && (
            <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-semibold">
                  Message sent successfully! We'll be in touch soon.
                </span>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="font-semibold">
                  Something went wrong. Please try again.
                </span>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <p className="text-center text-sm text-slate-500 mt-4">
            We'll get back to you within 24 hours. Your information is secure
            and private.
          </p>
        </div>
      </div>

      {/* Solar Tier Selection Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-heffdark max-w-4xl w-full max-h-[75vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Choose Your Solar System
                </h2>
                <p className="text-slate-600 mt-1">
                  Select the option that best fits your energy goals
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tier Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {SOLAR_TIERS.map((tier) => {
                const Icon =
                  tier.icon === "Zap"
                    ? Zap
                    : tier.icon === "Sun"
                      ? Sun
                      : Battery;
                const isSelected = formData.solarTier === tier.id;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, solarTier: tier.id });
                      setIsModalOpen(false);
                    }}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 text-left ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-lg"
                        : "border-slate-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100"
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Popular
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center space-y-4">
                      <Icon className="w-12 h-12 text-blue-600" />

                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {tier.intent}
                        </h3>
                        <div className="h-px bg-slate-300 mb-3" />
                        <p className="font-semibold text-slate-700 mb-2">
                          {tier.name}
                        </p>
                        <ul className="space-y-1">
                          {tier.specs.map((spec, idx) => (
                            <li key={idx} className="text-sm text-slate-600">
                              {spec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-200 p-6 text-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 transition-colors font-semibold"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernContactForm;
