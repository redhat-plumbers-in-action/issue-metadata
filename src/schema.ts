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

export const requestDetailsSchema = z.object(
  {
    owner: z.string().min(1),
    repo: z.string().min(1),
  },
  {
    required_error: `Required settings wasn't provided: {owner: string, repo: string}`,
  }
);

export type RequestDetails = z.infer<typeof requestDetailsSchema>;
