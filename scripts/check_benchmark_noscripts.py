"""Check benchmark blog post for noscript fallbacks and full SVG diagram inventory."""
import json
from playwright.sync_api import sync_playwright

def main():
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Check benchmark post - scroll through entire page to load lazy content
        ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx.new_page()
        page.goto("https://obsessiondb.com/blog/obsessiondb-vs-clickhouse-cloud-10b-benchmark",
                   wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)

        # Scroll to bottom to trigger any lazy loading
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

        benchmark_data = page.evaluate("""() => {
            // Get ALL noscript tags
            const noscripts = [];
            document.querySelectorAll('noscript').forEach((ns, i) => {
                noscripts.push({
                    index: i,
                    content: ns.innerHTML.substring(0, 500),
                });
            });

            // Get ALL SVGs with more detail
            const svgs = [];
            document.querySelectorAll('svg').forEach((svg, i) => {
                const rect = svg.getBoundingClientRect();
                // Get parent element info
                const parent = svg.parentElement;
                const grandparent = parent?.parentElement;

                // Check for adjacent noscript
                let adjacentNoscript = null;
                if (parent) {
                    const ns = parent.querySelector('noscript');
                    if (ns) adjacentNoscript = ns.innerHTML.substring(0, 300);
                }

                svgs.push({
                    index: i,
                    width: rect.width,
                    height: rect.height,
                    isDiagram: rect.width > 100 && rect.height > 100,
                    viewBox: svg.getAttribute('viewBox'),
                    role: svg.getAttribute('role'),
                    ariaLabel: svg.getAttribute('aria-label'),
                    ariaHidden: svg.getAttribute('aria-hidden'),
                    title: svg.querySelector('title')?.textContent || null,
                    desc: svg.querySelector('desc')?.textContent || null,
                    textContent: svg.textContent.trim().substring(0, 100),
                    parentTag: parent?.tagName,
                    parentClass: parent?.className?.toString()?.substring(0, 80),
                    adjacentNoscript,
                });
            });

            // Get all tables (benchmark data)
            const tables = [];
            document.querySelectorAll('table').forEach((t, i) => {
                tables.push({
                    index: i,
                    rows: t.rows.length,
                    headerText: t.querySelector('thead')?.textContent?.trim()?.substring(0, 200),
                });
            });

            // Check total page height and content structure
            const sections = [];
            document.querySelectorAll('h2, h3').forEach(h => {
                sections.push({
                    tag: h.tagName,
                    text: h.textContent.trim(),
                });
            });

            return { noscripts, svgs, tables, sections };
        }""")

        results["benchmark"] = benchmark_data
        ctx.close()

        # Also check the cache blog post noscripts and SVGs after full scroll
        ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx.new_page()
        page.goto("https://obsessiondb.com/blog/stateless-distributed-cache-clickhouse",
                   wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

        cache_data = page.evaluate("""() => {
            const svgs = [];
            document.querySelectorAll('svg').forEach((svg, i) => {
                const rect = svg.getBoundingClientRect();
                const parent = svg.parentElement;
                let adjacentNoscript = null;
                if (parent) {
                    const ns = parent.querySelector('noscript');
                    if (ns) adjacentNoscript = ns.innerHTML.substring(0, 300);
                }
                svgs.push({
                    index: i,
                    width: rect.width,
                    height: rect.height,
                    isDiagram: rect.width > 100 && rect.height > 100,
                    viewBox: svg.getAttribute('viewBox'),
                    role: svg.getAttribute('role'),
                    ariaLabel: svg.getAttribute('aria-label'),
                    ariaHidden: svg.getAttribute('aria-hidden'),
                    title: svg.querySelector('title')?.textContent || null,
                    textContent: svg.textContent.trim().substring(0, 100),
                    adjacentNoscript,
                });
            });

            const noscripts = [];
            document.querySelectorAll('noscript').forEach((ns, i) => {
                noscripts.push({ index: i, content: ns.innerHTML.substring(0, 500) });
            });

            const sections = [];
            document.querySelectorAll('h2, h3').forEach(h => {
                sections.push({ tag: h.tagName, text: h.textContent.trim() });
            });

            return { svgs, noscripts, sections };
        }""")

        results["cache"] = cache_data
        ctx.close()

        # Check the homepage SVG diagrams (architecture diagrams, etc.)
        ctx = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = ctx.new_page()
        page.goto("https://obsessiondb.com/", wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(2000)

        homepage_data = page.evaluate("""() => {
            const svgs = [];
            document.querySelectorAll('svg').forEach((svg, i) => {
                const rect = svg.getBoundingClientRect();
                if (rect.width > 100 || rect.height > 100) {
                    svgs.push({
                        index: i,
                        width: rect.width,
                        height: rect.height,
                        viewBox: svg.getAttribute('viewBox'),
                        role: svg.getAttribute('role'),
                        ariaLabel: svg.getAttribute('aria-label'),
                        ariaHidden: svg.getAttribute('aria-hidden'),
                        title: svg.querySelector('title')?.textContent || null,
                        textContent: svg.textContent.trim().substring(0, 200),
                        parentTag: svg.parentElement?.tagName,
                        parentClass: svg.parentElement?.className?.toString()?.substring(0, 80),
                    });
                }
            });

            // Check for the architecture diagram / "How it Works" section
            const canvasElements = [];
            document.querySelectorAll('canvas').forEach((c, i) => {
                const rect = c.getBoundingClientRect();
                const parent = c.parentElement;
                canvasElements.push({
                    index: i,
                    width: c.width,
                    height: c.height,
                    cssWidth: rect.width,
                    cssHeight: rect.height,
                    parentTag: parent?.tagName,
                    parentClass: parent?.className?.toString()?.substring(0, 80),
                    ariaLabel: c.getAttribute('aria-label'),
                    role: c.getAttribute('role'),
                });
            });

            return { largeSvgs: svgs, canvasElements };
        }""")

        results["homepage"] = homepage_data
        ctx.close()

        browser.close()

    with open("/Users/davut/projects/claude-seo/screenshots/deep_audit_2.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("Done")

if __name__ == "__main__":
    main()
