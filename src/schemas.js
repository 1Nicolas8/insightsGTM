import { z } from 'zod'

const MAX_BUSINESSES = Number(process.env.MAX_BUSINESSES_PER_REQUEST || 500)

const socialMediaSchema = z
  .object({
    instagram: z.string().nullable().optional(),
    facebook: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
  })
  .partial()
  .nullable()
  .optional()

const businessSchema = z.object({
  name: z.string().min(1, 'name es obligatorio'),
  category: z.string().min(1, 'category es obligatorio'),
  subcategory: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  rating: z.union([z.number(), z.string()]).nullable().optional(),
  reviews_count: z.union([z.number(), z.string()]).nullable().optional(),
  price_level: z.union([z.number(), z.string()]).nullable().optional(),
  hours: z.string().nullable().optional(),
  photos_count: z.union([z.number(), z.string()]).nullable().optional(),
  verified: z.union([z.boolean(), z.string()]).nullable().optional(),
  social_media: socialMediaSchema,
})

const productContextSchema = z.object({
  name: z.string().min(1, 'product_context.name es obligatorio'),
  description: z.string().min(1, 'product_context.description es obligatorio'),
  target_industry: z.string().min(1, 'product_context.target_industry es obligatorio'),
  price_range: z.string().min(1, 'product_context.price_range es obligatorio'),
  value_proposition: z.string().min(1, 'product_context.value_proposition es obligatorio'),
})

export const inputSchema = z.object({
  product_context: productContextSchema,
  businesses: z
    .array(businessSchema)
    .min(1, 'businesses no puede estar vacío')
    .max(MAX_BUSINESSES, `máximo ${MAX_BUSINESSES} businesses por request`),
})

export default inputSchema
