"""
Deep image analysis: check more pages, analyze responsive images, check compression,
examine filenames, and look for additional inner pages.
"""

import json
import time
import requests
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

def discover_inner_pages(page, base_url):
    """Find all internal links on the homepage."""
    links = page.evaluate("""(baseUrl) => {
        const links = new Set();
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (href.startsWith(baseUrl) && !href.includes('#') && !href.includes('mailto:') && !href.includes('tel:')) {
                links.add(href.replace(/\\/$/, ''));
            }
        });
        return Array.from(links);
    }""", base_url)
    return links

def deep_image_analysis(page, url):
    """Get detailed image info including computed styles, lazy loading behavior, etc."""
    try:
        page.goto(url, wait_until="networkidle", timeout=30000)
        time.sleep(2)
    except Exception as e:
        print(f"  ERROR loading {url}: {e}")
        return None

    data = page.evaluate("""() => {
        const results = {
            images: [],
            bgImages: [],
            pictureElements: [],
            metaTags: {},
            performance: {}
        };

        // Meta tags
        document.querySelectorAll('meta').forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property') || '';
            const content = meta.getAttribute('content') || '';
            if (name && content) {
                results.metaTags[name] = content;
            }
        });

        // All img elements with full detail
        document.querySelectorAll('img').forEach((img, idx) => {
            const rect = img.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(img);

            results.images.push({
                index: idx,
                src: img.src || '',
                currentSrc: img.currentSrc || '',
                alt: img.getAttribute('alt'),
                altExists: img.hasAttribute('alt'),
                title: img.getAttribute('title'),
                width: img.getAttribute('width') || '',
                height: img.getAttribute('height') || '',
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: Math.round(rect.width),
                displayHeight: Math.round(rect.height),
                loading: img.getAttribute('loading') || '',
                decoding: img.getAttribute('decoding') || '',
                fetchpriority: img.getAttribute('fetchpriority') || '',
                srcset: img.getAttribute('srcset') || '',
                sizes: img.getAttribute('sizes') || '',
                role: img.getAttribute('role') || '',
                ariaHidden: img.getAttribute('aria-hidden') || '',
                ariaLabel: img.getAttribute('aria-label') || '',
                isAboveFold: rect.top < window.innerHeight && rect.bottom > 0,
                topPosition: Math.round(rect.top),
                isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
                objectFit: computedStyle.objectFit || '',
                aspectRatio: computedStyle.aspectRatio || '',
                parentTag: img.parentElement ? img.parentElement.tagName : '',
                inPicture: img.closest('picture') !== null,
                inLink: img.closest('a') !== null,
                linkHref: img.closest('a') ? img.closest('a').href : '',
                cssClasses: img.className || '',
                id: img.id || '',
                dataAttributes: Object.keys(img.dataset).reduce((acc, key) => { acc[key] = img.dataset[key]; return acc; }, {})
            });
        });

        // Picture elements
        document.querySelectorAll('picture').forEach(pic => {
            const sources = [];
            pic.querySelectorAll('source').forEach(src => {
                sources.push({
                    srcset: src.getAttribute('srcset') || '',
                    type: src.getAttribute('type') || '',
                    media: src.getAttribute('media') || '',
                    sizes: src.getAttribute('sizes') || ''
                });
            });
            const img = pic.querySelector('img');
            results.pictureElements.push({
                sources: sources,
                fallbackSrc: img ? img.src : '',
                fallbackAlt: img ? img.getAttribute('alt') : ''
            });
        });

        // Background images
        const checked = new Set();
        document.querySelectorAll('[style*="background"], section, div, header, footer, main, aside').forEach(el => {
            if (checked.has(el)) return;
            checked.add(el);
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (bg && bg !== 'none' && bg.includes('url(')) {
                const urlRegex = /url\\(["']?([^"')]+)["']?\\)/g;
                let match;
                while ((match = urlRegex.exec(bg)) !== null) {
                    if (match[1] && !match[1].startsWith('data:')) {
                        const rect = el.getBoundingClientRect();
                        results.bgImages.push({
                            src: match[1],
                            element: el.tagName + '.' + (el.className || '').toString().split(' ').slice(0, 2).join('.'),
                            isAboveFold: rect.top < window.innerHeight,
                            displayWidth: Math.round(rect.width),
                            displayHeight: Math.round(rect.height),
                            backgroundSize: style.backgroundSize || '',
                            backgroundPosition: style.backgroundPosition || ''
                        });
                    }
                }
            }
        });

        // Check for preloaded images
        results.preloadedImages = [];
        document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => {
            results.preloadedImages.push({
                href: link.getAttribute('href') || '',
                type: link.getAttribute('type') || '',
                imagesrcset: link.getAttribute('imagesrcset') || '',
                imagesizes: link.getAttribute('imagesizes') || ''
            });
        });

        return results;
    }""")

    return data


def check_image_headers(session, image_urls):
    """Check HTTP headers for compression, caching, CDN info."""
    results = {}
    for url in image_urls[:30]:
        try:
            resp = session.head(url, timeout=10, allow_redirects=True)
            results[url] = {
                'status': resp.status_code,
                'contentType': resp.headers.get('content-type', ''),
                'contentLength': resp.headers.get('content-length', ''),
                'cacheControl': resp.headers.get('cache-control', ''),
                'expires': resp.headers.get('expires', ''),
                'etag': resp.headers.get('etag', ''),
                'lastModified': resp.headers.get('last-modified', ''),
                'contentEncoding': resp.headers.get('content-encoding', ''),
                'server': resp.headers.get('server', ''),
                'xCache': resp.headers.get('x-cache', ''),
                'cfCacheStatus': resp.headers.get('cf-cache-status', ''),
                'vary': resp.headers.get('vary', ''),
                'acceptRanges': resp.headers.get('accept-ranges', ''),
            }
        except Exception as e:
            results[url] = {'error': str(e)}
    return results


def main():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()

        # 1. Discover all inner pages from homepage
        print("Discovering inner pages...")
        page.goto("https://jun.legal/", wait_until="networkidle", timeout=30000)
        time.sleep(2)
        inner_pages = discover_inner_pages(page, "https://jun.legal")
        print(f"Found {len(inner_pages)} internal links:")
        for p_url in sorted(inner_pages):
            print(f"  {p_url}")

        # 2. Analyze key pages in depth
        target_pages = [
            "https://jun.legal/",
            "https://jun.legal/leistungen",
            "https://jun.legal/ueber-uns",
            "https://jun.legal/kontakt",
            "https://jun.legal/blog",
            "https://jun.legal/team",
            "https://jun.legal/karriere",
            "https://jun.legal/ki",
            "https://jun.legal/it-vertragsrecht",
            "https://jun.legal/urheberrecht",
        ]

        all_page_data = {}
        all_image_urls = set()

        for url in target_pages:
            print(f"\n--- Deep analysis: {url} ---")
            data = deep_image_analysis(page, url)
            if data:
                all_page_data[url] = data
                for img in data['images']:
                    src = img.get('currentSrc') or img.get('src', '')
                    if src and not src.startswith('data:'):
                        all_image_urls.add(src)
                for bg in data['bgImages']:
                    src = bg.get('src', '')
                    if src and not src.startswith('data:'):
                        full = urljoin(url, src)
                        all_image_urls.add(full)

                # Print summary
                print(f"  Images: {len(data['images'])}, BG: {len(data['bgImages'])}, Picture: {len(data['pictureElements'])}")
                print(f"  Preloaded: {len(data['preloadedImages'])}")

                for img in data['images']:
                    alt_val = img.get('alt')
                    alt_info = "NO ALT" if not img.get('altExists') else ("EMPTY" if alt_val == '' or alt_val is None else f"'{str(alt_val)[:50]}'")
                    loading = str(img.get('loading', '') or 'none')
                    fold = "ATF" if img.get('isAboveFold') else "BTF"
                    srcset_info = "srcset" if img.get('srcset') else "no-srcset"
                    w = str(img.get('width', '') or '?')
                    h = str(img.get('height', '') or '?')
                    wh = f"{w}x{h}" if w != '?' or h != '?' else "no-wh"
                    src_short = str(img.get('src', '') or '')[-60:]
                    print(f"    [{fold}] {src_short:60s} | {wh:15s} | {loading:8s} | {srcset_info:10s} | Alt: {alt_info}")

                for bg in data['bgImages']:
                    fold = "ATF" if bg.get('isAboveFold') else "BTF"
                    src_short = str(bg.get('src', '') or '')[-60:]
                    print(f"    [BG-{fold}] {src_short:60s} | {bg.get('displayWidth', '?')}x{bg.get('displayHeight', '?')}")

        browser.close()

    # 3. Check HTTP headers for all unique images
    print(f"\n\nChecking HTTP headers for {len(all_image_urls)} unique images...")
    headers_data = check_image_headers(session, list(all_image_urls))

    for url, info in headers_data.items():
        if 'error' not in info:
            filename = urlparse(url).path.rsplit('/', 1)[-1][:40]
            ct = info.get('contentType', '')
            cl = info.get('contentLength', '?')
            cache = info.get('cacheControl', 'none')
            print(f"  {filename:40s} | {ct:25s} | {str(cl):>10s}B | Cache: {cache[:50]}")

    # 4. Check sitemaps
    print("\n\nChecking sitemaps...")
    for sitemap_url in [
        "https://jun.legal/sitemap.xml",
        "https://jun.legal/wp-sitemap.xml",
        "https://jun.legal/sitemap_index.xml",
        "https://jun.legal/robots.txt",
    ]:
        try:
            resp = session.get(sitemap_url, timeout=10)
            print(f"  {sitemap_url}: {resp.status_code} ({len(resp.text)} bytes)")
            if resp.status_code == 200 and len(resp.text) < 5000:
                print(f"    Content preview: {resp.text[:500]}")
        except Exception as e:
            print(f"  {sitemap_url}: ERROR - {e}")

    # Save detailed results
    output = {
        'pages': {},
        'imageHeaders': {},
        'discoveredPages': sorted(list(inner_pages)),
        'auditDate': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    for url, data in all_page_data.items():
        output['pages'][url] = data
    for url, info in headers_data.items():
        short = urlparse(url).path
        output['imageHeaders'][short] = info

    output_path = "/Users/davut/projects/claude-seo/scripts/jun_legal_deep_audit.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nDeep audit saved to: {output_path}")


if __name__ == '__main__':
    main()
