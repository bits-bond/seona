"""
Final pass: Get all image file sizes, check for WebP/AVIF support, analyze caching, and summarize.
"""

import json
import requests
from urllib.parse import urlparse

# All unique image URLs collected from the deep audit
IMAGE_URLS = [
    # Homepage images
    "https://jun.legal/wp-content/uploads/2020/03/IMG_2389_neu-1-scaled-e1590327333223.jpg",
    "https://jun.legal/wp-content/uploads/DSC06704_klein-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC07828-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/recruitingvid-e1589900480781.png",
    "https://jun.legal/wp-content/uploads/Gruppenbild-mit-Uni-4-1-scaled-e1712833448212.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/Sitemap-Whiteboard-in-Green-Purple-Basic-Style-2-e1729675314429-r7rqz83o53t3qjvn9idr9p6qnb57iyhmsz2iv8mryo.png",

    # Team page images (all 38+ portrait photos)
    "https://jun.legal/wp-content/uploads/2020/03/1024px-Chan-jo_Jun.jpg",
    "https://jun.legal/wp-content/uploads/DSC01636_Favorit-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC03038-1-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC08651-2-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC08567-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03569_1600.jpg",
    "https://jun.legal/wp-content/uploads/Screenshot-2025-03-25-151511.png",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03785_2_1600px.jpg",
    "https://jun.legal/wp-content/uploads/DSC05731-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03522_1600.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03358_1200px.jpg",
    "https://jun.legal/wp-content/uploads/Favorit-3-scaled.jpg",
    "https://jun.legal/wp-content/uploads/a14648e5-a52e-411e-969c-9b4c3146c522-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC05984-1-scaled.jpg",
    "https://jun.legal/wp-content/uploads/cz-final-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03315_1600px.jpg",
    "https://jun.legal/wp-content/uploads/DSC01876.jpg",
    "https://jun.legal/wp-content/uploads/DSC05855-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03836_1600.jpg",
    "https://jun.legal/wp-content/uploads/DSC08711-scaled.jpg",
    "https://jun.legal/wp-content/uploads/Kanzlei02-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC06294-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC05279_bearbeitet-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC06213-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03436_1200px.png",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03367_1600px.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03496_1600.jpg",
    "https://jun.legal/wp-content/uploads/DSC03136-ausgeschnitten-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC06286-final-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/05/Sebastian-Volk-1-e1752131532925.jpg",
    "https://jun.legal/wp-content/uploads/Favorit_Seong-Il-scaled.jpg",
    "https://jun.legal/wp-content/uploads/Favorit-zugeschnitten-scaled.jpg",
    "https://jun.legal/wp-content/uploads/2020/05/DSC_0056-2.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/DSC03366_1600px.jpg",
    "https://jun.legal/wp-content/uploads/DSC03177-scaled.jpg",
    "https://jun.legal/wp-content/uploads/P1010565-wi-scaled-e1727159300457.jpg",
    "https://jun.legal/wp-content/uploads/DSC06129-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC02099-scaled.jpg",
    "https://jun.legal/wp-content/uploads/DSC06101-kopie-scaled.jpg",

    # KI page
    "https://jun.legal/wp-content/uploads/Recht-trifft-KI.png",
    "https://jun.legal/wp-content/uploads/1000078418-150x150.jpg",
    "https://jun.legal/wp-content/uploads/2020/04/artikelbild.png",

    # Inner pages
    "https://jun.legal/wp-content/uploads/2020/03/16836202_1585389008141441_7133551455341049818_o.jpg",
    "https://jun.legal/wp-content/uploads/2020/03/tex1.jpg",

    # Kontakt
    "https://jun.legal/wp-content/uploads/Screenshot-2025-09-08-145823-rbgex03c22lijkq3u1gyq446ut1s2o359llh5dzjsw.jpg",
]

def main():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })

    results = []
    total_size = 0

    for url in IMAGE_URLS:
        try:
            # HEAD request first
            resp = session.head(url, timeout=10, allow_redirects=True)
            size = int(resp.headers.get('content-length', 0))
            content_type = resp.headers.get('content-type', '')
            cache_control = resp.headers.get('cache-control', '')
            last_modified = resp.headers.get('last-modified', '')

            if not size:
                resp = session.get(url, timeout=15, stream=True, allow_redirects=True)
                size = int(resp.headers.get('content-length', 0))
                if not size:
                    size = len(resp.content)
                content_type = resp.headers.get('content-type', '')
                cache_control = resp.headers.get('cache-control', '')
                resp.close()

            # Check if WebP version exists (WordPress convention)
            parsed = urlparse(url)
            webp_url = url + '.webp'
            has_webp = False
            try:
                wr = session.head(webp_url, timeout=5, allow_redirects=True)
                if wr.status_code == 200 and 'webp' in wr.headers.get('content-type', '').lower():
                    has_webp = True
            except:
                pass

            filename = parsed.path.rsplit('/', 1)[-1]
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else '?'

            result = {
                'url': url,
                'filename': filename,
                'extension': ext,
                'size_bytes': size,
                'size_kb': round(size / 1024, 1),
                'content_type': content_type,
                'cache_control': cache_control,
                'last_modified': last_modified,
                'has_webp': has_webp,
                'oversized': size > 200 * 1024,  # > 200KB
                'very_oversized': size > 500 * 1024,  # > 500KB
            }
            results.append(result)
            total_size += size

            status = "!!!" if result['very_oversized'] else ("!" if result['oversized'] else " ")
            print(f"  {status} {result['size_kb']:>8.1f} KB | {ext:4s} | WebP: {'Y' if has_webp else 'N'} | Cache: {cache_control[:30]:30s} | {filename[:60]}")

        except Exception as e:
            print(f"  ERROR: {url} - {e}")
            results.append({'url': url, 'error': str(e)})

    # Summary
    print(f"\n{'='*80}")
    print(f"SUMMARY")
    print(f"{'='*80}")
    print(f"Total unique images: {len(results)}")
    print(f"Total size: {total_size/1024:.1f} KB ({total_size/1024/1024:.2f} MB)")

    oversized = [r for r in results if r.get('oversized')]
    very_oversized = [r for r in results if r.get('very_oversized')]
    print(f"Oversized (>200KB): {len(oversized)}")
    print(f"Very oversized (>500KB): {len(very_oversized)}")

    webp_count = sum(1 for r in results if r.get('has_webp'))
    print(f"With WebP alternative: {webp_count}/{len(results)}")

    cached = sum(1 for r in results if r.get('cache_control'))
    print(f"With cache-control header: {cached}/{len(results)}")

    # Format breakdown
    formats = {}
    for r in results:
        ext = r.get('extension', '?')
        if ext not in formats:
            formats[ext] = {'count': 0, 'total_kb': 0}
        formats[ext]['count'] += 1
        formats[ext]['total_kb'] += r.get('size_kb', 0)
    print(f"\nFormat breakdown:")
    for fmt, data in sorted(formats.items()):
        print(f"  {fmt:6s}: {data['count']:3d} files, {data['total_kb']:.1f} KB total")

    # Top 10 largest
    print(f"\nTop 10 largest images:")
    sorted_results = sorted(results, key=lambda x: x.get('size_bytes', 0), reverse=True)
    for r in sorted_results[:10]:
        print(f"  {r.get('size_kb', 0):>8.1f} KB | {r.get('filename', '?')[:70]}")

    # Save
    output = {
        'images': results,
        'summary': {
            'total_images': len(results),
            'total_size_kb': round(total_size / 1024, 1),
            'total_size_mb': round(total_size / 1024 / 1024, 2),
            'oversized_count': len(oversized),
            'very_oversized_count': len(very_oversized),
            'webp_available': webp_count,
            'cached_count': cached,
            'formats': formats,
        }
    }

    output_path = "/Users/davut/projects/claude-seo/scripts/jun_legal_sizes.json"
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\nSaved to: {output_path}")


if __name__ == '__main__':
    main()
