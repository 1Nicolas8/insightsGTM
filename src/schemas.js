import { z } from 'zod'

const MAX_BUSINESSES = Number(process.env.MAX_BUSINESSES_PER_REQUEST || 500)

const numLike = z.union([z.number(), z.string()]).nullable().optional()
const boolLike = z.union([z.boolean(), z.string()]).nullable().optional()
const strN = z.string().nullable().optional()

const socialLegacySchema = z
  .object({
    instagram: strN,
    facebook: strN,
    linkedin: strN,
    tiktok: strN,
  })
  .partial()
  .nullable()
  .optional()

const businessSchema = z
  .object({
    name: z.string().min(1, 'name es obligatorio'),
    category: z.string().min(1, 'category es obligatorio'),
    subcategory: strN,
    zone: strN,
    city: strN,
    country: strN,
    address: strN,
    latitude: numLike,
    longitude: numLike,
    phone: strN,
    whatsapp: strN,
    email: strN,
    website: strN,
    instagram: strN,
    facebook: strN,
    linkedin: strN,
    tiktok: strN,
    google_place_id: strN,
    google_maps_url: strN,
    rating: numLike,
    ratings_count: numLike,
    reviews_count: numLike,
    price_level: numLike,
    photos_count: numLike,
    hours: strN,
    verified: boolLike,
    source: strN,
    status: strN,
    notes: strN,
    social_media: socialLegacySchema,
  })
  .passthrough()

const productContextSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    target_industry: z.string().optional(),
    price_range: z.string().optional(),
    value_proposition: z.string().optional(),
  })
  .partial()
  .optional()

export const inputSchema = z
  .object({
    category: z.string().min(1, 'category es obligatorio'),
    zone: strN,
    city: strN,
    country: strN,
    icp_description: z.string().min(1, 'icp_description es obligatorio'),
    product_context: productContextSchema,
    existing_businesses: z
      .array(businessSchema)
      .max(MAX_BUSINESSES, `máximo ${MAX_BUSINESSES} businesses por request`)
      .optional(),
    businesses: z
      .array(businessSchema)
      .max(MAX_BUSINESSES, `máximo ${MAX_BUSINESSES} businesses por request`)
      .optional(),
    query: z.any().optional(),
    stats: z.any().optional(),
  })
  .passthrough()
  .refine(
    (data) =>
      (Array.isArray(data.existing_businesses) && data.existing_businesses.length > 0) ||
      (Array.isArray(data.businesses) && data.businesses.length > 0),
    {
      message: 'Debes enviar existing_businesses (o businesses) como array no vacío',
      path: ['existing_businesses'],
    }
  )

export default inputSchema
