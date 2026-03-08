#!/usr/bin/env python3
"""
Analyze backlinks and link profile from HTML content.

Extracts all <a> tags with href, rel attributes, anchor text, and classifies
links as internal vs external, follow vs nofollow.

Usage:
    python analyze_backlinks.py page.html --url https://example.com
    python analyze_backlinks.py --url https://example.com < page.html
    python analyze_backlinks.py page.html --url https://example.com --json
"""

import argparse
import json
import os
import re
import sys
from collections import Counter
from typing import Optional
from urllib.parse import urljoin, urlparse

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: beautifulsoup4 required. Install with: pip install beautifulsoup4")
    sys.exit(1)


def classify_anchor_text(text: str, target_url: str, site_domain: str) -> str:
    """
    Classify anchor text into categories.

    Categories:
    - branded: contains the site's domain name
    - exact_match: looks like a target keyword (multi-word, no URL)
    - naked_url: is a URL
    - generic: common generic phrases
    - image: empty text (likely image link)
    - partial_match: everything else with meaningful text
    """
    if not text or not text.strip():
        return "image"

    text_lower = text.strip().lower()

    # Naked URL
    if re.match(r"https?://", text_lower) or re.match(r"www\.", text_lower):
        return "naked_url"

    # Generic anchors
    generic_phrases = {
        "click here", "read more", "learn more", "here", "this",
        "link", "website", "site", "page", "more", "continue",
        "view", "see more", "details", "info", "go", "visit",
    }
    if text_lower in generic_phrases:
        return "generic"

    # Branded (contains domain name without TLD)
    domain_name = site_domain.replace("www.", "").split(".")[0].lower()
    if domain_name and len(domain_name) > 2 and domain_name in text_lower:
        return "branded"

    return "partial_match"


def analyze_links(html: str, base_url: Optional[str] = None) -> dict:
    """
    Analyze all links in HTML content.

    Args:
        html: HTML content to analyze
        base_url: Base URL for resolving relative links and classifying internal/external

    Returns:
        Dictionary with link analysis data
    """
    soup = BeautifulSoup(html, "lxml" if "lxml" in sys.modules else "html.parser")

    base_domain = ""
    if base_url:
        parsed_base = urlparse(base_url)
        base_domain = parsed_base.netloc.lower()

    links = []
    internal_links = []
    external_links = []
    follow_links = []
    nofollow_links = []
    anchor_texts = []
    anchor_categories = Counter()

    for a_tag in soup.find_all("a", href=True):
        href = a_tag.get("href", "").strip()

        # Skip empty, anchor-only, and javascript links
        if not href or href.startswith("#") or href.startswith("javascript:"):
            continue

        # Skip mailto and tel links
        if href.startswith("mailto:") or href.startswith("tel:"):
            continue

        # Resolve relative URLs
        full_url = urljoin(base_url, href) if base_url else href

        # Get rel attributes
        rel_attrs = a_tag.get("rel", [])
        if isinstance(rel_attrs, str):
            rel_attrs = rel_attrs.split()
        rel_attrs = [r.lower() for r in rel_attrs]

        # Determine follow/nofollow
        is_nofollow = "nofollow" in rel_attrs
        is_sponsored = "sponsored" in rel_attrs
        is_ugc = "ugc" in rel_attrs

        # Get anchor text
        anchor_text = a_tag.get_text(strip=True)[:200]

        # Check for image-only links
        has_image = bool(a_tag.find("img"))
        img_alt = ""
        if has_image:
            img = a_tag.find("img")
            img_alt = img.get("alt", "") if img else ""

        # Classify internal vs external
        is_internal = False
        if base_url:
            try:
                parsed_link = urlparse(full_url)
                link_domain = parsed_link.netloc.lower()
                is_internal = (
                    link_domain == base_domain
                    or link_domain == ""
                    or link_domain.endswith("." + base_domain.replace("www.", ""))
                )
            except Exception:
                is_internal = False

        # Classify anchor text
        anchor_category = classify_anchor_text(
            anchor_text or img_alt, full_url, base_domain
        )
        anchor_categories[anchor_category] += 1

        link_data = {
            "url": full_url,
            "anchor_text": anchor_text,
            "rel": rel_attrs,
            "is_internal": is_internal,
            "is_nofollow": is_nofollow,
            "is_sponsored": is_sponsored,
            "is_ugc": is_ugc,
            "has_image": has_image,
            "img_alt": img_alt,
            "anchor_category": anchor_category,
        }

        links.append(link_data)

        if is_internal:
            internal_links.append(link_data)
        else:
            external_links.append(link_data)

        if is_nofollow or is_sponsored or is_ugc:
            nofollow_links.append(link_data)
        else:
            follow_links.append(link_data)

        if anchor_text:
            anchor_texts.append(anchor_text)

    # Calculate anchor text distribution
    total_links = len(links) or 1
    anchor_distribution = {}
    for category, count in anchor_categories.items():
        anchor_distribution[category] = {
            "count": count,
            "percentage": round(count / total_links * 100, 1),
        }

    # Identify unique external domains
    external_domains = Counter()
    for link in external_links:
        try:
            domain = urlparse(link["url"]).netloc.lower()
            if domain:
                external_domains[domain] += 1
        except Exception:
            pass

    # Identify unique internal paths
    internal_paths = Counter()
    for link in internal_links:
        try:
            path = urlparse(link["url"]).path
            if path:
                internal_paths[path] += 1
        except Exception:
            pass

    result = {
        "summary": {
            "total_links": len(links),
            "internal_links": len(internal_links),
            "external_links": len(external_links),
            "follow_links": len(follow_links),
            "nofollow_links": len(nofollow_links),
            "unique_external_domains": len(external_domains),
            "unique_internal_paths": len(internal_paths),
        },
        "anchor_distribution": anchor_distribution,
        "external_domains": dict(external_domains.most_common(50)),
        "internal_paths": dict(internal_paths.most_common(50)),
        "links": links,
    }

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Analyze backlinks and link profile from HTML"
    )
    parser.add_argument("file", nargs="?", help="HTML file to analyze")
    parser.add_argument(
        "--url", "-u", required=True, help="Base URL for resolving relative links"
    )
    parser.add_argument(
        "--json", "-j", action="store_true", help="Output full JSON (default: summary)"
    )
    parser.add_argument(
        "--links-only", action="store_true", help="Output only the links array"
    )

    args = parser.parse_args()

    # Read HTML input
    if args.file:
        real_path = os.path.realpath(args.file)
        if not os.path.isfile(real_path):
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        with open(real_path, "r", encoding="utf-8") as f:
            html = f.read()
    else:
        html = sys.stdin.read()

    if not html.strip():
        print("Error: No HTML content provided", file=sys.stderr)
        sys.exit(1)

    result = analyze_links(html, args.url)

    if args.links_only:
        print(json.dumps(result["links"], indent=2))
    elif args.json:
        print(json.dumps(result, indent=2))
    else:
        # Summary output
        s = result["summary"]
        print(f"Link Profile Analysis for: {args.url}")
        print(f"{'=' * 50}")
        print(f"Total Links: {s['total_links']}")
        print(f"  Internal: {s['internal_links']}")
        print(f"  External: {s['external_links']}")
        print(f"  Follow: {s['follow_links']}")
        print(f"  Nofollow: {s['nofollow_links']}")
        print(f"  Unique External Domains: {s['unique_external_domains']}")
        print(f"  Unique Internal Paths: {s['unique_internal_paths']}")
        print()
        print("Anchor Text Distribution:")
        for category, data in sorted(
            result["anchor_distribution"].items(),
            key=lambda x: x[1]["count"],
            reverse=True,
        ):
            print(f"  {category}: {data['count']} ({data['percentage']}%)")
        print()
        print("Top External Domains:")
        for domain, count in list(result["external_domains"].items())[:10]:
            print(f"  {domain}: {count} links")
        print()
        print("Top Internal Paths:")
        for path, count in list(result["internal_paths"].items())[:10]:
            print(f"  {path}: {count} links")


if __name__ == "__main__":
    main()
