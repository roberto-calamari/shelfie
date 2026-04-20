import { z } from 'zod';

export const searchRequestSchema = z.object({
  query: z.string().min(1).max(200),
});

export const storyStyleSchema = z.enum(['dreamy', 'retro', 'cinematic']);

export const colorPaletteSchema = z.object({
  dominant: z.string(),
  vibrant: z.string(),
  muted: z.string(),
  darkMuted: z.string(),
  lightMuted: z.string(),
  textColor: z.string(),
  textSecondary: z.string(),
});

export const storySceneSchema = z.object({
  coverUrl: z.string().min(1),
  coverWidth: z.number().positive(),
  coverHeight: z.number().positive(),
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(300),
  rating: z.number().min(0).max(5).optional(),
  finishedDate: z.string().optional(),
  style: storyStyleSchema,
  palette: colorPaletteSchema,
  showBranding: z.boolean(),
});

export const exportRequestSchema = z.object({
  scene: storySceneSchema,
});
