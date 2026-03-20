#!/usr/bin/env python3
"""
Analyze mobile SEO factors for a URL.

Checks viewport configuration, touch target sizes, font sizes,
responsive design indicators, and mobile-specific features.

Usage:
    python analyze_mobile.py https://example.com
    python analyze_mobile.py https://example.com --json
    python analyze_mobile.py https://example.com --timeout 15
"""

import argparse
import ipaddress
import json
import re
import socket
import sys
from typing import Optional
from urllib.parse import urlparse

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


MOBILE_USER_AGENT = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
)

MIN_TOUCH_TARGET = 44  # px (Apple recommendation)


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


def _analyze_viewport(soup: BeautifulSoup) -> dict:
    """Analyze viewport meta tag."""
    result = {
        "has_viewport": False,
        "viewport_content": "",
        "has_width_device": False,
        "has_initial_scale": False,
        "user_scalable_disabled": False,
        "maximum_scale_restrictive": False,
        "issues": [],
    }

    meta = soup.find('meta', attrs={'name': 'viewport'})
    if not meta:
        result["issues"].append("Missing viewport meta tag")
        return result

    result["has_viewport"] = True
    content = meta.get('content', '')
    result["viewport_content"] = content

    directives = {}
    for part in content.split(','):
        if '=' in part:
            key, value = part.split('=', 1)
            directives[key.strip().lower()] = value.strip().lower()

    if directives.get('width') == 'device-width':
        result["has_width_device"] = True
    elif 'width' in directives:
        result["issues"].append(f"Viewport width set to fixed value: {directives['width']}")

    if 'initial-scale' in directives:
        result["has_initial_scale"] = True

    if directives.get('user-scalable') in ('no', '0'):
        result["user_scalable_disabled"] = True
        result["issues"].append("Pinch-to-zoom disabled (user-scalable=no)")

    if 'maximum-scale' in directives:
        try:
            max_scale = float(directives['maximum-scale'])
            if max_scale < 2.0:
                result["maximum_scale_restrictive"] = True
                result["issues"].append(f"Maximum scale too restrictive: {max_scale}")
        except ValueError:
            pass

    return result


def _analyze_touch_targets(soup: BeautifulSoup) -> dict:
    """Analyze touch target sizes."""
    result = {
        "total_interactive": 0,
        "small_targets": 0,
        "small_target_elements": [],
    }

    interactive = (
        soup.find_all('a', href=True) +
        soup.find_all('button') +
        soup.find_all('input', type=['submit', 'button', 'checkbox', 'radio']) +
        soup.find_all('select')
    )
    result["total_interactive"] = len(interactive)

    for el in interactive:
        style = el.get('style', '')
        width_match = re.search(r'width:\s*(\d+)px', style)
        height_match = re.search(r'height:\s*(\d+)px', style)

        is_small = False
        if width_match and int(width_match.group(1)) < MIN_TOUCH_TARGET:
            is_small = True
        if height_match and int(height_match.group(1)) < MIN_TOUCH_TARGET:
            is_small = True

        if is_small:
            result["small_targets"] += 1
            text = el.get_text(strip=True)
            result["small_target_elements"].append({
                "tag": el.name,
                "text": text[:30] if text else "",
                "style": style[:50] if style else "",
            })

    return result


def _analyze_fonts(soup: BeautifulSoup, html: str) -> dict:
    """Analyze font sizes for mobile readability."""
    result = {
        "has_font_size_adjust": False,
        "uses_relative_units": False,
        "small_font_detected": False,
        "small_font_elements": [],
        "base_font_size": "",
    }

    if 'font-size-adjust' in html:
        result["has_font_size_adjust"] = True

    style_tags = soup.find_all('style')
    inline_styles = [el.get('style', '') for el in soup.find_all(style=True)]
    all_styles = '\n'.join([s.string or '' for s in style_tags] + inline_styles)

    px_fonts = re.findall(r'font-size:\s*(\d+)px', all_styles)
    for size in px_fonts:
        if int(size) < 14:
            result["small_font_detected"] = True
            result["small_font_elements"].append({"size": f"{size}px"})

    if any(unit in all_styles for unit in ('rem', 'em', '%')):
        result["uses_relative_units"] = True

    html_tag = soup.find('html')
    if html_tag:
        style = html_tag.get('style', '')
        font_match = re.search(r'font-size:\s*([^;]+)', style)
        if font_match:
            result["base_font_size"] = font_match.group(1).strip()

    return result


def _analyze_responsive(soup: BeautifulSoup, html: str) -> dict:
    """Analyze responsive design features."""
    result = {
        "has_media_queries": '@media' in html,
        "has_responsive_images": False,
        "has_srcset": False,
        "has_picture_element": bool(soup.find('picture')),
        "has_mobile_stylesheet": False,
        "uses_flexbox": 'display: flex' in html or 'display:flex' in html,
        "uses_grid": 'display: grid' in html or 'display:grid' in html,
    }

    for img in soup.find_all('img'):
        if img.get('srcset'):
            result["has_srcset"] = True
            result["has_responsive_images"] = True
            break

    if result["has_picture_element"]:
        result["has_responsive_images"] = True

    for link in soup.find_all('link', rel='stylesheet'):
        media = link.get('media', '')
        if 'handheld' in media or 'max-width' in media:
            result["has_mobile_stylesheet"] = True

    return result


def _analyze_features(soup: BeautifulSoup) -> dict:
    """Analyze mobile-specific features."""
    result = {
        "has_apple_touch_icon": bool(soup.find('link', rel=re.compile('apple-touch-icon'))),
        "has_theme_color": bool(soup.find('meta', attrs={'name': 'theme-color'})),
        "has_manifest": bool(soup.find('link', rel='manifest')),
        "has_mobile_app_links": False,
        "apple_app_id": "",
        "google_play_id": "",
    }

    ios_app = soup.find('meta', attrs={'name': 'apple-itunes-app'})
    if ios_app:
        result["has_mobile_app_links"] = True
        content = ios_app.get('content', '')
        id_match = re.search(r'app-id=(\d+)', content)
        if id_match:
            result["apple_app_id"] = id_match.group(1)

    if soup.find('link', rel='alternate', href=re.compile(r'android-app://')):
        result["has_mobile_app_links"] = True

    return result


def _generate_issues(viewport, touch, fonts, responsive, features) -> tuple:
    """Generate issues and recommendations."""
    issues = []
    recommendations = []

    if not viewport["has_viewport"]:
        issues.append("Missing viewport meta tag")
        recommendations.append('Add: <meta name="viewport" content="width=device-width, initial-scale=1">')
    else:
        if not viewport["has_width_device"]:
            issues.append("Viewport width not set to device-width")
        if viewport["user_scalable_disabled"]:
            issues.append("Pinch-to-zoom is disabled (accessibility issue)")
            recommendations.append("Remove user-scalable=no to allow zooming")
        if viewport["maximum_scale_restrictive"]:
            issues.append("Maximum scale is too restrictive")
    issues.extend(viewport["issues"])

    if touch["small_targets"] > 0:
        issues.append(f"{touch['small_targets']} touch targets may be too small (<{MIN_TOUCH_TARGET}px)")
        recommendations.append(f"Ensure touch targets are at least {MIN_TOUCH_TARGET}x{MIN_TOUCH_TARGET}px")

    if fonts["small_font_detected"]:
        issues.append("Small font sizes detected (<14px)")
        recommendations.append("Use minimum 16px font size for body text on mobile")

    if not responsive["has_media_queries"]:
        issues.append("No media queries detected")
        recommendations.append("Add responsive breakpoints for mobile devices")
    if not responsive["has_responsive_images"]:
        recommendations.append("Consider using srcset for responsive images")

    if not features["has_apple_touch_icon"]:
        recommendations.append("Add apple-touch-icon for iOS home screen")
    if not features["has_theme_color"]:
        recommendations.append("Add theme-color meta tag for mobile browsers")
    if not features["has_manifest"]:
        recommendations.append("Consider adding a web app manifest for PWA support")

    return issues, recommendations


def _calculate_score(viewport, touch, fonts, responsive, features) -> int:
    """Calculate mobile-friendliness score (0-100)."""
    score = 100

    if not viewport["has_viewport"]:
        score -= 30
    else:
        if not viewport["has_width_device"]:
            score -= 15
        if viewport["user_scalable_disabled"]:
            score -= 10
        if viewport["maximum_scale_restrictive"]:
            score -= 5

    if touch["small_targets"] > 5:
        score -= 15
    elif touch["small_targets"] > 0:
        score -= 8

    if fonts["small_font_detected"]:
        score -= 15

    if not responsive["has_media_queries"]:
        score -= 15
    if not responsive["has_responsive_images"]:
        score -= 5

    if not features["has_apple_touch_icon"]:
        score -= 3
    if not features["has_theme_color"]:
        score -= 2
    if not features["has_manifest"]:
        score -= 5

    return max(0, min(100, score))


def analyze_mobile(url: str, timeout: int = 30) -> dict:
    """
    Analyze mobile SEO factors for a URL.

    Returns a dictionary with viewport, touch targets, fonts, responsive design,
    mobile features, issues, recommendations, and an overall score.
    """
    url = _normalize_url(url)
    if not url:
        return {"url": url, "error": "Invalid URL scheme", "score": 0}

    ssrf_error = _check_ssrf(url)
    if ssrf_error:
        return {"url": url, "error": ssrf_error, "score": 0}

    headers = {
        "User-Agent": MOBILE_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        if response.status_code != 200:
            return {"url": url, "error": f"HTTP {response.status_code}", "score": 0}
    except requests.RequestException as e:
        return {"url": url, "error": str(e), "score": 0}

    html = response.text
    soup = BeautifulSoup(html, "lxml" if "lxml" in sys.modules else "html.parser")

    viewport = _analyze_viewport(soup)
    touch = _analyze_touch_targets(soup)
    fonts = _analyze_fonts(soup, html)
    responsive = _analyze_responsive(soup, html)
    features = _analyze_features(soup)
    issues, recommendations = _generate_issues(viewport, touch, fonts, responsive, features)
    score = _calculate_score(viewport, touch, fonts, responsive, features)

    return {
        "url": url,
        "score": score,
        "viewport": viewport,
        "touch_targets": touch,
        "fonts": fonts,
        "responsive": responsive,
        "features": features,
        "issues": issues,
        "recommendations": recommendations,
    }


def main():
    parser = argparse.ArgumentParser(description="Analyze mobile SEO factors")
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    result = analyze_mobile(args.url, timeout=args.timeout)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Mobile Analysis: {result['url']}")
        print(f"{'=' * 50}")
        print(f"Score: {result['score']}/100")
        v = result['viewport']
        print(f"\nViewport: {'present' if v['has_viewport'] else 'MISSING'}")
        if v['has_viewport']:
            print(f"  width=device-width: {'yes' if v['has_width_device'] else 'no'}")
            print(f"  initial-scale: {'yes' if v['has_initial_scale'] else 'no'}")
        t = result['touch_targets']
        print(f"\nTouch Targets: {t['total_interactive']} interactive elements")
        if t['small_targets']:
            print(f"  Small targets: {t['small_targets']}")
        r = result['responsive']
        print(f"\nResponsive: media queries={'yes' if r['has_media_queries'] else 'no'}, "
              f"srcset={'yes' if r['has_srcset'] else 'no'}")
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
