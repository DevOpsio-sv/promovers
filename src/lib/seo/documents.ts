import { NOT_FOUND_DESCRIPTION, NOT_FOUND_TITLE, SITE_NAME } from "../config/site.ts";

export function escapeAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

export function alignDocument(
  html: string,
  options: { canonical: string; image: string; robots: string },
): string {
  const canonical = escapeAttr(options.canonical);
  const image = escapeAttr(options.image);
  const robots = escapeAttr(options.robots);
  const previous = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  let next = html
    .replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="${robots}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`)
    .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`)
    .replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${image}"`);
  const previousOrigin = originOf(decodeAttr(previous));
  const nextOrigin = originOf(options.canonical);
  if (previousOrigin && nextOrigin && previousOrigin !== nextOrigin) {
    next = next.replaceAll(previousOrigin, nextOrigin);
  }
  return next;
}

export function notFoundHtml(): string {
  const title = escapeAttr(NOT_FOUND_TITLE);
  const description = escapeAttr(NOT_FOUND_DESCRIPTION);
  return `<!doctype html>
<html lang="bg">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <main>
      <h1>Страницата не е намерена</h1>
      <p>Този адрес не води към страница на ${SITE_NAME}.</p>
      <p><a href="/">Към началната страница</a></p>
    </main>
  </body>
</html>`;
}

function decodeAttr(value: string): string {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&lt;", "<");
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
