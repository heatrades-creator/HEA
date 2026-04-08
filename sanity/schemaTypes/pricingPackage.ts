import { defineType, defineField } from 'sanity'

export const pricingPackage = defineType({
  name: 'pricingPackage',
  title: 'Pricing Packages',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Package Name', type: 'string', description: 'e.g. "Solar Starter"' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', description: 'e.g. "Minimise your bill"' }),
    defineField({ name: 'specs', title: 'System Specs', type: 'string', description: 'e.g. "6.6 kW solar · grid-connect"' }),
    defineField({
      name: 'fromPrice',
      title: 'From Price (AUD, no symbol)',
      type: 'string',
      description: 'e.g. "4,990" — leave blank to show "Price on request"',
    }),
    defineField({
      name: 'features',
      title: 'Feature List',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'highlight', title: 'Highlight (Most Popular)', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 99 }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'fromPrice' },
    prepare({ title, subtitle }: { title: string; subtitle: string }) {
      return { title, subtitle: subtitle ? `From $${subtitle}` : 'Price on request' }
    },
  },
})
