"""
Deep check: fetch image-sitemap.xml raw, check OG images, check for noscript fallbacks,
and extract all inline SVG diagram content from blog posts.
"""
import json
import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = "/Users/davut/projects/claude-seo/screenshots"

def main():
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Fetch raw sitemap
        ctx = browser.new_context()
        page = ctx.new_page()
        resp = page.goto("https://obsessiondb.com/image-sitemap.xml", wait_until='networkidle', timeout=15000)
        # Get the raw XML before browser reformats it
        raw_xml = page.evaluate("() => document.getElementById('webkit-xml-viewer-source-xml')?.textContent || document.documentElement.outerText || ''")
        results["sitemap_status"] = resp.status if resp else None
        results["sitemap_raw"] = raw_xml[:5000]
        ctx.close()

        # 2. Check OG images exist and get sizes
        og_images = [
            "https://obsessiondb.com/og-image.png",
            "https://obsessiondb.com/images/blog/obsessiondb-vs-clickhouse-cloud-10b-benchmark.png",
            "https://obsessiondb.com/images/blog/stateless-distributed-cache-clickhouse.png",
        ]
        results["og_images"] = {}
        for url in og_images:
            ctx = browser.new_context()
            page = ctx.new_page()
            try:
                resp = page.goto(url, wait_until='load', timeout=10000)
                results["og_images"][url] = {
                    "status": resp.status if resp else None,
                    "content_type": resp.headers.get('content-type', '') if resp else '',
                    "content_length": resp.headers.get('content-length', '') if resp else '',
                }
            except Exception as e:
                results["og_images"][url] = {"error": str(e)}
            ctx.close()

        # 3. Deep-dive into blog posts: extract all SVGs with their textual/diagram content
        blog_urls = [
            ("benchmark", "https://obsessiondb.com/blog/obsessiondb-vs-clickhouse-cloud-10b-benchmark"),
            ("cache", "https://obsessiondb.com/blog/stateless-distributed-cache-clickhouse"),
        ]

        for name, url in blog_urls:
            ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = ctx.new_page()
            page.goto(url, wait_until='networkidle', timeout=30000)
            page.wait_for_timeout(2000)

            # Extract all SVGs and their content type (diagram vs icon)
            svg_data = page.evaluate("""() => {
                const svgs = [];
                document.querySelectorAll('svg').forEach((svg, i) => {
                    const rect = svg.getBoundingClientRect();
                    const text = svg.textContent.trim().substring(0, 200);
                    const hasText = svg.querySelectorAll('text').length;
                    const hasPaths = svg.querySelectorAll('path').length;
                    const hasRects = svg.querySelectorAll('rect').length;
                    const hasLines = svg.querySelectorAll('line').length;
                    const hasCircles = svg.querySelectorAll('circle').length;

                    // Check for noscript fallback
                    const parent = svg.parentElement;
                    const noscript = parent ? parent.querySelector('noscript') : null;
                    let noscriptContent = null;
                    if (noscript) {
                        noscriptContent = noscript.innerHTML.substring(0, 300);
                    }

                    svgs.push({
                        index: i,
                        width: rect.width,
                        height: rect.height,
                        isDiagram: rect.width > 100 && rect.height > 100,
                        textNodes: hasText,
                        paths: hasPaths,
                        rects: hasRects,
                        lines: hasLines,
                        circles: hasCircles,
                        textContent: text,
                        role: svg.getAttribute('role'),
                        ariaLabel: svg.getAttribute('aria-label'),
                        ariaHidden: svg.getAttribute('aria-hidden'),
                        title: svg.querySelector('title') ? svg.querySelector('title').textContent : null,
                        viewBox: svg.getAttribute('viewBox'),
                        noscriptFallback: noscriptContent,
                    });
                });

                // Check for noscript tags with images
                const noscripts = [];
                document.querySelectorAll('noscript').forEach((ns, i) => {
                    noscripts.push({
                        index: i,
                        content: ns.innerHTML.substring(0, 500),
                    });
                });

                return { svgs, noscripts };
            }""")

            results[f"blog_{name}_svgs"] = svg_data
            ctx.close()

        # 4. Check the homepage hero background image
        ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx.new_page()
        page.goto("https://obsessiondb.com/", wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)

        hero_data = page.evaluate("""() => {
            // Check for canvas elements (could be used for hero animation)
            const canvases = document.querySelectorAll('canvas');
            const canvasInfo = [];
            canvases.forEach((c, i) => {
                canvasInfo.push({
                    index: i,
                    width: c.width,
                    height: c.height,
                    className: c.className,
                });
            });

            // Check for video elements
            const videos = document.querySelectorAll('video');
            const videoInfo = [];
            videos.forEach((v, i) => {
                videoInfo.push({
                    index: i,
                    src: v.src,
                    poster: v.poster,
                });
            });

            // Check for any image-like resources in the hero area
            const heroSection = document.querySelector('section') || document.querySelector('main') || document.body;
            const allElements = heroSection.querySelectorAll('*');
            const imageRelated = [];
            allElements.forEach(el => {
                const cs = getComputedStyle(el);
                if (cs.backgroundImage && cs.backgroundImage !== 'none') {
                    const rect = el.getBoundingClientRect();
                    if (rect.height > 50) {
                        imageRelated.push({
                            tag: el.tagName,
                            class: el.className?.toString().substring(0, 100),
                            bg: cs.backgroundImage.substring(0, 200),
                            w: rect.width,
                            h: rect.height,
                        });
                    }
                }
            });

            return { canvases: canvasInfo, videos: videoInfo, imageRelated };
        }""")
        results["homepage_hero"] = hero_data
        ctx.close()

        # 5. Check robots.txt for image-sitemap reference
        ctx = browser.new_context()
        page = ctx.new_page()
        resp = page.goto("https://obsessiondb.com/robots.txt", wait_until='load', timeout=10000)
        robots_text = page.evaluate("() => document.body?.innerText || ''")
        results["robots_txt"] = robots_text
        ctx.close()

        browser.close()

    output_path = os.path.join(SCREENSHOT_DIR, "deep_audit_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"Results saved to: {output_path}")

if __name__ == "__main__":
    main()
