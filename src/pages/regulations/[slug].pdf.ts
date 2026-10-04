import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

  // Esta ruta se prerenderiza: dev y build leen desde la raíz del proyecto,
  // sin depender de la ubicación del módulo compilado por Astro.
  const pdfPath = resolve('docs/sources/regulations', `${slug}.pdf`);

  const pdfBuffer = await readFile(pdfPath);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
