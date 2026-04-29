import { z } from 'zod';

export const idSchema = z.string().min(1);

export const metadataSchema = z.object({
  template: z.object({
    before: z.string(),
    after: z.string(),
  }),
  id: z.string(),
});

export type Metadata = z.infer<typeof metadataSchema>;

export const requestDetailsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  headers: z.object({
    authorization: z.string().min(1),
  }),
});

export type RequestDetails = z.infer<typeof requestDetailsSchema>;

export const metadataObjectSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.record(z.string(), z.any())),
  ])
);

export type MetadataObject = z.infer<typeof metadataObjectSchema>;
