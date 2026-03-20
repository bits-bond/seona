#!/usr/bin/env python3
"""
Analyze HTTP security headers for a URL.

Checks critical headers (HSTS, X-Content-Type-Options, X-Frame-Options)
and recommended headers (CSP, Referrer-Policy, Permissions-Policy, X-XSS-Protection).

Usage:
    python analyze_security.py https://example.com
    python analyze_security.py https://example.com --json
    python analyze_security.py https://example.com --timeout 15
"""

import argparse
import ipaddress
import json
import socket
import sys
from typing import Optional
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests")
    sys.exit(1)


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ClaudeSEO/1.0; +https://github.com/DDX1/seona)",
}

CRITICAL_HEADERS = {
    'Strict-Transport-Security': {
        'description': 'HSTS - Forces HTTPS connections',
        'recommendation': 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        'good_values': ['max-age=31536000', 'max-age=63072000'],
    },
    'X-Content-Type-Options': {
        'description': 'Prevents MIME type sniffing',
        'recommendation': 'Add: X-Content-Type-Options: nosniff',
        'good_values': ['nosniff'],
    },
    'X-Frame-Options': {
        'description': 'Prevents clickjacking attacks',
        'recommendation': 'Add: X-Frame-Options: DENY or SAMEORIGIN',
        'good_values': ['DENY', 'SAMEORIGIN'],
    },
}

RECOMMENDED_HEADERS = {
    'Content-Security-Policy': {
        'description': 'CSP - Controls resource loading',
        'recommendation': 'Add Content-Security-Policy with appropriate directives',
        'good_values': [],
    },
    'Referrer-Policy': {
        'description': 'Controls referrer information',
        'recommendation': 'Add: Referrer-Policy: strict-origin-when-cross-origin',
        'good_values': ['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'],
    },
    'Permissions-Policy': {
        'description': 'Controls browser features',
        'recommendation': 'Add Permissions-Policy to restrict features like geolocation, camera',
        'good_values': [],
    },
    'X-XSS-Protection': {
        'description': 'XSS filter (legacy, but still useful)',
        'recommendation': 'Add: X-XSS-Protection: 1; mode=block',
        'good_values': ['1; mode=block'],
    },
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


def analyze_security(url: str, timeout: int = 30) -> dict:
    """
    Analyze HTTP security headers for a URL.

    Returns a dictionary with HTTPS status, header checks, security level,
    score, issues, and recommendations.
    """
    url = _normalize_url(url)
    if not url:
        return {"url": url, "error": "Invalid URL scheme", "score": 0}

    ssrf_error = _check_ssrf(url)
    if ssrf_error:
        return {"url": url, "error": ssrf_error, "score": 0}

    is_https = url.startswith('https://')

    result = {
        "url": url,
        "https": is_https,
        "headers": [],
        "level": "critical",
        "score": 0,
        "issues": [],
        "recommendations": [],
    }

    if not is_https:
        result["issues"].append("Site not using HTTPS")
        result["recommendations"].append("Migrate to HTTPS immediately")
        return result

    try:
        response = requests.head(url, headers=DEFAULT_HEADERS, timeout=timeout, allow_redirects=True)
        resp_headers = response.headers
    except requests.RequestException as e:
        result["issues"].append(f"Failed to fetch headers: {e}")
        return result

    score = 0
    max_score = 0

    # Critical headers (weighted 20 each)
    for name, config in CRITICAL_HEADERS.items():
        max_score += 20
        present = name in resp_headers
        header_info = {
            "name": name,
            "present": present,
            "value": resp_headers.get(name),
            "is_critical": True,
            "recommendation": None,
        }

        if present:
            if config['good_values'] and any(gv in resp_headers[name] for gv in config['good_values']):
                score += 20
            elif config['good_values']:
                score += 10
                header_info["recommendation"] = config['recommendation']
            else:
                score += 15
        else:
            result["issues"].append(f"Missing critical header: {name}")
            header_info["recommendation"] = config['recommendation']
            result["recommendations"].append(config['recommendation'])

        result["headers"].append(header_info)

    # Recommended headers (weighted 10 each)
    for name, config in RECOMMENDED_HEADERS.items():
        max_score += 10
        present = name in resp_headers
        header_info = {
            "name": name,
            "present": present,
            "value": resp_headers.get(name),
            "is_critical": False,
            "recommendation": None,
        }

        if present:
            if config['good_values'] and any(gv in resp_headers[name] for gv in config['good_values']):
                score += 10
            elif config['good_values']:
                score += 5
            else:
                score += 8
        else:
            header_info["recommendation"] = config['recommendation']
            if name == 'Content-Security-Policy':
                result["issues"].append(f"Missing recommended header: {name}")
                result["recommendations"].append(config['recommendation'])

        result["headers"].append(header_info)

    # Calculate score and level
    result["score"] = int((score / max_score) * 100) if max_score > 0 else 0

    if result["score"] >= 90:
        result["level"] = "excellent"
    elif result["score"] >= 70:
        result["level"] = "good"
    elif result["score"] >= 50:
        result["level"] = "fair"
    elif result["score"] >= 30:
        result["level"] = "poor"
    else:
        result["level"] = "critical"

    return result


def main():
    parser = argparse.ArgumentParser(description="Analyze HTTP security headers for SEO")
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    result = analyze_security(args.url, timeout=args.timeout)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Security Analysis: {result['url']}")
        print(f"{'=' * 50}")
        print(f"HTTPS: {'Yes' if result['https'] else 'NO'}")
        print(f"Score: {result['score']}/100 ({result['level'].upper()})")
        print(f"\nHeaders:")
        for h in result['headers']:
            status = "+" if h['present'] else "-"
            critical = " [CRITICAL]" if h['is_critical'] and not h['present'] else ""
            print(f"  {status} {h['name']}{critical}")
            if h['value']:
                val = h['value'][:60] + "..." if len(h['value'] or '') > 60 else h['value']
                print(f"    Value: {val}")
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
