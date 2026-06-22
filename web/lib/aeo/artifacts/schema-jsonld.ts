import type { BrandConfig } from '../types';

export interface SchemaInput {
  config: BrandConfig;
  description?: string;
  founderName?: string;
  founderTitle?: string;
  founderUrl?: string;
  sampleArticle?: { title: string; url: string; datePublished?: string; dateModified?: string; authorName?: string };
}

export interface SchemaOutput {
  organization: Record<string, unknown>;
  person: Record<string, unknown> | null;
  article: Record<string, unknown> | null;
  combined: string;
}

export function generateSchemaJsonLd(input: SchemaInput): SchemaOutput {
  const { config } = input;
  const url = `https://${config.domain}`;

  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.brandName,
    url,
    ...(config.logoPath ? { logo: config.logoPath } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(config.contact?.email ? { email: config.contact.email } : {}),
    sameAs: [],
  };

  const person = input.founderName
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: input.founderName,
        ...(input.founderTitle ? { jobTitle: input.founderTitle } : {}),
        ...(input.founderUrl ? { url: input.founderUrl } : {}),
        worksFor: { '@type': 'Organization', name: config.brandName, url },
      }
    : null;

  const article = input.sampleArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: input.sampleArticle.title,
        url: input.sampleArticle.url,
        ...(input.sampleArticle.datePublished ? { datePublished: input.sampleArticle.datePublished } : {}),
        ...(input.sampleArticle.dateModified ? { dateModified: input.sampleArticle.dateModified } : {}),
        author: {
          '@type': 'Person',
          name: input.sampleArticle.authorName ?? input.founderName ?? config.brandName,
        },
        publisher: {
          '@type': 'Organization',
          name: config.brandName,
          ...(config.logoPath
            ? { logo: { '@type': 'ImageObject', url: config.logoPath } }
            : {}),
        },
      }
    : null;

  const blocks: string[] = [];
  blocks.push(formatScript(organization));
  if (person) blocks.push(formatScript(person));
  if (article) blocks.push(formatScript(article));

  return { organization, person, article, combined: blocks.join('\n\n') };
}

function formatScript(obj: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}
