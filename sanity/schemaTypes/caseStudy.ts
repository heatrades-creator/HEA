import { defineType, defineField } from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Studies',
  type: 'document',
  fields: [
    defineField({ name: 'location', title: 'Suburb', type: 'string' }),
    defineField({ name: 'homeType', title: 'Home Type', type: 'string', description: 'e.g. "4-bed family home"' }),
    defineField({ name: 'goal', title: 'Customer Goal', type: 'string', description: 'e.g. "Reduce $3,800/yr electricity bill"' }),
    defineField({ name: 'system', title: 'System Installed', type: 'string', description: 'e.g. "10 kW solar + 10 kWh battery"' }),
    defineField({ name: 'outcome', title: 'Outcome / Result', type: 'string', description: 'e.g. "Bill reduced from $3,800 to $420/yr"' }),
    defineField({
      name: 'photo',
      title: 'Install Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'ready', title: 'Ready to Publish', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 99 }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'location', subtitle: 'system' },
  },
})
