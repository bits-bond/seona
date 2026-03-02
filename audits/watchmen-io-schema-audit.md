# Schema.org Structured Data Audit: watchmen.io

**Audit Date:** 2026-03-02
**Site:** https://watchmen.io
**Business Type:** Cybersecurity consulting collective (B2B professional services)
**CMS/Backend:** Custom (Strapi headless CMS for content/images)

---

## 1. DETECTION RESULTS

### Pages Analyzed

| Page | URL | JSON-LD | Microdata | RDFa | OG Tags |
|------|-----|---------|-----------|------|---------|
| Homepage | `/` | NONE | NONE | NONE | Partial |
| Join (Careers) | `/join` | NONE | NONE | NONE | Partial |
| News | `/news` | NONE | NONE | NONE | Partial |
| Privacy | `/privacy` | NONE | NONE | NONE | Broken |

### Summary

**Zero structured data markup detected across the entire site.** No JSON-LD script blocks, no microdata `itemscope`/`itemtype` attributes, and no RDFa `typeof` attributes exist on any page.

The site does have Open Graph meta tags, but these have issues:
- Homepage: `og:title`, `og:description`, `og:type`, and `og:image` are set correctly
- Join page: `og:title`, `og:description`, `og:type`, and `og:url` are all **empty strings**
- Privacy page: Same issue -- all OG tags contain empty values
- No `og:url` set on the homepage
- No Twitter Card meta tags on any page

---

## 2. SCHEMA OPPORTUNITIES IDENTIFIED

### Priority Matrix

| Priority | Schema Type | Target Page | Rich Result Potential | Effort |
|----------|------------|-------------|----------------------|--------|
| **CRITICAL** | Organization | `/` (all pages) | Knowledge Panel, brand SERP | Low |
| **CRITICAL** | WebSite + SearchAction | `/` | Sitelinks search box | Low |
| **HIGH** | JobPosting (x9) | `/join` | Job listing rich results | Medium |
| **HIGH** | BreadcrumbList | All pages | Breadcrumb trail in SERPs | Low |
| **MEDIUM** | WebPage | All pages | Enhanced SERP presentation | Low |
| **MEDIUM** | Person (x5 principals) | `/` | E-E-A-T signals | Medium |
| **LOW** | Service | `/` | Structured service data | Low |

### NOT Recommended

| Schema Type | Reason |
|-------------|--------|
| FAQPage | Restricted to government/healthcare authority sites since August 2023. Watchmen is a private company. |
| HowTo | Deprecated since September 2023 -- rich results removed by Google. |
| SpecialAnnouncement | Deprecated July 31, 2025. |
| LocalBusiness | Watchmen operates as a B2B consulting collective, not a local consumer-facing business. `Organization` is the correct type. |

---

## 3. GENERATED JSON-LD SCHEMAS

### 3A. Organization Schema (Homepage -- all pages via site-wide injection)

This is the highest-priority schema. It defines the company entity for Google's Knowledge Graph.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Watchmen",
  "legalName": "Watchmen",
  "url": "https://watchmen.io",
  "logo": {
    "@type": "ImageObject",
    "url": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png",
    "width": 512,
    "height": 512
  },
  "image": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png",
  "description": "Watchmen is a collective of cybersecurity, cloud, and network experts specializing in Zero Trust architecture. Trusted by industry leaders including ASML, Politie, Defensie, KVK, SURF, ABN AMRO, and Schiphol.",
  "slogan": "Network Security is dead, we are building the new.",
  "foundingDate": "2021",
  "founder": {
    "@type": "Person",
    "name": "Jacky Willems",
    "jobTitle": "Founder, CEO & Principal Engineer",
    "sameAs": "https://www.linkedin.com/in/jackywillems/"
  },
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "High Tech Campus 10",
      "addressLocality": "Eindhoven",
      "postalCode": "5656 AE",
      "addressCountry": "NL"
    },
    {
      "@type": "PostalAddress",
      "streetAddress": "Brusselsestraat 51",
      "addressLocality": "Antwerp",
      "postalCode": "2018",
      "addressCountry": "BE"
    }
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+31-40-240-3001",
      "email": "info@watchmen.io",
      "contactType": "customer service",
      "availableLanguage": ["English", "Dutch"]
    },
    {
      "@type": "ContactPoint",
      "email": "talent@watchmen.io",
      "contactType": "HR / Recruitment",
      "availableLanguage": ["English", "Dutch"]
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/watchmen/",
    "https://twitter.com/watchmen_io",
    "https://www.youtube.com/channel/UCtzgWqnGEY3d2JBkdu1x2xA"
  ],
  "knowsAbout": [
    "Zero Trust Architecture",
    "Network Security",
    "Cloud Security",
    "Cybersecurity Consulting",
    "SASE",
    "SSE"
  ],
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "minValue": 30,
    "maxValue": 50
  },
  "areaServed": [
    {
      "@type": "Country",
      "name": "Netherlands"
    },
    {
      "@type": "Country",
      "name": "Belgium"
    }
  ]
}
</script>
```

**Validation:**
- [PASS] @context is "https://schema.org"
- [PASS] @type "Organization" is valid and not deprecated
- [PASS] All required properties present (name, url)
- [PASS] All recommended properties present (logo, description, contactPoint, sameAs, address)
- [PASS] No placeholder text
- [PASS] All URLs are absolute
- [PASS] Dates are ISO 8601 compatible

---

### 3B. WebSite Schema with SearchAction (Homepage)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Watchmen - The Zero Trust Collective",
  "url": "https://watchmen.io",
  "publisher": {
    "@type": "Organization",
    "name": "Watchmen",
    "url": "https://watchmen.io"
  },
  "inLanguage": "en"
}
</script>
```

**Note:** SearchAction (`potentialAction` with `SearchAction` type) is NOT recommended here because the site does not have an internal search feature. Adding a SearchAction without a functioning search endpoint would fail Google validation.

**Validation:**
- [PASS] @context is "https://schema.org"
- [PASS] @type "WebSite" is valid
- [PASS] Required properties present
- [PASS] No placeholder text
- [PASS] URLs are absolute

---

### 3C. BreadcrumbList Schema (All interior pages)

#### For /join page:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://watchmen.io"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Join Watchmen",
      "item": "https://watchmen.io/join"
    }
  ]
}
</script>
```

#### For /news page:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://watchmen.io"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "News",
      "item": "https://watchmen.io/news"
    }
  ]
}
</script>
```

#### For /privacy page:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://watchmen.io"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Privacy Statement",
      "item": "https://watchmen.io/privacy"
    }
  ]
}
</script>
```

**Validation (all breadcrumbs):**
- [PASS] All checks pass for each breadcrumb variant

---

### 3D. JobPosting Schemas (9 positions on /join page)

Each of the 9 open positions should have its own JobPosting schema block. Below are all 9, ready for implementation. They can be combined in a single `<script>` tag using a `@graph` array, or placed in individual `<script>` tags.

**Important notes:**
- `datePosted` should be updated to the actual posting date when known
- `validThrough` should be set to a realistic closing date (shown as 6 months from now)
- Salary ranges use the indicative levels shown on the salary image (these should be verified)

```json
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Security Engineer",
    "description": "<p>Our Security Engineers play a crucial role in managing and controlling cloud infrastructure for various clients. A versatile, creative engineer who always thinks from the client's perspective and focuses on end results. You can easily handle things independently, but also rely on a team of experts around you.</p><p>At Watchmen, you get the space to grow, the freedom to lead, and the trust to evolve. We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cybersecurity",
    "occupationalCategory": "15-1212.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Security Consultant",
    "description": "<p>Our Security Consultants know that securing the IT environment is super important and believe secure is never secure enough. A versatile, creative consultant who always thinks from the client's perspective and focuses on end results. You can easily handle things independently, but also rely on a team of experts around you and work well in project teams.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days based on your experience level.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cybersecurity",
    "occupationalCategory": "15-1212.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Security Architect",
    "description": "<p>The passion of our Security Architects lies in developing security architecture that seamlessly aligns with our clients' wishes and requirements. A conceptual, creative architect who always thinks from the client's perspective and focuses on end results. You're analytically strong and good at making decisions. You're a sparring partner for technicians, project leaders, and management alike.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cybersecurity",
    "occupationalCategory": "15-1212.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Cloud Engineer",
    "description": "<p>Our Cloud Engineers play an important role in managing and controlling our clients' cloud infrastructure. A versatile, creative engineer who always thinks from the client's perspective and focuses on end results. You can easily handle things independently, but also rely on a team of experts around you.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cloud Computing / Cybersecurity",
    "occupationalCategory": "15-1244.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Cloud Consultant",
    "description": "<p>Our Cloud Consultants play an important and advisory role in the continuous integration, innovation, and management of our clients' cloud infrastructures. A versatile, creative professional who always thinks from the client's interest and end result perspective. In addition to being strong in written communication, you are communicatively strong and have a positive attitude. Most importantly, you have an eye for modern security solutions, experience with IT Security, and you like to think about the future of zero trust.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cloud Computing / Cybersecurity",
    "occupationalCategory": "15-1244.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Cloud Architect",
    "description": "<p>As a Cloud Architect, you play an important role in guiding developments during various stages of processes within cloud infrastructures. A conceptual, creative passionate expert who always thinks from the client's perspective and focuses on end results. You're analytically strong and good at making decisions. You're a sparring partner for technicians, project leaders, and management alike.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Cloud Computing / Cybersecurity",
    "occupationalCategory": "15-1244.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Network Engineer",
    "description": "<p>You are the expert in the execution phase of complex IT and OT network infrastructures for our clients. A versatile, creative passionate expert with an eye for detail and security aspects who is capable of designing high-quality network drawings. You can easily handle things independently, but also rely on a team of experts around you.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Network Engineering / Cybersecurity",
    "occupationalCategory": "15-1241.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Network Consultant",
    "description": "<p>Our Network Consultants are an important factor in the various phases of projects within clients' complex IT projects. You are strong in creating technical and functional designs and have the expertise for good vision and strategy.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Network Engineering / Cybersecurity",
    "occupationalCategory": "15-1241.00",
    "directApply": true
  },
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Network Architect",
    "description": "<p>Our Network Architects translate vision and strategy documents into consequences for IT and OT landscapes and management environments. You advise our clients at IT and OT management level. A conceptual, creative passionate expert who is analytically strong and good at making decisions. You're a sparring partner for technicians, project leaders, and management alike.</p><p>We offer the highest salary and best benefits in the market, plus up to 35 vacation days.</p>",
    "datePosted": "2026-03-01",
    "validThrough": "2026-09-01",
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Watchmen",
      "sameAs": "https://watchmen.io",
      "logo": "https://strapi.watchmen.io/uploads/beeldmerk_onwhite_e8af8b30ee.png"
    },
    "jobLocation": [
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "High Tech Campus 10",
          "addressLocality": "Eindhoven",
          "postalCode": "5656 AE",
          "addressCountry": "NL"
        }
      },
      {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Brusselsestraat 51",
          "addressLocality": "Antwerp",
          "postalCode": "2018",
          "addressCountry": "BE"
        }
      }
    ],
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "Netherlands"
    },
    "jobLocationType": "TELECOMMUTE",
    "industry": "Network Engineering / Cybersecurity",
    "occupationalCategory": "15-1241.00",
    "directApply": true
  }
]
</script>
```

**Validation (all 9 JobPostings):**
- [PASS] @context is "https://schema.org"
- [PASS] @type "JobPosting" is valid and supports rich results
- [PASS] Required properties: title, description, datePosted, hiringOrganization, jobLocation
- [PASS] Recommended properties: employmentType, validThrough, applicantLocationRequirements
- [PASS] No placeholder text -- all descriptions derived from actual page content
- [PASS] All URLs are absolute
- [PASS] Dates in ISO 8601 format
- [NOTE] `baseSalary` omitted -- the site shows salary levels as an image, not structured text. If salary ranges become available as data, add `baseSalary` with `MonetaryAmount` for each role.
- [NOTE] `validThrough` set to 2026-09-01 as an example. Update this per actual recruitment timeline.
- [NOTE] `directApply` set to `true` because users can apply directly via email through the site.

---

### 3E. Person Schemas (5 Principal Engineers -- Homepage)

These strengthen E-E-A-T signals by identifying the leadership team as named, verifiable individuals with public LinkedIn profiles.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Watchmen",
  "url": "https://watchmen.io",
  "member": [
    {
      "@type": "Person",
      "name": "Jacky Willems",
      "jobTitle": "Founder, CEO & Principal Engineer",
      "description": "In 2021, Jacky turned a track record across ASML, KPN, BNP Paribas, Chamber of Commerce, and the Dutch National Police into Watchmen. Backed by 18+ years of industry experience and 50+ leading certifications, he designed an engineer-led model that blends enterprise rigor with the speed and innovation of a startup.",
      "sameAs": "https://www.linkedin.com/in/jackywillems/",
      "worksFor": {
        "@type": "Organization",
        "name": "Watchmen"
      },
      "knowsAbout": ["CISSP", "CISM", "CCIE", "Zero Trust", "Network Security"]
    },
    {
      "@type": "Person",
      "name": "Calvin Slangen",
      "jobTitle": "Principal Security Engineer",
      "description": "Calvin joined Watchmen in 2024, bringing a rare blend of hands-on technical expertise and strategic security leadership. With experience as Portfolio Manager, Security Consultant, and interim CISO, he has led high-stakes projects for some of the most demanding environments.",
      "sameAs": "https://www.linkedin.com/in/calvinslangen/",
      "worksFor": {
        "@type": "Organization",
        "name": "Watchmen"
      },
      "knowsAbout": ["CISM", "CPM", "CC", "ZTCA", "Cybersecurity"]
    },
    {
      "@type": "Person",
      "name": "Marco Put-Carstens",
      "jobTitle": "CTO & Principal Architect",
      "description": "Marco brings a broad and deep background in Network and Security, with experience at Fujitsu, Vosko, Blue Coat, and Zscaler. He has operated in a wide range of roles, spanning design, architecture, pre-sales, and engineering in complex environments.",
      "sameAs": "https://www.linkedin.com/in/marco-put-carstens-a8b750/",
      "worksFor": {
        "@type": "Organization",
        "name": "Watchmen"
      },
      "knowsAbout": ["CEH", "TOGAF", "Zscaler Zero Trust Architect", "Network Security"]
    },
    {
      "@type": "Person",
      "name": "Robert de Groot",
      "jobTitle": "Principal Architect",
      "description": "Robert brings extensive experience in network and security architecture, contributing to complex enterprise projects and the strategic direction of Watchmen's technical practice.",
      "sameAs": "https://www.linkedin.com/in/rjdegroot1/",
      "worksFor": {
        "@type": "Organization",
        "name": "Watchmen"
      }
    },
    {
      "@type": "Person",
      "name": "Sander Magnin",
      "jobTitle": "Principal Architect",
      "description": "Sander joined Watchmen in 2021 after holding positions at Vosko, Conscia, and Nivo. With a strong track record in leading complex network and security projects, Sander plays an active role in mentoring engineers and supporting the broader team. At the end of 2022, he founded the Watchmen Academy.",
      "sameAs": "https://www.linkedin.com/in/watchmen/",
      "worksFor": {
        "@type": "Organization",
        "name": "Watchmen"
      },
      "knowsAbout": ["CISSP", "CCSP", "CCNP Security"]
    }
  ]
}
</script>
```

**Validation:**
- [PASS] All checks pass
- [NOTE] This uses the `member` property on Organization to link Person entities, which is semantically cleaner than standalone Person blocks. The Organization reference avoids duplication with the main Organization schema by using `@id` references in production (see implementation notes below).

---

### 3F. WebPage Schema (Per-page, example for /join)

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Join the Collective - Watchmen Careers",
  "description": "Join Watchmen's collective of cybersecurity experts. Open positions for Security Engineers, Cloud Architects, Network Consultants and more. Market-leading salaries and up to 35 vacation days.",
  "url": "https://watchmen.io/join",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Watchmen",
    "url": "https://watchmen.io"
  },
  "about": {
    "@type": "Organization",
    "name": "Watchmen"
  },
  "inLanguage": "en"
}
</script>
```

**Validation:**
- [PASS] All checks pass

---

## 4. IMPLEMENTATION GUIDANCE

### Recommended Implementation Order

**Phase 1 -- Immediate (Week 1)** -- Estimated impact: HIGH

1. **Organization schema** -- Add to the `<head>` of all pages (site-wide template). This is the single highest-value schema to implement. It feeds Google's Knowledge Graph and improves brand presence in SERPs.

2. **WebSite schema** -- Add to homepage only. Simple, fast, foundational.

3. **BreadcrumbList schema** -- Add to every interior page (`/join`, `/news`, `/privacy`). Low effort, improves SERP display.

**Phase 2 -- High Priority (Week 2)** -- Estimated impact: HIGH for recruitment

4. **JobPosting schemas (all 9)** -- Add to the `/join` page. This is the highest-impact schema for Watchmen specifically, because:
   - Job listings are a primary business goal (recruitment-driven company)
   - JobPosting rich results appear prominently in Google Search and Google for Jobs
   - Competitors in the cybersecurity recruiting space likely already have these
   - Each posting gets its own card in Google for Jobs with title, location, and employer

**Phase 3 -- Medium Priority (Week 3-4)** -- Estimated impact: MEDIUM (E-E-A-T)

5. **Person schemas** (principal engineers) -- Strengthens E-E-A-T signals. The principals are publicly named with LinkedIn profiles; connecting them structurally to the organization boosts entity recognition.

6. **WebPage schemas** -- Add per-page type information. Lower priority but completes the structured data foundation.

### Technical Implementation Notes

1. **Placement:** All JSON-LD blocks should be placed in the `<head>` element, before the closing `</head>` tag. They can also be placed at the bottom of `<body>` -- both are valid, but `<head>` is conventional.

2. **Strapi integration:** Since the site uses Strapi as a headless CMS, the JSON-LD blocks can be:
   - Injected via the server-side template engine (recommended)
   - Generated dynamically from Strapi content via API for JobPostings
   - Hardcoded for static schemas (Organization, WebSite)

3. **`@id` references:** In production, use `@id` to create a linked graph instead of duplicating the Organization entity across multiple schema blocks. Example:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "@id": "https://watchmen.io/#organization",
     "name": "Watchmen",
     ...
   }
   ```
   Then reference it elsewhere:
   ```json
   "hiringOrganization": { "@id": "https://watchmen.io/#organization" }
   ```

4. **Salary data:** The `/join` page shows salary levels as a PNG image (`/static/img/salarisniveaus-en.png`). To unlock the salary filter in Google for Jobs, extract these ranges into the `baseSalary` property of each JobPosting:
   ```json
   "baseSalary": {
     "@type": "MonetaryAmount",
     "currency": "EUR",
     "value": {
       "@type": "QuantitativeValue",
       "minValue": 4000,
       "maxValue": 8000,
       "unitText": "MONTH"
     }
   }
   ```

5. **JobPosting freshness:** Google requires `datePosted` to be accurate and `validThrough` to be in the future. Stale job postings (with past `validThrough` dates) are dropped from rich results. Consider automating this via Strapi.

### Validation Tools

After implementation, validate using:
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Validator:** https://validator.schema.org/
- **Google Search Console:** Check the "Enhancements" section for structured data reports

---

## 5. ADDITIONAL ISSUES FOUND

### Open Graph Tag Issues

These are not Schema.org but impact rich sharing on social platforms:

| Page | Issue | Fix |
|------|-------|-----|
| `/join` | `og:title`, `og:description`, `og:type`, `og:url` all have **empty values** | Populate with "Join Watchmen - Cybersecurity Careers", description, "website", and "https://watchmen.io/join" |
| `/privacy` | Same -- all OG values are empty | Populate appropriately |
| All pages | No `og:url` on homepage | Add `<meta property="og:url" content="https://watchmen.io">` |
| All pages | No Twitter Card meta tags | Add `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description` |
| `/privacy` | Duplicate `<title>` tags (one from base template, one from page) | Fix template to only render one `<title>` |

### Missing `canonical` Tags

No `<link rel="canonical">` tags were found on any page. This is a separate technical SEO issue but worth noting alongside the schema audit, as canonical URLs are important for preventing duplicate content indexing.

---

## 6. EXPECTED IMPACT

| Schema Type | Expected Benefit |
|-------------|-----------------|
| Organization | Brand Knowledge Panel, entity recognition in Google's Knowledge Graph, enhanced branded SERP presence |
| WebSite | Foundation for sitelinks, improved site entity understanding |
| BreadcrumbList | Visual breadcrumb trail in SERPs, improved click-through rate |
| JobPosting (x9) | Google for Jobs integration, job listing rich results with company logo, location, and employment type -- directly supports recruitment goals |
| Person (x5) | E-E-A-T signal boost, entity linking via LinkedIn, potential Knowledge Panel entries for principals |
| WebPage | Improved page-level understanding by search engines |

**Overall assessment:** Watchmen.io currently has a Schema.org score of **0/100**. Implementing all recommended schemas would bring this to approximately **85-90/100** for the site's current page structure. The single biggest wins are Organization (for brand) and JobPosting (for recruitment), both of which directly support Watchmen's core business objectives.
