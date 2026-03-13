"""
Comprehensive Image Optimization Audit Script v2
Targets actual discovered pages on jun.legal
"""
from playwright.sync_api import sync_playwright
import json
import re
import os
from urllib.parse import urlparse

SCREENSHOTS_DIR = "/Users/davut/projects/claude-seo/screenshots"

def analyze_page_images(page, url, page_name):
    """Extract and analyze all images on a page."""
    print(f"\nAnalyzing: {url}")

    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  Error loading page: {e}")
        return None

    # Check if it's a 404
    title = page.title()
    if '404' in title:
        print(f"  SKIPPED - 404 page: {title}")
        return None

    # Take screenshot
    page.screenshot(path=f"{SCREENSHOTS_DIR}/{page_name}_desktop.png", full_page=True)

    # Collect all image data
    image_data = page.evaluate(r'''() => {
        const images = [];

        document.querySelectorAll('img').forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(img);
            images.push({
                type: 'img',
                src: img.src || img.dataset.src || '',
                srcset: img.srcset || '',
                sizes: img.sizes || '',
                alt: img.hasAttribute('alt') ? img.alt : null,
                altPresent: img.hasAttribute('alt'),
                width: img.getAttribute('width'),
                height: img.getAttribute('height'),
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: Math.round(rect.width),
                displayHeight: Math.round(rect.height),
                loading: img.getAttribute('loading'),
                decoding: img.getAttribute('decoding'),
                fetchpriority: img.getAttribute('fetchpriority'),
                isAboveFold: rect.top < window.innerHeight,
                cssAspectRatio: computedStyle.aspectRatio,
                cssObjectFit: computedStyle.objectFit,
                parentTag: img.parentElement ? img.parentElement.tagName : '',
                isInPicture: img.closest('picture') !== null,
                pictureSourceFormats: img.closest('picture')
                    ? Array.from(img.closest('picture').querySelectorAll('source')).map(s => ({
                        type: s.type,
                        srcset: s.srcset,
                        media: s.media,
                        sizes: s.sizes
                    }))
                    : [],
                classes: img.className || '',
                id: img.id || '',
                role: img.getAttribute('role'),
                ariaHidden: img.getAttribute('aria-hidden'),
                index: index,
                isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
            });
        });

        // Background images
        const bgImages = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                const matches = bgImage.match(/url\(["']?([^"')]+)["']?\)/g);
                if (matches) {
                    matches.forEach(urlMatch => {
                        const cleanUrl = urlMatch.replace(/url\(["']?/, '').replace(/["']?\)/, '');
                        if (cleanUrl && !cleanUrl.startsWith('data:image/svg')) {
                            bgImages.push({
                                type: 'background',
                                src: cleanUrl,
                                element: el.tagName,
                                classes: (el.className && typeof el.className === 'string') ? el.className.substring(0, 200) : '',
                                isDataUri: cleanUrl.startsWith('data:')
                            });
                        }
                    });
                }
            }
        });

        const svgCount = document.querySelectorAll('svg').length;

        return {
            images,
            bgImages,
            svgCount,
            pictureElementCount: document.querySelectorAll('picture').length,
            viewportHeight: window.innerHeight,
            pageTitle: document.title,
            pageUrl: window.location.href
        };
    }''')

    return image_data


def get_image_file_size(page, url):
    """Get file size of an image via fetch."""
    if not url or url.startswith('data:'):
        return {'size': None, 'contentType': None}
    try:
        result = page.evaluate('''async (url) => {
            try {
                const resp = await fetch(url, { method: 'HEAD' });
                const size = resp.headers.get('content-length');
                const contentType = resp.headers.get('content-type');
                return { size: size ? parseInt(size) : null, contentType: contentType || null };
            } catch(e) {
                return { size: null, contentType: null };
            }
        }''', url)
        return result
    except:
        return {'size': None, 'contentType': None}


def get_format(src):
    if not src:
        return 'unknown'
    path = urlparse(src).path.lower()
    for ext, fmt in [('.webp','webp'), ('.avif','avif'), ('.png','png'), ('.jpg','jpg'), ('.jpeg','jpg'), ('.gif','gif'), ('.svg','svg'), ('.ico','ico')]:
        if path.endswith(ext):
            return fmt
    if src.startswith('data:'):
        return 'data-uri'
    return 'unknown'


def check_filename(src):
    if not src or src.startswith('data:'):
        return {'filename': None, 'issues': []}
    filename = os.path.basename(urlparse(src).path)
    name = os.path.splitext(filename)[0]
    issues = []
    if re.match(r'^[a-f0-9]{8,}$', name, re.I):
        issues.append('Hash-basierter Dateiname')
    if re.match(r'^(img|image|photo|pic|screenshot)[-_]?\d*$', name, re.I):
        issues.append('Generischer Dateiname')
    if re.match(r'^\d+$', name):
        issues.append('Nur Zahlen')
    if '_' in name and '-' not in name:
        issues.append('Unterstriche statt Bindestriche')
    if name != name.lower() and not re.match(r'^[A-Z][a-z]', name):
        issues.append('Gemischte Gross-/Kleinschreibung')
    return {'filename': filename, 'issues': issues}


def main():
    pages = [
        ('https://jun.legal/', 'homepage'),
        ('https://jun.legal/kontakt/', 'kontakt'),
        ('https://jun.legal/karriere/', 'karriere'),
        ('https://jun.legal/team/', 'team'),
        ('https://jun.legal/it-vertragsrecht/', 'it-vertragsrecht'),
        ('https://jun.legal/datenschutz-kompetenz/', 'datenschutz'),
        ('https://jun.legal/ki/', 'ki'),
        ('https://jun.legal/urheberrecht/', 'urheberrecht'),
        ('https://jun.legal/hatespeech-fake-news/', 'hatespeech'),
        ('https://jun.legal/news/', 'news'),
        ('https://jun.legal/impressum/', 'impressum'),
    ]

    all_results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()

        for url, name in pages:
            data = analyze_page_images(page, url, name)
            if data is None:
                continue

            print(f"  {len(data['images'])} img elements, {len(data['bgImages'])} bg images, {data['svgCount']} SVGs, {data['pictureElementCount']} picture elements")

            for img in data['images']:
                src = img['src']
                if src and not src.startswith('data:'):
                    size_info = get_image_file_size(page, src)
                    img['fileSize'] = size_info.get('size')
                    img['serverContentType'] = size_info.get('contentType')
                else:
                    img['fileSize'] = None
                    img['serverContentType'] = None
                img['format'] = get_format(src)
                img['filenameCheck'] = check_filename(src)

            # Also check bg image sizes
            for bg in data['bgImages']:
                if not bg['isDataUri']:
                    size_info = get_image_file_size(page, bg['src'])
                    bg['fileSize'] = size_info.get('size')
                    bg['serverContentType'] = size_info.get('contentType')
                    bg['format'] = get_format(bg['src'])

            all_results[name] = data

        # Mobile screenshot for homepage
        mobile_ctx = browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
        )
        mp = mobile_ctx.new_page()
        try:
            mp.goto('https://jun.legal/', wait_until='networkidle', timeout=30000)
            mp.wait_for_timeout(2000)
            mp.screenshot(path=f"{SCREENSHOTS_DIR}/homepage_mobile.png", full_page=True)
        except Exception as e:
            print(f"Mobile error: {e}")
        mobile_ctx.close()

        browser.close()

    # Save raw JSON
    with open(f"{SCREENSHOTS_DIR}/image_audit_raw.json", 'w') as f:
        json.dump(all_results, f, indent=2, default=str)

    # Print detailed report
    print_detailed_report(all_results)


def print_detailed_report(all_results):
    print("\n\n" + "="*100)
    print("DETAILED IMAGE AUDIT REPORT - jun.legal")
    print("="*100)

    for page_name, data in all_results.items():
        print(f"\n{'='*80}")
        print(f"PAGE: {data['pageTitle']} ({data['pageUrl']})")
        print(f"{'='*80}")
        print(f"  <img> elements: {len(data['images'])}")
        print(f"  Background images: {len(data['bgImages'])}")
        print(f"  Inline SVGs: {data['svgCount']}")
        print(f"  <picture> elements: {data['pictureElementCount']}")

        print(f"\n  --- IMG ELEMENTS ---")
        for i, img in enumerate(data['images']):
            src_display = img['src'][:120] if img['src'] else '(no src)'
            print(f"\n  [{i+1}] {src_display}")
            print(f"      Format: {img['format']}")
            if img['fileSize']:
                print(f"      File size: {img['fileSize']/1024:.1f} KB")
            print(f"      Alt present: {img['altPresent']}, Alt text: \"{img['alt']}\"")
            print(f"      Dimensions attr: width={img['width']}, height={img['height']}")
            print(f"      Natural size: {img['naturalWidth']}x{img['naturalHeight']}")
            print(f"      Display size: {img['displayWidth']}x{img['displayHeight']}")
            print(f"      Loading: {img['loading']}, Decoding: {img['decoding']}")
            print(f"      Above fold: {img['isAboveFold']}, Visible: {img['isVisible']}")
            print(f"      srcset: {'YES' if img['srcset'] else 'NO'}")
            print(f"      In <picture>: {img['isInPicture']}")
            if img['isInPicture'] and img['pictureSourceFormats']:
                for src_fmt in img['pictureSourceFormats']:
                    print(f"        <source> type={src_fmt['type']} media={src_fmt['media']}")
            print(f"      CSS aspect-ratio: {img['cssAspectRatio']}, object-fit: {img['cssObjectFit']}")
            fn = img.get('filenameCheck', {})
            if fn.get('issues'):
                print(f"      Filename issues: {', '.join(fn['issues'])} ({fn['filename']})")

        if data['bgImages']:
            print(f"\n  --- BACKGROUND IMAGES ---")
            for i, bg in enumerate(data['bgImages']):
                src_display = bg['src'][:120] if not bg['isDataUri'] else '(data URI)'
                print(f"  [{i+1}] {src_display}")
                print(f"      Element: <{bg['element']}>, Format: {bg.get('format', 'n/a')}")
                if bg.get('fileSize'):
                    print(f"      File size: {bg['fileSize']/1024:.1f} KB")


if __name__ == '__main__':
    main()
