import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(client)

function urlFor(source: any) {
  return builder.image(source).url()
}

export async function getSiteContent() {
  const [
    hero,
    serviceDoc,
    testimonialDoc,
    whyChooseUsDoc,
    about,
    contact,
    footer,
    caseStudies,
    pricingPackages,
    articles,
    faqItems,
  ] = await Promise.all([
    client.fetch(`*[_type == "hero" && _id == "hero"][0]{
      tagline, heading, description, ctaText, secondaryCtaText, stats[]{value, label}
    }`),
    client.fetch(`*[_type == "service" && _id == "service"][0]{
      services[]{title, description, icon, bgImage, features}
    }`),
    client.fetch(`*[_type == "testimonial" && _id == "testimonial"][0]{
      testimonials[]{name, location, rating, text}
    }`),
    client.fetch(`*[_type == "whyChooseUs" && _id == "whyChooseUs"][0]{
      items[]{title, description, icon}
    }`),
    client.fetch(`*[_type == "about" && _id == "about"][0]{
      heading, paragraph1, paragraph2, paragraph3, certifications
    }`),
    client.fetch(`*[_type == "contact" && _id == "contact"][0]{
      heading, subheading, phone, email, liveChat, serviceArea, mapEmbedUrl, businessHours{weekday, saturday, sunday}
    }`),
    client.fetch(`*[_type == "footer" && _id == "footer"][0]{
      tagline, phone, email, facebookUrl, instagramUrl, copyrightText
    }`),
    client.fetch(`*[_type == "caseStudy"] | order(order asc){
      location, homeType, goal, system, outcome, photo, ready, order
    }`),
    client.fetch(`*[_type == "pricingPackage"] | order(order asc){
      name, tagline, specs, fromPrice, features, highlight, order
    }`),
    client.fetch(`*[_type == "article"] | order(publishedAt desc)[0...6]{
      title, "slug": slug.current, category, excerpt, readTime, publishedAt
    }`),
    client.fetch(`*[_type == "faqItem"] | order(order asc){
      question, answer, order
    }`),
  ])

  // Transform image refs to URL strings for services
  const services = serviceDoc?.services?.map((s: any) => ({
    ...s,
    bgImage: s.bgImage ? urlFor(s.bgImage) : '',
  })) || []

  // Transform case study photos to URLs
  const caseStudiesWithPhotos = (caseStudies || []).map((cs: any) => ({
    ...cs,
    photo: cs.photo ? urlFor(cs.photo) : null,
  }))

  return {
    hero: hero || null,
    services,
    testimonials: testimonialDoc?.testimonials || [],
    whyChooseUs: whyChooseUsDoc?.items || [],
    about: about || null,
    contact: contact || null,
    footer: footer || null,
    caseStudies: caseStudiesWithPhotos,
    pricingPackages: pricingPackages || [],
    articles: articles || [],
    faqItems: faqItems || [],
  }
}
