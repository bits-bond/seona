#!/usr/bin/env python3
"""
Analyze Core Web Vitals and Lighthouse scores via PageSpeed Insights API.

No authentication required. An optional API key increases quota.

Usage:
    python pagespeed.py https://example.com
    python pagespeed.py https://example.com --strategy desktop
    python pagespeed.py https://example.com --json
    python pagespeed.py https://example.com --api-key YOUR_KEY
"""

import argparse
import ipaddress
import json
import socket
import sys
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests")
    sys.exit(1)


API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

# Audit IDs for optimization opportunities
OPPORTUNITY_AUDITS = [
    "render-blocking-resources",
    "unused-css-rules",
    "unused-javascript",
    "modern-image-formats",
    "offscreen-images",
    "unminified-css",
    "unminified-javascript",
    "efficient-animated-content",
    "uses-optimized-images",
    "uses-responsive-images",
]

# Audit IDs for diagnostics
DIAGNOSTIC_AUDITS = [
    "dom-size",
    "font-display",
    "uses-passive-event-listeners",
    "no-document-write",
    "long-tasks",
    "critical-request-chains",
]


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


def _extract_field_metric(loading_exp: dict, metric_name: str) -> Optional[dict]:
    """Extract field metric data from loading experience."""
    metrics = loading_exp.get("metrics", {})
    metric = metrics.get(metric_name, {})
    if metric:
        return {
            "percentile": metric.get("percentile"),
            "category": metric.get("category"),
        }
    return None


def analyze_pagespeed(url: str, strategy: str = "mobile", api_key: str = "") -> dict:
    """
    Analyze a URL with PageSpeed Insights API.

    Args:
        url: URL to analyze
        strategy: "mobile" or "desktop"
        api_key: Optional API key for higher quota

    Returns:
        Dictionary with Lighthouse scores, Core Web Vitals, opportunities,
        and diagnostics.
    """
    url = _normalize_url(url)
    if not url:
        return {"url": url, "error": "Invalid URL scheme"}

    ssrf_error = _check_ssrf(url)
    if ssrf_error:
        return {"url": url, "error": ssrf_error}

    params = {
        "url": url,
        "strategy": strategy,
        "category": ["performance", "accessibility", "best-practices", "seo"],
    }
    if api_key:
        params["key"] = api_key

    try:
        response = requests.get(API_URL, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        return {"url": url, "error": str(e)}

    lighthouse = data.get("lighthouseResult", {})
    audits = lighthouse.get("audits", {})
    categories = lighthouse.get("categories", {})
    loading_experience = data.get("loadingExperience", {})

    # Extract opportunities
    opportunities = []
    for audit_id in OPPORTUNITY_AUDITS:
        audit = audits.get(audit_id, {})
        if audit.get("score") is not None and audit.get("score") < 1:
            savings = audit.get("details", {}).get("overallSavingsMs", 0)
            if savings > 0:
                opportunities.append({
                    "id": audit_id,
                    "title": audit.get("title", ""),
                    "savings_ms": savings,
                    "description": audit.get("description", ""),
                })
    opportunities.sort(key=lambda x: x.get("savings_ms", 0), reverse=True)

    # Extract diagnostics
    diagnostics = []
    for audit_id in DIAGNOSTIC_AUDITS:
        audit = audits.get(audit_id, {})
        if audit.get("score") is not None and audit.get("score") < 1:
            diagnostics.append({
                "id": audit_id,
                "title": audit.get("title", ""),
                "description": audit.get("description", ""),
                "display_value": audit.get("displayValue", ""),
            })

    result = {
        "url": url,
        "strategy": strategy,
        "fetch_time": datetime.now().isoformat(),

        # Lighthouse scores (0-100)
        "performance_score": int(categories.get("performance", {}).get("score", 0) * 100),
        "accessibility_score": int(categories.get("accessibility", {}).get("score", 0) * 100),
        "best_practices_score": int(categories.get("best-practices", {}).get("score", 0) * 100),
        "seo_score": int(categories.get("seo", {}).get("score", 0) * 100),

        # Core Web Vitals — lab data
        "lcp_ms": audits.get("largest-contentful-paint", {}).get("numericValue", 0),
        "cls": audits.get("cumulative-layout-shift", {}).get("numericValue", 0),
        "fcp_ms": audits.get("first-contentful-paint", {}).get("numericValue", 0),
        "ttfb_ms": audits.get("server-response-time", {}).get("numericValue", 0),
        "tti_ms": audits.get("interactive", {}).get("numericValue", 0),
        "tbt_ms": audits.get("total-blocking-time", {}).get("numericValue", 0),
        "speed_index_ms": audits.get("speed-index", {}).get("numericValue", 0),

        # Field data (real user metrics, when available)
        "field_lcp": _extract_field_metric(loading_experience, "LARGEST_CONTENTFUL_PAINT_MS"),
        "field_cls": _extract_field_metric(loading_experience, "CUMULATIVE_LAYOUT_SHIFT_SCORE"),
        "field_inp": _extract_field_metric(loading_experience, "INTERACTION_TO_NEXT_PAINT"),

        # Optimization opportunities and diagnostics
        "opportunities": opportunities,
        "diagnostics": diagnostics,
    }

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Analyze Core Web Vitals via PageSpeed Insights API"
    )
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument(
        "--strategy", "-s", choices=["mobile", "desktop"], default="mobile",
        help="Analysis strategy (default: mobile)"
    )
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--api-key", "-k", default="", help="PageSpeed API key (optional)")

    args = parser.parse_args()
    result = analyze_pagespeed(args.url, strategy=args.strategy, api_key=args.api_key)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(f"PageSpeed Analysis: {result['url']} ({result['strategy']})")
        print(f"{'=' * 55}")

        perf = result['performance_score']
        print(f"\nScores:")
        print(f"  Performance:    {perf}/100")
        print(f"  Accessibility:  {result['accessibility_score']}/100")
        print(f"  Best Practices: {result['best_practices_score']}/100")
        print(f"  SEO:            {result['seo_score']}/100")

        lcp_s = result['lcp_ms'] / 1000
        print(f"\nCore Web Vitals (lab):")
        print(f"  LCP:  {lcp_s:.2f}s (target: <=2.5s)")
        print(f"  CLS:  {result['cls']:.3f} (target: <=0.1)")
        print(f"  TBT:  {result['tbt_ms']:.0f}ms")
        print(f"  TTFB: {result['ttfb_ms']:.0f}ms")
        print(f"  FCP:  {result['fcp_ms'] / 1000:.2f}s")
        print(f"  TTI:  {result['tti_ms'] / 1000:.2f}s")

        # Field data
        field_lcp = result.get('field_lcp')
        field_inp = result.get('field_inp')
        if field_lcp or field_inp:
            print(f"\nField Data (real users):")
            if field_lcp:
                print(f"  LCP: {field_lcp['percentile']}ms ({field_lcp['category']})")
            if field_inp:
                print(f"  INP: {field_inp['percentile']}ms ({field_inp['category']})")
            field_cls = result.get('field_cls')
            if field_cls:
                print(f"  CLS: {field_cls['percentile']} ({field_cls['category']})")

        if result['opportunities']:
            print(f"\nTop Opportunities:")
            for opp in result['opportunities'][:5]:
                print(f"  - {opp['title']} (save {opp['savings_ms']:.0f}ms)")

        if result['diagnostics']:
            print(f"\nDiagnostics:")
            for diag in result['diagnostics'][:5]:
                val = f" — {diag['display_value']}" if diag['display_value'] else ""
                print(f"  - {diag['title']}{val}")


if __name__ == "__main__":
    main()
