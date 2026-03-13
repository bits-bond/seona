"""
Image SEO audit for obsessiondb.com
Captures screenshots and extracts all image data from specified pages.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

PAGES = [
    ("homepage", "https://obsessiondb.com/"),
    ("pricing", "https://obsessiondb.com/pricing"),
    ("blog", "https://obsessiondb.com/blog"),
    ("blog-benchmark", "https://obsessiondb.com/blog/obsessiondb-vs-clickhouse-cloud-10b-benchmark"),
    ("blog-cache", "https://obsessiondb.com/blog/stateless-distributed-cache-clickhouse"),
]

SITEMAP_URL = "https://obsessiondb.com/image-sitemap.xml"

SCREENSHOT_DIR = "/Users/davut/projects/claude-seo/screenshots"

VIEWPORTS = {
    "desktop": {"width": 1920, "height": 1080},
    "mobile": {"width": 375, "height": 812},
}


def extract_image_data(page):
    """Extract comprehensive image data from the page."""
    return page.evaluate("""() => {
        const images = [];

        // 1. All <img> elements
        document.querySelectorAll('img').forEach((img, i) => {
            const rect = img.getBoundingClientRect();
            images.push({
                type: 'img',
                index: i,
                src: img.src || '',
                currentSrc: img.currentSrc || '',
                alt: img.getAttribute('alt'),
                hasAlt: img.hasAttribute('alt'),
                altValue: img.getAttribute('alt') || '',
                width: img.getAttribute('width'),
                height: img.getAttribute('height'),
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                loading: img.getAttribute('loading'),
                decoding: img.getAttribute('decoding'),
                fetchPriority: img.getAttribute('fetchpriority'),
                srcset: img.getAttribute('srcset'),
                sizes: img.getAttribute('sizes'),
                role: img.getAttribute('role'),
                ariaHidden: img.getAttribute('aria-hidden'),
                className: img.className,
                isInViewport: rect.top < window.innerHeight && rect.bottom > 0,
                boundingRect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                },
                parentTag: img.parentElement ? img.parentElement.tagName : null,
                parentRole: img.parentElement ? img.parentElement.getAttribute('role') : null,
            });
        });

        // 2. All <picture> / <source> elements
        const pictures = [];
        document.querySelectorAll('picture').forEach((pic, i) => {
            const sources = [];
            pic.querySelectorAll('source').forEach(s => {
                sources.push({
                    srcset: s.getAttribute('srcset'),
                    type: s.getAttribute('type'),
                    media: s.getAttribute('media'),
                    sizes: s.getAttribute('sizes'),
                });
            });
            const img = pic.querySelector('img');
            pictures.push({
                index: i,
                sources,
                fallbackSrc: img ? img.src : null,
                fallbackAlt: img ? img.getAttribute('alt') : null,
            });
        });

        // 3. SVG usage
        const svgs = [];
        document.querySelectorAll('svg').forEach((svg, i) => {
            const rect = svg.getBoundingClientRect();
            svgs.push({
                index: i,
                role: svg.getAttribute('role'),
                ariaLabel: svg.getAttribute('aria-label'),
                ariaHidden: svg.getAttribute('aria-hidden'),
                width: rect.width,
                height: rect.height,
                title: svg.querySelector('title') ? svg.querySelector('title').textContent : null,
                className: svg.className.baseVal || '',
                childCount: svg.children.length,
            });
        });

        // 4. Background images via CSS
        const bgImages = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (bg && bg !== 'none' && bg.includes('url(')) {
                const rect = el.getBoundingClientRect();
                bgImages.push({
                    tag: el.tagName,
                    className: el.className,
                    backgroundImage: bg,
                    width: rect.width,
                    height: rect.height,
                });
            }
        });

        // 5. CSS/performance info
        const cssImages = [];
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.cssText && rule.cssText.includes('url(')) {
                        const matches = rule.cssText.match(/url\\(["']?([^"')]+)["']?\\)/g);
                        if (matches) {
                            cssImages.push({
                                selector: rule.selectorText || '',
                                urls: matches.map(m => m.replace(/url\\(["']?|["']?\\)/g, '')),
                            });
                        }
                    }
                }
            } catch(e) {
                // Cross-origin stylesheets
            }
        }

        // 6. Performance entries for images
        const perfEntries = [];
        if (window.performance) {
            const entries = performance.getEntriesByType('resource');
            entries.forEach(e => {
                if (e.initiatorType === 'img' || e.initiatorType === 'css' ||
                    /\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)/.test(e.name)) {
                    perfEntries.push({
                        name: e.name,
                        initiatorType: e.initiatorType,
                        transferSize: e.transferSize,
                        encodedBodySize: e.encodedBodySize,
                        decodedBodySize: e.decodedBodySize,
                        duration: Math.round(e.duration),
                    });
                }
            });
        }

        // 7. Meta tags for images
        const metaTags = {};
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        metaTags.ogImage = ogImage ? ogImage.getAttribute('content') : null;
        metaTags.twitterImage = twitterImage ? twitterImage.getAttribute('content') : null;

        // 8. Favicon
        const favicons = [];
        document.querySelectorAll('link[rel*="icon"]').forEach(l => {
            favicons.push({
                rel: l.getAttribute('rel'),
                href: l.getAttribute('href'),
                type: l.getAttribute('type'),
                sizes: l.getAttribute('sizes'),
            });
        });

        return {
            images,
            pictures,
            svgs,
            bgImages,
            cssImages,
            perfEntries,
            metaTags,
            favicons,
            pageTitle: document.title,
            url: window.location.href,
        };
    }""")


def audit_page(browser, name, url):
    """Audit a single page at multiple viewports."""
    results = {}

    for vp_name, vp in VIEWPORTS.items():
        context = browser.new_context(
            viewport=vp,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        try:
            page.goto(url, wait_until='networkidle', timeout=30000)
            page.wait_for_timeout(2000)  # Extra wait for SPA rendering

            # Screenshot
            ss_path = os.path.join(SCREENSHOT_DIR, f"{name}_{vp_name}.png")
            page.screenshot(path=ss_path, full_page=False)
            print(f"  Screenshot: {ss_path}")

            # Full page screenshot for desktop only
            if vp_name == "desktop":
                ss_full = os.path.join(SCREENSHOT_DIR, f"{name}_{vp_name}_full.png")
                page.screenshot(path=ss_full, full_page=True)
                print(f"  Full page:  {ss_full}")

            # Extract image data
            data = extract_image_data(page)
            results[vp_name] = data

        except Exception as e:
            print(f"  ERROR on {name}/{vp_name}: {e}")
            results[vp_name] = {"error": str(e)}
        finally:
            context.close()

    return results


def fetch_sitemap(browser, url):
    """Fetch and return the image sitemap XML."""
    context = browser.new_context()
    page = context.new_page()
    try:
        response = page.goto(url, wait_until='networkidle', timeout=15000)
        status = response.status if response else None
        content = page.content()
        # Also try to get raw text
        text = page.evaluate("() => document.documentElement.outerHTML")
        context.close()
        return {"status": status, "content": text}
    except Exception as e:
        context.close()
        return {"error": str(e)}


def main():
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Audit each page
        for name, url in PAGES:
            print(f"\nAuditing: {name} ({url})")
            results[name] = audit_page(browser, name, url)

        # Fetch sitemap
        print(f"\nFetching sitemap: {SITEMAP_URL}")
        results["image_sitemap"] = fetch_sitemap(browser, SITEMAP_URL)

        browser.close()

    # Save results
    output_path = os.path.join(SCREENSHOT_DIR, "audit_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
