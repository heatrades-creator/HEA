import { defineType, defineField } from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'paragraph1', title: 'Paragraph 1', type: 'text' }),
    defineField({ name: 'paragraph2', title: 'Paragraph 2', type: 'text' }),
    defineField({ name: 'paragraph3', title: 'Paragraph 3', type: 'text' }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'teamPhoto',
      title: 'Team Photo (Jesse & Alexis)',
      type: 'image',
      options: { hotspot: true },
      description: 'Photo shown on the Why HEA page',
    }),
  ],
})
