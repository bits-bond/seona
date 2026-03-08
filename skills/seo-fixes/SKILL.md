---
name: seo-fixes
description: >
  Automated SEO fix implementation — generates ready-to-deploy code for common
  SEO issues. Produces complete meta tags, Open Graph/Twitter Card tags, canonical
  tags, redirect rules (.htaccess and Cloudflare), hreflang implementation files,
  and CMS-specific patches for WordPress, Shopify, and Strapi. Use when user says
  "generate fixes", "fix implementation", "meta tags", "OG tags", "redirect rules",
  "hreflang implementation", "CMS patch", "auto fix", or "implementation code".
---

# Automated SEO Fix Implementation

Generate ready-to-deploy code and configuration files to fix common SEO issues identified during audits.

---

## Fix Generation Categories

### 1. Meta Tags (Title, Description, Canonical)

Generate optimized meta tags for every crawled page based on content analysis.

**Title tag rules:**
- Length: 50-60 characters (display limit ~580px)
- Format: `[Primary Keyword] - [Secondary Keyword] | [Brand Name]`
- Front-load the most important keyword
- Unique per page — no duplicates across the site

**Meta description rules:**
- Length: 150-160 characters
- Include primary keyword naturally
- Include a call-to-action or value proposition
- Unique per page

**Canonical tag rules:**
- Self-referencing canonical on every page
- HTTPS version always
- Consistent trailing slash usage
- No query parameters in canonical URLs

**Output format per page:**
```html
<!-- Page: /about -->
<title>About Us - Company Name | Industry Description</title>
<meta name="description" content="Learn about Company Name's 15+ years of experience in [industry]. Our team of [X] certified professionals delivers [service] to [target audience].">
<link rel="canonical" href="https://example.com/about">
```

### 2. Social Tags (Open Graph + Twitter Card)

Generate complete social sharing tags for every crawled page.

**Open Graph tags (required):**
```html
<meta property="og:title" content="[Page Title — 60-90 chars]">
<meta property="og:description" content="[Description — 150-200 chars]">
<meta property="og:url" content="[Canonical URL]">
<meta property="og:image" content="[Image URL — min 1200x630px]">
<meta property="og:type" content="[website|article|product]">
<meta property="og:locale" content="[en_US]">
<meta property="og:site_name" content="[Site Name]">
```

**Twitter Card tags (required):**
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Page Title — 60-70 chars]">
<meta name="twitter:description" content="[Description — 150-200 chars]">
<meta name="twitter:image" content="[Image URL — min 1200x628px]">
<meta name="twitter:image:alt" content="[Image alt text]">
```

**Additional OG tags (recommended for articles):**
```html
<meta property="article:published_time" content="[ISO 8601 date]">
<meta property="article:modified_time" content="[ISO 8601 date]">
<meta property="article:author" content="[Author URL or name]">
<meta property="article:section" content="[Category]">
```

### 3. Redirect Rules

Generate redirect configurations for common issues: HTTP→HTTPS, www→non-www (or vice versa), and custom redirects.

**Apache .htaccess format:**
```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Force non-www (remove www)
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [L,R=301]

# Force www (add www)
# RewriteCond %{HTTP_HOST} !^www\. [NC]
# RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]

# Trailing slash enforcement (add)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !(.*)/$
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1/ [L,R=301]

# Custom redirects (from audit findings)
# Redirect 301 /old-page https://example.com/new-page
```

**Nginx format:**
```nginx
server {
    # Force HTTPS
    listen 80;
    server_name example.com www.example.com;
    return 301 https://example.com$request_uri;
}

server {
    # Force non-www
    listen 443 ssl;
    server_name www.example.com;
    return 301 https://example.com$request_uri;
}

# Custom redirects
# location = /old-page { return 301 https://example.com/new-page; }
```

**Cloudflare Page Rules format:**
```
Rule 1: Force HTTPS
  URL: http://*example.com/*
  Setting: Always Use HTTPS

Rule 2: Force non-www
  URL: https://www.example.com/*
  Setting: Forwarding URL (301) → https://example.com/$1

Rule 3: Custom redirect
  URL: https://example.com/old-page
  Setting: Forwarding URL (301) → https://example.com/new-page
```

**Cloudflare _redirects file (for Pages):**
```
/old-page  /new-page  301
/blog/old-post  /blog/new-post  301
```

### 4. Hreflang Implementation

Generate hreflang tags based on detected language/region targets. Provide all three implementation formats.

**Format 1 — HTML link tags (recommended for <50 language versions):**
```html
<!-- Add to <head> of every page -->
<link rel="alternate" hreflang="en" href="https://example.com/page">
<link rel="alternate" hreflang="es" href="https://example.com/es/page">
<link rel="alternate" hreflang="fr" href="https://example.com/fr/page">
<link rel="alternate" hreflang="de" href="https://example.com/de/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

**Format 2 — HTTP headers (for non-HTML files like PDFs):**
```
Link: <https://example.com/page>; rel="alternate"; hreflang="en",
      <https://example.com/es/page>; rel="alternate"; hreflang="es",
      <https://example.com/fr/page>; rel="alternate"; hreflang="fr",
      <https://example.com/page>; rel="alternate"; hreflang="x-default"
```

**Format 3 — XML sitemap (recommended for 50+ language versions):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/page"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://example.com/fr/page"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page"/>
  </url>
  <url>
    <loc>https://example.com/es/page</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/page"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://example.com/fr/page"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page"/>
  </url>
</urlset>
```

**Hreflang validation rules:**
- Every page must reference itself
- All pages must use bidirectional references (A→B and B→A)
- Always include `x-default` for language/region selector or fallback
- Use ISO 639-1 language codes (en, es, fr, de)
- Use ISO 3166-1 alpha-2 for regions (en-US, en-GB, es-MX)
- All URLs must be absolute (fully qualified)

### 5. CMS-Specific Patches

#### WordPress (functions.php / Plugin)

**Meta tags via functions.php:**
```php
<?php
/**
 * SEO Meta Tags — Generated by SEONA Audit
 * Add to theme's functions.php or create as mu-plugin in wp-content/mu-plugins/
 */

// Remove default WordPress title
remove_action('wp_head', '_wp_render_title_tag', 1);

add_action('wp_head', 'seona_meta_tags', 1);
function seona_meta_tags() {
    // Skip if Yoast, Rank Math, or AIOSEO is active
    if (defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION')) {
        return;
    }

    $meta = seona_get_page_meta();
    if (!$meta) return;

    echo '<title>' . esc_html($meta['title']) . '</title>' . "\n";
    echo '<meta name="description" content="' . esc_attr($meta['description']) . '">' . "\n";
    echo '<link rel="canonical" href="' . esc_url($meta['canonical']) . '">' . "\n";

    // Open Graph
    echo '<meta property="og:title" content="' . esc_attr($meta['og_title']) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr($meta['og_description']) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url($meta['canonical']) . '">' . "\n";
    echo '<meta property="og:type" content="' . esc_attr($meta['og_type']) . '">' . "\n";
    echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">' . "\n";

    if (!empty($meta['og_image'])) {
        echo '<meta property="og:image" content="' . esc_url($meta['og_image']) . '">' . "\n";
    }

    // Twitter Card
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr($meta['og_title']) . '">' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr($meta['og_description']) . '">' . "\n";

    if (!empty($meta['og_image'])) {
        echo '<meta name="twitter:image" content="' . esc_url($meta['og_image']) . '">' . "\n";
    }
}

function seona_get_page_meta() {
    // Map of page paths to meta data
    // Replace with audit-generated values
    $meta_map = array(
        '/' => array(
            'title' => '[Homepage Title]',
            'description' => '[Homepage Description]',
            'canonical' => '[Homepage URL]',
            'og_title' => '[OG Title]',
            'og_description' => '[OG Description]',
            'og_type' => 'website',
            'og_image' => '[OG Image URL]',
        ),
        // Add more pages from audit results
    );

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = rtrim($path, '/') ?: '/';

    return isset($meta_map[$path]) ? $meta_map[$path] : null;
}
?>
```

**Redirect rules for WordPress (.htaccess):**
```apache
# Add BEFORE the WordPress rewrite block
# BEGIN SEO Redirects
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
# END SEO Redirects

# BEGIN WordPress
# ... existing WordPress rules ...
# END WordPress
```

**Plugin recommendation:** For sites preferring plugins over custom code, recommend:
- **Rank Math** (free, comprehensive) or **Yoast SEO** (most popular)
- Provide the audit-generated meta values as a CSV import for bulk updating

#### Shopify (theme.liquid)

**Meta tags in theme.liquid:**
```liquid
{%- comment -%} SEO Meta Tags — Generated by SEONA Audit {%- endcomment -%}

{%- if template == 'index' -%}
  <title>{{ shop.name }} — [Homepage Tagline]</title>
  <meta name="description" content="[Homepage description — 150-160 chars]">
{%- elsif template contains 'product' -%}
  <title>{{ product.title }} — {{ shop.name }}</title>
  <meta name="description" content="{{ product.description | strip_html | truncate: 160 }}">
{%- elsif template contains 'collection' -%}
  <title>{{ collection.title }} — {{ shop.name }}</title>
  <meta name="description" content="{{ collection.description | strip_html | truncate: 160 }}">
{%- elsif template contains 'page' -%}
  <title>{{ page.title }} — {{ shop.name }}</title>
  <meta name="description" content="{{ page.content | strip_html | truncate: 160 }}">
{%- elsif template == 'blog' -%}
  <title>{{ blog.title }} — {{ shop.name }}</title>
  <meta name="description" content="Read the latest articles from {{ shop.name }}.">
{%- elsif template == 'article' -%}
  <title>{{ article.title }} — {{ blog.title }} | {{ shop.name }}</title>
  <meta name="description" content="{{ article.excerpt_or_content | strip_html | truncate: 160 }}">
{%- else -%}
  <title>{{ page_title }} — {{ shop.name }}</title>
{%- endif -%}

<link rel="canonical" href="{{ canonical_url }}">

{%- comment -%} Open Graph Tags {%- endcomment -%}
<meta property="og:site_name" content="{{ shop.name }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:locale" content="{{ request.locale.iso_code | replace: '-', '_' }}">

{%- if template contains 'product' -%}
  <meta property="og:type" content="product">
  <meta property="og:title" content="{{ product.title }}">
  <meta property="og:description" content="{{ product.description | strip_html | truncate: 200 }}">
  {%- if product.featured_image -%}
    <meta property="og:image" content="https:{{ product.featured_image | image_url: width: 1200 }}">
  {%- endif -%}
{%- elsif template == 'article' -%}
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{ article.title }}">
  <meta property="og:description" content="{{ article.excerpt_or_content | strip_html | truncate: 200 }}">
  {%- if article.image -%}
    <meta property="og:image" content="https:{{ article.image | image_url: width: 1200 }}">
  {%- endif -%}
  <meta property="article:published_time" content="{{ article.published_at | date: '%Y-%m-%dT%H:%M:%S%z' }}">
{%- else -%}
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{ page_title }}">
  <meta property="og:description" content="{{ page_description | escape }}">
{%- endif -%}

{%- comment -%} Twitter Card {%- endcomment -%}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title }}">
<meta name="twitter:description" content="{{ page_description | escape }}">
```

**Shopify redirects:**
```
Shopify Admin → Settings → Navigation → URL Redirects
/old-page → /new-page

Or via Shopify CLI / API:
POST /admin/api/2024-01/redirects.json
{
  "redirect": {
    "path": "/old-page",
    "target": "/new-page"
  }
}
```

#### Strapi (Middleware Configuration)

**Security headers middleware (./config/middlewares.js):**
```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'frame-ancestors': ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xframe: 'DENY',
      xss: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

**SEO meta fields for Strapi content types:**
```javascript
// Add to content type schema (e.g., ./src/api/page/content-types/page/schema.json)
{
  "attributes": {
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
}

// Create SEO component (./src/components/shared/seo.json)
{
  "collectionName": "components_shared_seos",
  "info": {
    "displayName": "SEO",
    "icon": "search"
  },
  "attributes": {
    "metaTitle": {
      "type": "string",
      "maxLength": 60
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 160
    },
    "canonicalURL": {
      "type": "string"
    },
    "ogImage": {
      "type": "media",
      "allowedTypes": ["images"],
      "multiple": false
    },
    "ogType": {
      "type": "enumeration",
      "enum": ["website", "article", "product"],
      "default": "website"
    },
    "noIndex": {
      "type": "boolean",
      "default": false
    }
  }
}
```

**Strapi redirect middleware:**
```javascript
// ./src/middlewares/redirects.js
module.exports = (config, { strapi }) => {
  const redirects = {
    '/old-page': { target: '/new-page', status: 301 },
    // Add audit-generated redirects here
  };

  return async (ctx, next) => {
    const redirect = redirects[ctx.path];
    if (redirect) {
      ctx.status = redirect.status;
      ctx.redirect(redirect.target);
      return;
    }
    await next();
  };
};

// Register in config/middlewares.js:
// Add before 'strapi::public':
// { resolve: './src/middlewares/redirects' },
```

---

## Fix Priority Framework

Prioritize generated fixes based on impact:

| Priority | Fix Type | Impact |
|----------|----------|--------|
| Critical | Missing title tags, noindex on important pages | Blocks indexing |
| Critical | HTTP → HTTPS redirect missing | Security + SEO penalty |
| High | Missing/duplicate meta descriptions | Click-through rate |
| High | Missing canonical tags | Duplicate content |
| High | Missing hreflang (multi-language sites) | Wrong language served |
| Medium | Missing Open Graph tags | Social sharing quality |
| Medium | Missing Twitter Card tags | Twitter share appearance |
| Medium | Redirect chains (2+ hops) | Crawl efficiency |
| Low | Suboptimal title length | Minor CTR impact |
| Low | Missing og:locale | Minor social impact |

---

## Output

Generate `SEO-FIXES.md` with:

### Fix Implementation Score: XX/100

Score based on how many issues can be automatically fixed vs require manual intervention.

### Fix Summary
| Category | Issues Found | Fixes Generated | Manual Required |
|----------|-------------|-----------------|-----------------|
| Meta Tags | XX | XX | XX |
| Social Tags | XX | XX | XX |
| Redirects | XX | XX | XX |
| Hreflang | XX | XX | XX |
| CMS Patches | XX | XX | XX |

### Generated Files
1. `meta-tags.html` — Complete meta tags for all crawled pages
2. `social-tags.html` — Open Graph and Twitter Card tags for all pages
3. `redirects.htaccess` — Apache redirect rules
4. `redirects.nginx.conf` — Nginx redirect rules
5. `redirects-cloudflare.txt` — Cloudflare Page Rules
6. `hreflang-tags.html` — HTML hreflang link tags
7. `hreflang-sitemap.xml` — Hreflang XML sitemap
8. `wordpress-seo.php` — WordPress functions.php snippet
9. `shopify-meta.liquid` — Shopify theme.liquid snippet
10. `strapi-middleware.js` — Strapi middleware configuration

### Critical Fixes (implement immediately)
### High Priority (implement within 1 week)
### Medium Priority (implement within 1 month)
### Low Priority (backlog)

### Implementation Instructions
Step-by-step deployment guide per CMS/platform with file paths and verification steps.
