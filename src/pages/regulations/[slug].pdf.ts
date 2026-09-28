import { readFile } from 'node:fs/promises';

import type { APIContext, GetStaticPaths } from 'astro';

import { categories } from '../../data/categories';

export const prerender = true;

const allowedSlugs = new Set(categories.map((category) => category.slug));

export const getStaticPaths = (() =>
  categories.map((category) => ({
    params: { slug: category.slug },
  }))) satisfies GetStaticPaths;

export async function GET({ params }: APIContext): Promise<Response> {
  const { slug } = params;

  if (!slug || !allowedSlugs.has(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const pdfUrl = new URL(
    `../../../../docs/sources/regulations/${slug}.pdf`,
    import.meta.url,
  );

  const pdfBuffer = await readFile(pdfUrl);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
