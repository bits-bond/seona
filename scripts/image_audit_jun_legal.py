"""
Comprehensive Image Optimization Audit for jun.legal
Analyzes: alt text, formats, sizing, lazy loading, file sizes, compression, SEO
"""

import json
import sys
import time
import requests
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

URLS_TO_AUDIT = [
    "https://jun.legal/",
    "https://jun.legal/leistungen",
    "https://jun.legal/ueber-uns",
    "https://jun.legal/kontakt",
    "https://jun.legal/blog",
]

RESULTS = {}

def get_image_file_size(url, session):
    """Get file size of an image via HEAD request, fallback to GET with stream."""
    try:
        resp = session.head(url, timeout=10, allow_redirects=True)
        size = resp.headers.get("content-length")
        content_type = resp.headers.get("content-type", "")
        if size:
            return int(size), content_type
        # Fallback: GET with stream
        resp = session.get(url, timeout=10, stream=True, allow_redirects=True)
        size = resp.headers.get("content-length")
        content_type = resp.headers.get("content-type", "")
        if size:
            resp.close()
            return int(size), content_type
        # Read full content
        data = resp.content
        return len(data), content_type
    except Exception as e:
        return None, str(e)


def analyze_page(page, url, session):
    """Analyze all images on a page."""
    print(f"\n{'='*80}")
    print(f"Analyzing: {url}")
    print(f"{'='*80}")

    try:
        page.goto(url, wait_until="networkidle", timeout=30000)
        time.sleep(2)
    except Exception as e:
        print(f"  ERROR loading page: {e}")
        return None

    # Take screenshot
    slug = urlparse(url).path.strip("/").replace("/", "_") or "homepage"
    screenshot_path = f"/Users/davut/projects/claude-seo/screenshots/jun_legal_{slug}.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"  Screenshot saved: {screenshot_path}")

    # Extract all image data via JS
    images_data = page.evaluate("""() => {
        const images = [];

        // Regular <img> tags
        document.querySelectorAll('img').forEach((img, idx) => {
            const rect = img.getBoundingClientRect();
            images.push({
                type: 'img',
                src: img.src || '',
                currentSrc: img.currentSrc || '',
                alt: img.getAttribute('alt'),
                altExists: img.hasAttribute('alt'),
                width: img.getAttribute('width'),
                height: img.getAttribute('height'),
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: rect.width,
                displayHeight: rect.height,
                loading: img.getAttribute('loading'),
                decoding: img.getAttribute('decoding'),
                fetchpriority: img.getAttribute('fetchpriority'),
                srcset: img.getAttribute('srcset'),
                sizes: img.getAttribute('sizes'),
                role: img.getAttribute('role'),
                ariaHidden: img.getAttribute('aria-hidden'),
                isAboveFold: rect.top < window.innerHeight,
                isVisible: rect.width > 0 && rect.height > 0,
                parentTag: img.parentElement ? img.parentElement.tagName : '',
                inPicture: img.closest('picture') !== null,
                cssClasses: img.className || '',
                index: idx
            });
        });

        // <picture> <source> elements
        document.querySelectorAll('picture source').forEach((source) => {
            images.push({
                type: 'picture-source',
                srcset: source.getAttribute('srcset'),
                type_attr: source.getAttribute('type'),
                media: source.getAttribute('media'),
                sizes: source.getAttribute('sizes')
            });
        });

        // CSS background images (main containers)
        const bgImages = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundImage;
            if (bg && bg !== 'none' && bg.includes('url(')) {
                const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
                if (match && match[1] && !match[1].startsWith('data:')) {
                    const rect = el.getBoundingClientRect();
                    bgImages.push({
                        type: 'background',
                        src: match[1],
                        element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
                        isAboveFold: rect.top < window.innerHeight,
                        displayWidth: rect.width,
                        displayHeight: rect.height
                    });
                }
            }
        });

        // SVG inline images
        const svgCount = document.querySelectorAll('svg').length;

        // Open Graph / meta images
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');

        return {
            images: images,
            backgroundImages: bgImages,
            svgCount: svgCount,
            ogImage: ogImage ? ogImage.getAttribute('content') : null,
            twitterImage: twitterImage ? twitterImage.getAttribute('content') : null,
            pageTitle: document.title,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        };
    }""")

    # Analyze file sizes for all images
    seen_urls = set()
    img_details = []

    for img in images_data['images']:
        if img['type'] != 'img':
            continue
        src = img.get('currentSrc') or img.get('src', '')
        if not src or src.startswith('data:') or src in seen_urls:
            continue
        seen_urls.add(src)

        file_size, content_type = get_image_file_size(src, session)

        # Determine format from URL and content-type
        parsed = urlparse(src)
        ext = parsed.path.rsplit('.', 1)[-1].lower() if '.' in parsed.path else ''

        img_detail = {
            **img,
            'fileSize': file_size,
            'contentType': content_type,
            'extension': ext,
            'filename': parsed.path.rsplit('/', 1)[-1] if '/' in parsed.path else parsed.path
        }
        img_details.append(img_detail)

        size_str = f"{file_size/1024:.1f} KB" if file_size else "unknown"
        alt_status = "MISSING" if not img['altExists'] else ("EMPTY" if img['alt'] == '' else f"'{img['alt'][:60]}'")
        print(f"  [{ext.upper() or '?'}] {img_detail['filename'][:50]:50s} | {size_str:>10s} | Alt: {alt_status}")

    # Background images
    bg_details = []
    for bg in images_data['backgroundImages']:
        src = bg.get('src', '')
        if not src or src in seen_urls:
            continue
        seen_urls.add(src)
        full_url = urljoin(url, src)
        file_size, content_type = get_image_file_size(full_url, session)

        parsed = urlparse(src)
        ext = parsed.path.rsplit('.', 1)[-1].lower() if '.' in parsed.path else ''

        bg_detail = {
            **bg,
            'fileSize': file_size,
            'contentType': content_type,
            'extension': ext,
            'filename': parsed.path.rsplit('/', 1)[-1]
        }
        bg_details.append(bg_detail)

        size_str = f"{file_size/1024:.1f} KB" if file_size else "unknown"
        print(f"  [BG-{ext.upper() or '?'}] {bg_detail['filename'][:50]:50s} | {size_str:>10s}")

    result = {
        'url': url,
        'pageTitle': images_data['pageTitle'],
        'imgElements': img_details,
        'backgroundImages': bg_details,
        'pictureSourceElements': [i for i in images_data['images'] if i['type'] == 'picture-source'],
        'svgCount': images_data['svgCount'],
        'ogImage': images_data['ogImage'],
        'twitterImage': images_data['twitterImage'],
        'totalImages': len(img_details),
        'totalBgImages': len(bg_details),
        'screenshot': screenshot_path
    }

    # Summary stats
    total_size = sum(i.get('fileSize', 0) or 0 for i in img_details + bg_details)
    print(f"\n  Summary: {len(img_details)} <img> + {len(bg_details)} BG images + {images_data['svgCount']} SVGs")
    print(f"  Total image weight: {total_size/1024:.1f} KB ({total_size/1024/1024:.2f} MB)")
    print(f"  OG Image: {images_data['ogImage'] or 'MISSING'}")
    print(f"  Twitter Image: {images_data['twitterImage'] or 'MISSING'}")

    return result


def check_image_sitemap(session, base_url):
    """Check for image sitemap."""
    print("\n\nChecking Image Sitemap...")
    sitemap_urls = [
        urljoin(base_url, '/sitemap.xml'),
        urljoin(base_url, '/sitemap_index.xml'),
        urljoin(base_url, '/image-sitemap.xml'),
    ]

    results = {}
    for surl in sitemap_urls:
        try:
            resp = session.get(surl, timeout=10)
            if resp.status_code == 200:
                has_image_ns = 'image:image' in resp.text or 'image:loc' in resp.text
                results[surl] = {
                    'status': resp.status_code,
                    'hasImageNamespace': has_image_ns,
                    'size': len(resp.text)
                }
                print(f"  {surl}: {resp.status_code} (image tags: {has_image_ns})")
            else:
                results[surl] = {'status': resp.status_code}
                print(f"  {surl}: {resp.status_code}")
        except Exception as e:
            results[surl] = {'error': str(e)}
            print(f"  {surl}: ERROR - {e}")

    return results


def main():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        all_results = {}
        for url in URLS_TO_AUDIT:
            result = analyze_page(page, url, session)
            if result:
                all_results[url] = result

        browser.close()

    # Check sitemap
    sitemap_results = check_image_sitemap(session, "https://jun.legal")

    # Compile full report
    full_report = {
        'pages': all_results,
        'sitemap': sitemap_results,
        'auditDate': time.strftime('%Y-%m-%d %H:%M:%S')
    }

    output_path = "/Users/davut/projects/claude-seo/scripts/jun_legal_image_audit.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(full_report, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n\nFull audit results saved to: {output_path}")
    return full_report


if __name__ == '__main__':
    main()
