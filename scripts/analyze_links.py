#!/usr/bin/env python3
"""
Analyze URL structure and link quality for SEO.

Evaluates anchor text quality, URL structure optimization, pagination
implementation, and internal/external link patterns.

Usage:
    python analyze_links.py https://example.com
    python analyze_links.py https://example.com --json
    python analyze_links.py https://example.com --timeout 15
"""

import argparse
import ipaddress
import json
import re
import socket
import sys
from collections import Counter
from typing import Optional
from urllib.parse import parse_qs, urljoin, urlparse

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
    "Accept-Language": "en-US,en;q=0.5",
}

GENERIC_ANCHORS = {
    'click here', 'here', 'read more', 'more', 'link', 'this',
    'click', 'learn more', 'see more', 'view more', 'continue',
    'go', 'visit', 'check it out', 'details', 'info', 'download',
    'article', 'page', 'website', 'site', 'read', 'view',
}

SESSION_PATTERNS = [
    r'session[_-]?id', r'sess[_-]?id', r'jsession', r'phpsess',
    r'sid=', r'aspsession', r'cfid', r'cftoken',
]

TRACKING_PARAMS = {
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'msclkid', 'dclid', 'mc_cid', 'mc_eid',
    'ref', 'source', 'affiliate',
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


def _analyze_url_structure(url: str) -> dict:
    """Analyze URL structure quality."""
    parsed = urlparse(url)
    result = {
        "protocol": parsed.scheme,
        "domain": parsed.netloc,
        "path": parsed.path,
        "path_depth": len([p for p in parsed.path.split('/') if p]),
        "url_length": len(url),
        "has_parameters": bool(parsed.query),
        "parameter_count": 0,
        "has_fragment": bool(parsed.fragment),
        "has_keywords": False,
        "keywords_in_url": [],
        "uses_hyphens": '-' in parsed.path,
        "uses_underscores": '_' in parsed.path,
        "has_uppercase": parsed.path != parsed.path.lower(),
        "has_special_chars": bool(re.search(r'[^a-zA-Z0-9/_\-.]', parsed.path)),
        "is_too_long": len(url) > 75,
        "is_too_deep": len([p for p in parsed.path.split('/') if p]) > 4,
        "has_session_id": False,
        "has_tracking_params": False,
        "issues": [],
    }

    if parsed.query:
        params = parse_qs(parsed.query)
        result["parameter_count"] = len(params)

        query_lower = parsed.query.lower()
        for pattern in SESSION_PATTERNS:
            if re.search(pattern, query_lower):
                result["has_session_id"] = True
                result["issues"].append("Session ID detected in URL")
                break

        for param in params.keys():
            if param.lower() in TRACKING_PARAMS:
                result["has_tracking_params"] = True

    words = re.findall(r'[a-z]+', parsed.path.lower())
    if words:
        result["has_keywords"] = True
        result["keywords_in_url"] = [w for w in words if len(w) > 3][:5]

    if result["is_too_long"]:
        result["issues"].append(f"URL too long: {result['url_length']} chars (target: <75)")
    if result["is_too_deep"]:
        result["issues"].append(f"URL too deep: {result['path_depth']} levels (target: <=4)")
    if result["uses_underscores"]:
        result["issues"].append("URL uses underscores (prefer hyphens)")
    if result["has_uppercase"]:
        result["issues"].append("URL contains uppercase characters")

    return result


def _analyze_anchor_text(soup: BeautifulSoup, base_domain: str, base_url: str) -> dict:
    """Analyze anchor text quality."""
    result = {
        "total_links": 0,
        "internal_links": 0,
        "external_links": 0,
        "descriptive_anchors": 0,
        "generic_anchors": 0,
        "image_links": 0,
        "empty_anchors": 0,
        "generic_anchor_list": [],
        "anchor_text_distribution": {},
        "keyword_anchors": [],
        "nofollow_internal": 0,
        "nofollow_external": 0,
        "sponsored_links": 0,
        "ugc_links": 0,
    }

    anchor_texts = Counter()

    for a in soup.find_all('a', href=True):
        href = a.get('href', '')
        if not href or href.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
            continue

        result["total_links"] += 1
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)

        is_internal = parsed.netloc == base_domain or not parsed.netloc
        if is_internal:
            result["internal_links"] += 1
        else:
            result["external_links"] += 1

        anchor_text = a.get_text(strip=True)
        img = a.find('img')

        if img and not anchor_text:
            result["image_links"] += 1
            anchor_text = img.get('alt', '')

        if not anchor_text:
            result["empty_anchors"] += 1
            continue

        anchor_lower = anchor_text.lower().strip()
        anchor_texts[anchor_lower] += 1

        if anchor_lower in GENERIC_ANCHORS or len(anchor_lower) <= 3:
            result["generic_anchors"] += 1
            if len(result["generic_anchor_list"]) < 20:
                result["generic_anchor_list"].append({
                    "text": anchor_text[:50],
                    "href": href[:80],
                    "is_internal": is_internal,
                })
        else:
            result["descriptive_anchors"] += 1
            if 3 <= len(anchor_text) <= 50:
                result["keyword_anchors"].append(anchor_text)

        rel = a.get('rel', [])
        if isinstance(rel, str):
            rel = rel.split()
        if 'nofollow' in rel:
            if is_internal:
                result["nofollow_internal"] += 1
            else:
                result["nofollow_external"] += 1
        if 'sponsored' in rel:
            result["sponsored_links"] += 1
        if 'ugc' in rel:
            result["ugc_links"] += 1

    result["anchor_text_distribution"] = dict(anchor_texts.most_common(10))
    result["keyword_anchors"] = result["keyword_anchors"][:20]

    return result


def _analyze_pagination(soup: BeautifulSoup, base_url: str) -> dict:
    """Analyze pagination implementation."""
    result = {
        "has_pagination": False,
        "has_rel_next": False,
        "has_rel_prev": False,
        "next_url": "",
        "prev_url": "",
        "pagination_type": "",
        "page_numbers_found": [],
        "pagination_links": [],
        "issues": [],
    }

    for link in soup.find_all('link', rel=True):
        rel = link.get('rel', [])
        if isinstance(rel, str):
            rel = [rel]
        if 'next' in rel:
            result["has_rel_next"] = True
            result["next_url"] = link.get('href', '')
            result["has_pagination"] = True
        if 'prev' in rel:
            result["has_rel_prev"] = True
            result["prev_url"] = link.get('href', '')
            result["has_pagination"] = True

    pagination_patterns = [r'/page/(\d+)', r'[?&]page=(\d+)', r'[?&]p=(\d+)']

    for a in soup.find_all('a', href=True):
        href = a.get('href', '')
        for pattern in pagination_patterns:
            match = re.search(pattern, href)
            if match:
                result["has_pagination"] = True
                page_num = int(match.group(1))
                if page_num not in result["page_numbers_found"]:
                    result["page_numbers_found"].append(page_num)
                    result["pagination_links"].append(href)

    if result["has_pagination"]:
        if result["page_numbers_found"]:
            result["pagination_type"] = "numbered"
        elif soup.find(class_=re.compile(r'load[-_]?more|infinite', re.I)):
            result["pagination_type"] = "load-more"
        if not result["has_rel_next"] and not result["has_rel_prev"]:
            result["issues"].append('Pagination detected but missing rel="next"/rel="prev"')

    return result


def _get_external_domains(soup: BeautifulSoup, base_domain: str, base_url: str) -> list:
    """Get list of external domains linked to."""
    domains = set()
    for a in soup.find_all('a', href=True):
        href = a.get('href', '')
        if not href:
            continue
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        if parsed.netloc and parsed.netloc != base_domain:
            domains.add(parsed.netloc)
    return sorted(domains)


def _generate_issues(url_structure, anchor_text, pagination) -> tuple:
    """Generate issues and recommendations."""
    issues = list(url_structure["issues"])
    recommendations = []

    if url_structure["has_parameters"] and not url_structure["has_tracking_params"]:
        recommendations.append("Consider using URL rewriting for cleaner URLs")

    a = anchor_text
    if a["total_links"] > 0:
        generic_ratio = a["generic_anchors"] / a["total_links"] * 100
        if generic_ratio > 20:
            issues.append(f"{generic_ratio:.0f}% of links use generic anchor text")
            recommendations.append("Replace generic anchors ('click here', 'read more') with descriptive text")

    if a["empty_anchors"] > 0:
        issues.append(f"{a['empty_anchors']} links have empty anchor text")
        recommendations.append("Add descriptive text or alt text for image links")

    if a["nofollow_internal"] > 0:
        issues.append(f"{a['nofollow_internal']} internal links have nofollow attribute")
        recommendations.append("Remove nofollow from internal links to allow PageRank flow")

    issues.extend(pagination["issues"])
    if pagination["has_pagination"] and not pagination["has_rel_next"]:
        recommendations.append('Add rel="next" and rel="prev" to pagination links')

    return issues, recommendations


def _calculate_score(url_structure, anchor_text, pagination) -> int:
    """Calculate links quality score (0-100)."""
    score = 100

    u = url_structure
    if u["is_too_long"]:
        score -= 10
    if u["is_too_deep"]:
        score -= 8
    if u["uses_underscores"]:
        score -= 5
    if u["has_session_id"]:
        score -= 10
    if u["has_uppercase"]:
        score -= 2

    a = anchor_text
    if a["total_links"] > 0:
        generic_ratio = a["generic_anchors"] / a["total_links"]
        if generic_ratio > 0.3:
            score -= 20
        elif generic_ratio > 0.15:
            score -= 10

        empty_ratio = a["empty_anchors"] / a["total_links"]
        if empty_ratio > 0.1:
            score -= 10
        elif empty_ratio > 0.05:
            score -= 5

        if a["nofollow_internal"] > 0:
            score -= 10

    if pagination["has_pagination"] and not pagination["has_rel_next"]:
        score -= 15

    return max(0, min(100, score))


def analyze_links(url: str, timeout: int = 30) -> dict:
    """
    Analyze URL structure and link quality.

    Returns a dictionary with URL structure analysis, anchor text quality,
    pagination, external domains, issues, recommendations, and a score.
    """
    url = _normalize_url(url)
    if not url:
        return {"url": url, "error": "Invalid URL scheme", "score": 0}

    ssrf_error = _check_ssrf(url)
    if ssrf_error:
        return {"url": url, "error": ssrf_error, "score": 0}

    try:
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=timeout)
        if response.status_code != 200:
            return {"url": url, "error": f"HTTP {response.status_code}", "score": 0}
    except requests.RequestException as e:
        return {"url": url, "error": str(e), "score": 0}

    soup = BeautifulSoup(response.text, "lxml" if "lxml" in sys.modules else "html.parser")
    parsed_url = urlparse(url)
    base_domain = parsed_url.netloc

    url_structure = _analyze_url_structure(url)
    anchor_text = _analyze_anchor_text(soup, base_domain, url)
    pagination = _analyze_pagination(soup, url)
    external_domains = _get_external_domains(soup, base_domain, url)
    issues, recommendations = _generate_issues(url_structure, anchor_text, pagination)
    score = _calculate_score(url_structure, anchor_text, pagination)

    return {
        "url": url,
        "score": score,
        "url_structure": url_structure,
        "anchor_text": anchor_text,
        "pagination": pagination,
        "external_domains": external_domains,
        "issues": issues,
        "recommendations": recommendations,
    }


def main():
    parser = argparse.ArgumentParser(description="Analyze URL structure and link quality for SEO")
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    result = analyze_links(args.url, timeout=args.timeout)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Links Analysis: {result['url']}")
        print(f"{'=' * 50}")
        print(f"Score: {result['score']}/100")
        u = result['url_structure']
        print(f"\nURL Structure:")
        print(f"  Length: {u['url_length']} chars {'(too long)' if u['is_too_long'] else ''}")
        print(f"  Depth: {u['path_depth']} levels {'(too deep)' if u['is_too_deep'] else ''}")
        if u['keywords_in_url']:
            print(f"  Keywords: {', '.join(u['keywords_in_url'])}")
        a = result['anchor_text']
        print(f"\nAnchor Text:")
        print(f"  Total: {a['total_links']} ({a['internal_links']} internal, {a['external_links']} external)")
        print(f"  Descriptive: {a['descriptive_anchors']}, Generic: {a['generic_anchors']}")
        print(f"  Image links: {a['image_links']}, Empty: {a['empty_anchors']}")
        p = result['pagination']
        if p['has_pagination']:
            print(f"\nPagination: {p['pagination_type'] or 'detected'}")
            print(f"  rel=next: {'yes' if p['has_rel_next'] else 'no'}")
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
