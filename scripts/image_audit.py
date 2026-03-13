"""
Comprehensive Image Optimization Audit Script
Analyzes alt text, file sizes, formats, responsive images, lazy loading, CLS prevention, and filenames.
"""
from playwright.sync_api import sync_playwright
import json
import re
import os
from urllib.parse import urlparse, urljoin

SCREENSHOTS_DIR = "/Users/davut/projects/claude-seo/screenshots"
OUTPUT_DIR = "/Users/davut/projects/claude-seo/screenshots"

def analyze_page_images(page, url, page_name):
    """Extract and analyze all images on a page."""
    print(f"\n{'='*80}")
    print(f"Analyzing: {url}")
    print(f"{'='*80}")

    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  Error loading page: {e}")
        return None

    # Take desktop screenshot
    page.screenshot(path=f"{SCREENSHOTS_DIR}/{page_name}_desktop.png", full_page=True)

    # Collect all image data
    image_data = page.evaluate('''() => {
        const images = [];

        // Regular <img> elements
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
                classes: img.className,
                id: img.id,
                role: img.getAttribute('role'),
                ariaHidden: img.getAttribute('aria-hidden'),
                index: index,
                isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
            });
        });

        // <picture> elements analysis
        const pictureElements = document.querySelectorAll('picture');

        // Background images
        const bgImages = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
                const urls = bgImage.match(/url\(["']?([^"')]+)["']?\)/g);
                if (urls) {
                    urls.forEach(urlMatch => {
                        const cleanUrl = urlMatch.replace(/url\(["']?/, '').replace(/["']?\)/, '');
                        if (cleanUrl && !cleanUrl.startsWith('data:image/svg+xml') || cleanUrl.length > 200) {
                            bgImages.push({
                                type: 'background',
                                src: cleanUrl,
                                element: el.tagName,
                                classes: el.className,
                                isDataUri: cleanUrl.startsWith('data:')
                            });
                        }
                    });
                }
            }
        });

        // SVG elements (inline)
        const svgCount = document.querySelectorAll('svg').length;

        // Video poster images
        const videoPosterImages = [];
        document.querySelectorAll('video[poster]').forEach(v => {
            videoPosterImages.push({
                type: 'video-poster',
                src: v.poster,
                width: v.getAttribute('width'),
                height: v.getAttribute('height')
            });
        });

        return {
            images,
            bgImages,
            svgCount,
            videoPosterImages,
            pictureElementCount: pictureElements.length,
            viewportHeight: window.innerHeight,
            pageTitle: document.title,
            pageUrl: window.location.href
        };
    }''')

    return image_data


def get_image_file_size(page, url):
    """Get file size of an image via fetch."""
    if not url or url.startswith('data:'):
        return None
    try:
        result = page.evaluate('''async (url) => {
            try {
                const resp = await fetch(url, { method: 'HEAD' });
                const size = resp.headers.get('content-length');
                const contentType = resp.headers.get('content-type');
                return { size: size ? parseInt(size) : null, contentType };
            } catch(e) {
                return { size: null, contentType: null, error: e.message };
            }
        }''', url)
        return result
    except:
        return None


def get_image_format(src):
    """Determine image format from URL."""
    if not src:
        return 'unknown'
    parsed = urlparse(src)
    path = parsed.path.lower()
    if path.endswith('.webp'):
        return 'webp'
    elif path.endswith('.avif'):
        return 'avif'
    elif path.endswith('.png'):
        return 'png'
    elif path.endswith('.jpg') or path.endswith('.jpeg'):
        return 'jpg'
    elif path.endswith('.gif'):
        return 'gif'
    elif path.endswith('.svg'):
        return 'svg'
    elif path.endswith('.ico'):
        return 'ico'
    elif 'data:image/' in src:
        if 'svg' in src:
            return 'svg-data'
        elif 'webp' in src:
            return 'webp-data'
        elif 'png' in src:
            return 'png-data'
        return 'data-uri'
    return 'unknown'


def check_filename_seo(src):
    """Check if filename is SEO-friendly."""
    if not src or src.startswith('data:'):
        return {'seo_friendly': None, 'reason': 'data URI'}
    parsed = urlparse(src)
    filename = os.path.basename(parsed.path)

    issues = []

    # Check for random/hash-like filenames
    name_without_ext = os.path.splitext(filename)[0]
    if re.match(r'^[a-f0-9]{8,}$', name_without_ext, re.IGNORECASE):
        issues.append('Hash-basierter Dateiname')
    if re.match(r'^(img|image|photo|pic|screenshot)[-_]?\d*$', name_without_ext, re.IGNORECASE):
        issues.append('Generischer Dateiname')
    if re.match(r'^\d+$', name_without_ext):
        issues.append('Nur Zahlen im Dateinamen')
    if len(name_without_ext) > 50:
        issues.append('Dateiname zu lang')
    if '_' in name_without_ext:
        issues.append('Unterstriche statt Bindestriche')
    if name_without_ext != name_without_ext.lower():
        issues.append('Grossbuchstaben im Dateinamen')
    if re.search(r'%20|\s', name_without_ext):
        issues.append('Leerzeichen im Dateinamen')

    return {
        'filename': filename,
        'seo_friendly': len(issues) == 0,
        'issues': issues
    }


def main():
    pages_to_audit = [
        ('https://jun.legal/', 'homepage'),
        ('https://jun.legal/leistungen', 'leistungen'),
        ('https://jun.legal/ueber-uns', 'ueber-uns'),
        ('https://jun.legal/kontakt', 'kontakt'),
        ('https://jun.legal/blog', 'blog'),
        ('https://jun.legal/karriere', 'karriere'),
    ]

    all_results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        for url, page_name in pages_to_audit:
            data = analyze_page_images(page, url, page_name)
            if data is None:
                print(f"  Skipping {url} - failed to load")
                continue

            # Get file sizes for each image
            print(f"  Found {len(data['images'])} img elements, {len(data['bgImages'])} background images")

            for img in data['images']:
                if img['src'] and not img['src'].startswith('data:'):
                    size_info = get_image_file_size(page, img['src'])
                    img['fileSize'] = size_info.get('size') if size_info else None
                    img['serverContentType'] = size_info.get('contentType') if size_info else None
                    img['format'] = get_image_format(img['src'])
                    img['filenameAnalysis'] = check_filename_seo(img['src'])
                else:
                    img['fileSize'] = None
                    img['serverContentType'] = None
                    img['format'] = get_image_format(img['src'])
                    img['filenameAnalysis'] = check_filename_seo(img['src'])

            all_results[page_name] = data

        # Mobile screenshots for homepage
        print("\n--- Capturing mobile screenshots ---")
        mobile_context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        )
        mobile_page = mobile_context.new_page()
        try:
            mobile_page.goto('https://jun.legal/', wait_until='networkidle', timeout=30000)
            mobile_page.wait_for_timeout(2000)
            mobile_page.screenshot(path=f"{SCREENSHOTS_DIR}/homepage_mobile.png", full_page=True)
        except Exception as e:
            print(f"  Mobile screenshot error: {e}")

        mobile_context.close()
        browser.close()

    # Save raw data
    with open(f"{OUTPUT_DIR}/image_audit_raw.json", 'w') as f:
        json.dump(all_results, f, indent=2, default=str)

    print(f"\nRaw data saved to {OUTPUT_DIR}/image_audit_raw.json")
    print(f"Screenshots saved to {SCREENSHOTS_DIR}/")

    # Generate summary
    generate_summary(all_results)


def generate_summary(all_results):
    """Generate a detailed summary of findings."""
    print("\n\n" + "="*80)
    print("IMAGE OPTIMIZATION AUDIT SUMMARY")
    print("="*80)

    total_images = 0
    total_missing_alt = 0
    total_empty_alt = 0
    total_poor_alt = 0
    total_no_lazy = 0
    total_no_dimensions = 0
    total_legacy_format = 0
    total_oversized = 0
    total_no_srcset = 0
    total_poor_filename = 0

    for page_name, data in all_results.items():
        print(f"\n--- {page_name.upper()} ({data['pageUrl']}) ---")
        print(f"  Title: {data['pageTitle']}")
        print(f"  IMG elements: {len(data['images'])}")
        print(f"  Background images: {len(data['bgImages'])}")
        print(f"  Inline SVGs: {data['svgCount']}")
        print(f"  Picture elements: {data['pictureElementCount']}")

        for img in data['images']:
            total_images += 1
            src_short = img['src'][:100] if img['src'] else 'NO SRC'

            # Alt text analysis
            if not img['altPresent']:
                total_missing_alt += 1
                print(f"  [MISSING ALT] {src_short}")
            elif img['alt'] == '':
                total_empty_alt += 1
                # This is okay for decorative images
            elif img['alt'] and len(img['alt']) < 5:
                total_poor_alt += 1
                print(f"  [SHORT ALT] alt=\"{img['alt']}\" - {src_short}")

            # Lazy loading
            if not img['isAboveFold'] and img['loading'] != 'lazy' and img['isVisible']:
                total_no_lazy += 1

            # Dimensions / CLS
            if not img['width'] and not img['height'] and img['cssAspectRatio'] == 'auto' and img['isVisible']:
                total_no_dimensions += 1

            # Format
            fmt = img.get('format', 'unknown')
            if fmt in ('jpg', 'png', 'gif'):
                total_legacy_format += 1

            # File size
            if img.get('fileSize') and img['fileSize'] > 200000:  # > 200KB
                total_oversized += 1
                size_kb = img['fileSize'] / 1024
                print(f"  [OVERSIZED] {size_kb:.0f}KB - {src_short}")

            # Srcset
            if not img['srcset'] and not img['isInPicture'] and fmt not in ('svg', 'svg-data', 'ico') and img['isVisible']:
                total_no_srcset += 1

            # Filename
            fa = img.get('filenameAnalysis', {})
            if fa.get('seo_friendly') == False:
                total_poor_filename += 1

    print(f"\n{'='*80}")
    print(f"TOTALS ACROSS ALL PAGES")
    print(f"{'='*80}")
    print(f"Total images analyzed: {total_images}")
    print(f"Missing alt attribute: {total_missing_alt}")
    print(f"Empty alt (decorative): {total_empty_alt}")
    print(f"Poor/short alt text: {total_poor_alt}")
    print(f"Missing lazy loading (below fold): {total_no_lazy}")
    print(f"Missing dimensions (CLS risk): {total_no_dimensions}")
    print(f"Legacy formats (JPG/PNG/GIF): {total_legacy_format}")
    print(f"Oversized (>200KB): {total_oversized}")
    print(f"Missing srcset: {total_no_srcset}")
    print(f"Poor filenames: {total_poor_filename}")


if __name__ == '__main__':
    main()
