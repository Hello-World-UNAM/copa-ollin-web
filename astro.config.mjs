import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * Los seis reglamentos en `docs/regulations/*.md` comparten el mismo
 * encabezado de nivel 1 ("# Reglamento técnico y de competencia"). Cada
 * página de categoría (`src/pages/categorias/[slug].astro`) ya define su
 * propio `<h1>` con el nombre de la categoría, así que este plugin desplaza
 * en un nivel los encabezados Markdown renderizados para que la página
 * conserve un único `h1` (regla de accesibilidad de DESIGN.md). No se
 * modifica el archivo fuente, sólo el HTML generado al renderizarlo.
 */
function shiftMarkdownHeadings() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const level = Number(node.tagName.slice(1));
        node.tagName = `h${Math.min(level + 1, 6)}`;
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

/**
 * Cada reglamento abre con una cita editorial ("> Transcripción normalizada.
 * Consulta el [PDF fuente](../sources/regulations/<slug>.pdf).") cuyo enlace
 * es relativo a la carpeta `docs/` y queda roto al renderizarse dentro de la
 * ruta `/categorias/<slug>`. La página ya repite la misma información con un
 * botón "Descargar reglamento... (PDF)" que sí resuelve a la URL correcta
 * (ver `src/pages/categorias/[slug].astro`), así que este plugin quita sólo
 * esa cita redundante del HTML renderizado. No se toca ninguna medida,
 * fecha, consentimiento o regla de competencia: sólo el aviso editorial.
 */
function stripTranscriptionNotice() {
  const toText = (node) => {
    if (node.type === 'text') return node.value;
    if (!Array.isArray(node.children)) return '';
    return node.children.map(toText).join('');
  };

  return (tree) => {
    const removeNotice = (node) => {
      if (!Array.isArray(node.children)) return;

      node.children = node.children.filter((child) => {
        if (child.type !== 'element' || child.tagName !== 'blockquote') {
          return true;
        }

        return !toText(child).includes('Transcripción normalizada');
      });

      node.children.forEach(removeNotice);
    };

    removeNotice(tree);
  };
}

function wrapRegulationSections() {
  return (tree) => {
    if (!Array.isArray(tree.children)) return;

    const children = [];
    let currentSection = null;

    tree.children.forEach((child) => {
      if (child.type === 'element' && child.tagName === 'h2') {
        currentSection = {
          type: 'element',
          tagName: 'section',
          properties: { className: ['regulation-section'] },
          children: [child],
        };
        children.push(currentSection);
        return;
      }

      if (currentSection) {
        currentSection.children.push(child);
      } else {
        children.push(child);
      }
    });

    tree.children = children;
  };
}

export default defineConfig({
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    rehypePlugins: [
      shiftMarkdownHeadings,
      stripTranscriptionNotice,
      wrapRegulationSections,
    ],
  },
});
