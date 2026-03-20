#!/usr/bin/env python3
"""
Analyze page performance factors for SEO.

Checks render-blocking CSS/JS, image optimization, caching headers,
compression, and TTFB.

Usage:
    python analyze_performance.py https://example.com
    python analyze_performance.py https://example.com --json
    python analyze_performance.py https://example.com --timeout 15
"""

import argparse
import ipaddress
import json
import re
import socket
import sys
from typing import Optional
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: beautifulsoup4 required. Install with: pip install beautifulsoup4")
    sys.exit(1)


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ClaudeSEO/1.0; +https://github.com/DDX1/seona)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}


def _check_ssrf(url: str) -> Optional[str]:
    """Block requests to private/internal IPs."""
    parsed = urlparse(url)
    try:
        resolved_ip = socket.gethostbyname(parsed.hostname)
        ip = ipaddress.ip_address(resolved_ip)
        if ip.is_private or ip.is_loopback or ip.is_reserved:
            return f"Blocked: URL resolves to private/internal IP ({resolved_ip})"
    except (socket.gaierror, ValueError):
        pass
    return None


def _normalize_url(url: str) -> Optional[str]:
    """Normalize URL, return None if invalid."""
    parsed = urlparse(url)
    if not parsed.scheme:
        url = f"https://{url}"
        parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return None
    return url


def _analyze_css(soup: BeautifulSoup, base_url: str) -> dict:
    """Analyze CSS resources."""
    result = {
        "total_stylesheets": 0,
        "external_stylesheets": 0,
        "inline_styles": 0,
        "render_blocking": 0,
        "has_critical_css": False,
        "stylesheets": [],
    }

    for link in soup.find_all('link', rel='stylesheet'):
        href = link.get('href', '')
        if not href:
            continue

        result["total_stylesheets"] += 1
        is_external = href.startswith(('http://', 'https://', '//'))
        in_head = link.find_parent('head') is not None
        media = link.get('media', 'all')
        is_preload = link.get('rel') == 'preload'

        is_render_blocking = in_head and media == 'all' and not is_preload
        if is_render_blocking:
            result["render_blocking"] += 1
        if is_external:
            result["external_stylesheets"] += 1

        result["stylesheets"].append({
            "url": urljoin(base_url, href),
            "is_external": is_external,
            "in_head": in_head,
            "is_render_blocking": is_render_blocking,
        })

    result["inline_styles"] = len(soup.find_all('style'))

    for style in soup.find_all('style'):
        style_text = style.string or ''
        if 500 < len(style_text) < 15000:
            result["has_critical_css"] = True
            break

    return result


def _analyze_js(soup: BeautifulSoup, base_url: str) -> dict:
    """Analyze JavaScript resources."""
    result = {
        "total_scripts": 0,
        "external_scripts": 0,
        "inline_scripts": 0,
        "render_blocking": 0,
        "async_scripts": 0,
        "defer_scripts": 0,
        "module_scripts": 0,
        "scripts": [],
    }

    for script in soup.find_all('script'):
        src = script.get('src')
        if src:
            result["total_scripts"] += 1
            result["external_scripts"] += 1
            in_head = script.find_parent('head') is not None
            has_async = script.has_attr('async')
            has_defer = script.has_attr('defer')

            if script.get('type') == 'module':
                result["module_scripts"] += 1
            if in_head and not has_async and not has_defer:
                result["render_blocking"] += 1
            if has_async:
                result["async_scripts"] += 1
            if has_defer:
                result["defer_scripts"] += 1

            result["scripts"].append({
                "url": urljoin(base_url, src),
                "in_head": in_head,
                "has_async": has_async,
                "has_defer": has_defer,
                "is_render_blocking": in_head and not has_async and not has_defer,
            })
        else:
            if script.string and len(script.string.strip()) > 0:
                result["inline_scripts"] += 1
                result["total_scripts"] += 1

    return result


def _analyze_images(soup: BeautifulSoup) -> dict:
    """Analyze image optimization."""
    result = {
        "total_images": 0,
        "images_with_alt": 0,
        "images_without_alt": 0,
        "images_with_dimensions": 0,
        "images_with_lazy": 0,
        "images_with_srcset": 0,
        "modern_formats": 0,
        "legacy_formats": 0,
        "missing_dimensions": [],
        "format_breakdown": {},
    }

    for img in soup.find_all('img'):
        result["total_images"] += 1
        src = img.get('src', '')

        if img.get('alt'):
            result["images_with_alt"] += 1
        else:
            result["images_without_alt"] += 1

        if img.get('width') and img.get('height'):
            result["images_with_dimensions"] += 1
        elif src:
            result["missing_dimensions"].append(src[:80])

        if img.get('loading') == 'lazy':
            result["images_with_lazy"] += 1
        if img.get('srcset'):
            result["images_with_srcset"] += 1

        if src:
            ext = src.split('?')[0].split('.')[-1].lower()
            result["format_breakdown"][ext] = result["format_breakdown"].get(ext, 0) + 1
            if ext in ('webp', 'avif'):
                result["modern_formats"] += 1
            elif ext in ('jpg', 'jpeg', 'png', 'gif'):
                result["legacy_formats"] += 1

    for picture in soup.find_all('picture'):
        for source in picture.find_all('source'):
            srcset = source.get('srcset', '')
            if 'webp' in srcset or 'avif' in srcset:
                result["modern_formats"] += 1

    return result


def _analyze_caching(response) -> dict:
    """Analyze caching headers."""
    headers = response.headers
    result = {
        "has_cache_control": False,
        "cache_control_value": "",
        "has_etag": bool(headers.get('ETag')),
        "has_last_modified": bool(headers.get('Last-Modified')),
        "has_expires": bool(headers.get('Expires')),
        "max_age_seconds": 0,
        "is_cacheable": False,
        "caching_score": 0,
    }

    cache_control = headers.get('Cache-Control', '')
    if cache_control:
        result["has_cache_control"] = True
        result["cache_control_value"] = cache_control
        max_age_match = re.search(r'max-age=(\d+)', cache_control)
        if max_age_match:
            result["max_age_seconds"] = int(max_age_match.group(1))
        if 'no-store' not in cache_control and 'no-cache' not in cache_control:
            result["is_cacheable"] = True

    if result["has_etag"]:
        result["is_cacheable"] = True

    score = 0
    if result["has_cache_control"]:
        score += 30
    if result["has_etag"]:
        score += 25
    if result["has_last_modified"]:
        score += 15
    if result["max_age_seconds"] > 86400:
        score += 20
    elif result["max_age_seconds"] > 3600:
        score += 10
    if result["is_cacheable"]:
        score += 10
    result["caching_score"] = min(100, score)

    return result


def _analyze_compression(response) -> dict:
    """Analyze response compression."""
    content_encoding = response.headers.get('Content-Encoding', '')
    return {
        "has_gzip": 'gzip' in content_encoding,
        "has_brotli": 'br' in content_encoding,
        "content_encoding": content_encoding,
        "compressed_size": len(response.content),
    }


def _generate_issues(css, js, images, caching, compression, ttfb_ms) -> tuple:
    """Generate issues and recommendations."""
    issues = []
    recommendations = []

    if css["render_blocking"] > 0:
        issues.append(f"{css['render_blocking']} render-blocking CSS files")
        recommendations.append("Consider inlining critical CSS and deferring non-critical styles")
    if not css["has_critical_css"] and css["external_stylesheets"] > 2:
        recommendations.append("Consider inlining critical CSS for faster first paint")

    if js["render_blocking"] > 0:
        issues.append(f"{js['render_blocking']} render-blocking JavaScript files")
        recommendations.append("Add 'async' or 'defer' attribute to non-critical scripts")
    if js["external_scripts"] > 10:
        issues.append(f"Too many external scripts ({js['external_scripts']})")
        recommendations.append("Consider bundling scripts to reduce HTTP requests")

    if images["images_without_alt"] > 0:
        issues.append(f"{images['images_without_alt']} images missing alt text")
    if images["missing_dimensions"]:
        issues.append(f"{len(images['missing_dimensions'])} images missing width/height")
        recommendations.append("Add width and height attributes to prevent layout shifts (CLS)")
    if images["legacy_formats"] > 0 and images["modern_formats"] == 0:
        issues.append("No modern image formats (WebP/AVIF) detected")
        recommendations.append("Use WebP/AVIF formats with fallback for better compression")

    total_imgs = images["total_images"]
    if total_imgs > 3:
        lazy_ratio = images["images_with_lazy"] / total_imgs * 100
        if lazy_ratio < 50:
            recommendations.append(
                f"Add loading=\"lazy\" to below-fold images "
                f"({images['images_with_lazy']}/{total_imgs} use lazy loading)"
            )

    if not caching["has_cache_control"]:
        issues.append("Missing Cache-Control header")
        recommendations.append("Add Cache-Control header for static assets")
    elif caching["max_age_seconds"] < 3600:
        recommendations.append("Consider increasing cache max-age for static content")

    if not compression["has_gzip"] and not compression["has_brotli"]:
        issues.append("No compression detected")
        recommendations.append("Enable gzip or Brotli compression on the server")

    if ttfb_ms > 600:
        issues.append(f"Slow TTFB: {ttfb_ms:.0f}ms (target: <600ms)")
    elif ttfb_ms > 400:
        recommendations.append(f"TTFB could be improved: {ttfb_ms:.0f}ms")

    return issues, recommendations


def _calculate_score(css, js, images, caching, compression, ttfb_ms) -> int:
    """Calculate performance score (0-100)."""
    score = 100

    if css["render_blocking"] > 2:
        score -= 15
    elif css["render_blocking"] > 0:
        score -= 8

    if js["render_blocking"] > 3:
        score -= 20
    elif js["render_blocking"] > 0:
        score -= 10
    if js["external_scripts"] > 15:
        score -= 5

    total_imgs = images["total_images"]
    if total_imgs > 0:
        missing_ratio = len(images["missing_dimensions"]) / total_imgs
        score -= int(missing_ratio * 10)
        if images["modern_formats"] == 0 and images["legacy_formats"] > 3:
            score -= 10
        lazy_ratio = images["images_with_lazy"] / total_imgs
        if lazy_ratio < 0.3:
            score -= 5

    score -= (15 - int(caching["caching_score"] * 0.15))

    if not compression["has_gzip"] and not compression["has_brotli"]:
        score -= 10

    if ttfb_ms > 800:
        score -= 5
    elif ttfb_ms > 500:
        score -= 3

    return max(0, min(100, score))


def analyze_performance(url: str, timeout: int = 30) -> dict:
    """
    Analyze page performance factors.

    Returns a dictionary with CSS, JS, image, caching, and compression analysis,
    plus TTFB, issues, recommendations, and an overall score.
    """
    url = _normalize_url(url)
    if not url:
        return {"url": url, "error": "Invalid URL scheme", "score": 0}

    ssrf_error = _check_ssrf(url)
    if ssrf_error:
        return {"url": url, "error": ssrf_error, "score": 0}

    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"

    try:
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
    except requests.RequestException as e:
        return {"url": url, "error": str(e), "score": 0}

    ttfb_ms = response.elapsed.total_seconds() * 1000 if hasattr(response, 'elapsed') else 0
    total_size = len(response.content)

    if response.status_code != 200:
        return {"url": url, "error": f"HTTP {response.status_code}", "score": 0}

    soup = BeautifulSoup(response.text, "lxml" if "lxml" in sys.modules else "html.parser")

    css = _analyze_css(soup, base_url)
    js = _analyze_js(soup, base_url)
    images = _analyze_images(soup)
    caching = _analyze_caching(response)
    compression = _analyze_compression(response)
    issues, recommendations = _generate_issues(css, js, images, caching, compression, ttfb_ms)
    score = _calculate_score(css, js, images, caching, compression, ttfb_ms)

    return {
        "url": url,
        "score": score,
        "ttfb_ms": round(ttfb_ms, 1),
        "total_size_bytes": total_size,
        "css": css,
        "js": js,
        "images": images,
        "caching": caching,
        "compression": compression,
        "issues": issues,
        "recommendations": recommendations,
    }


def main():
    parser = argparse.ArgumentParser(description="Analyze page performance for SEO")
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    result = analyze_performance(args.url, timeout=args.timeout)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Performance Analysis: {result['url']}")
        print(f"{'=' * 50}")
        print(f"Score: {result['score']}/100")
        print(f"TTFB: {result['ttfb_ms']:.0f}ms")
        print(f"Page size: {result['total_size_bytes'] / 1024:.1f} KB")
        c = result['css']
        print(f"\nCSS: {c['total_stylesheets']} stylesheets, {c['render_blocking']} render-blocking")
        j = result['js']
        print(f"JS: {j['total_scripts']} scripts, {j['render_blocking']} render-blocking, "
              f"{j['async_scripts']} async, {j['defer_scripts']} defer")
        i = result['images']
        print(f"Images: {i['total_images']} total, {i['images_with_lazy']} lazy, "
              f"{i['modern_formats']} modern format")
        print(f"Caching: score {result['caching']['caching_score']}/100")
        comp = result['compression']
        print(f"Compression: {'brotli' if comp['has_brotli'] else 'gzip' if comp['has_gzip'] else 'none'}")
        if result['issues']:
            print(f"\nIssues:")
            for issue in result['issues']:
                print(f"  - {issue}")
        if result['recommendations']:
            print(f"\nRecommendations:")
            for rec in result['recommendations']:
                print(f"  - {rec}")


if __name__ == "__main__":
    main()
