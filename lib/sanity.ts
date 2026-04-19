import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-04-01',
  useCdn: true,
})

const builder = imageUrlBuilder(client)

function urlFor(source: any) {
  return builder.image(source).url()
}

export async function getFooterData() {
  try {
    const footer = await client.fetch(
      `*[_type == "footer" && _id == "footer"][0]{
        tagline, phone, email, facebookUrl, instagramUrl, copyrightText
      }`
    )
    return footer || null
  } catch {
    return null
  }
}

const EMPTY_CONTENT = {
  hero: null,
  services: [] as any[],
  testimonials: [] as any[],
  whyChooseUs: [] as any[],
  about: null,
  contact: null,
  footer: null,
  caseStudies: [] as any[],
  pricingPackages: [] as any[],
  articles: [] as any[],
  faqItems: [] as any[],
}

export async function getSiteContent() {
  try {
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
        heading, paragraph1, paragraph2, paragraph3, certifications, teamPhoto
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
        name, tagline, specs, fromPrice, features, highlight, category, order
      }`),
      client.fetch(`*[_type == "article"] | order(publishedAt desc)[0...6]{
        title, "slug": slug.current, category, excerpt, readTime, publishedAt
      }`),
      client.fetch(`*[_type == "faqItem"] | order(order asc){
        question, answer, order
      }`),
    ])

    const services = serviceDoc?.services?.map((s: any) => ({
      ...s,
      bgImage: s.bgImage ? urlFor(s.bgImage) : '',
    })) || []

    const caseStudiesWithPhotos = (caseStudies || []).map((cs: any) => ({
      ...cs,
      photo: cs.photo ? urlFor(cs.photo) : null,
    }))

    const aboutWithPhoto = about
      ? { ...about, teamPhotoUrl: about.teamPhoto ? urlFor(about.teamPhoto) : null }
      : null

    return {
      hero: hero || null,
      services,
      testimonials: testimonialDoc?.testimonials || [],
      whyChooseUs: whyChooseUsDoc?.items || [],
      about: aboutWithPhoto,
      contact: contact || null,
      footer: footer || null,
      caseStudies: caseStudiesWithPhotos,
      pricingPackages: pricingPackages || [],
      articles: articles || [],
      faqItems: faqItems || [],
    }
  } catch {
    return EMPTY_CONTENT
  }
}
