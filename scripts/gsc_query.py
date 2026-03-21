#!/usr/bin/env python3
"""
Query Google Search Console API for search analytics, URL inspection,
sitemap status, indexing requests, CSV export parsing, and full SEO audits.

Requires a Google service account with Search Console access.

Usage:
    python gsc_query.py list-sites --key-file sa.json
    python gsc_query.py analytics --site sc-domain:example.com --key-file sa.json
    python gsc_query.py inspect https://example.com/page --site sc-domain:example.com --key-file sa.json
    python gsc_query.py batch-inspect --urls-file urls.txt --site sc-domain:example.com --key-file sa.json
    python gsc_query.py sitemaps --site sc-domain:example.com --key-file sa.json
    python gsc_query.py index-request https://example.com/page --key-file sa.json
    python gsc_query.py index-batch --sitemap-url https://example.com/sitemap.xml --key-file sa.json
    python gsc_query.py coverage --path ./Coverage-export-folder
    python gsc_query.py links --path ./Links-export-folder
    python gsc_query.py audit --site sc-domain:example.com --key-file sa.json

Environment variables (alternative to CLI flags):
    GSC_KEY_FILE    — Path to service account JSON key
    GSC_SITE_URL    — Search Console property URL (e.g., sc-domain:example.com)
    GSC_DEFAULT_DAYS — Default lookback period (default: 28)
"""

import argparse
import csv
import json
import os
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print(
        "Error: google-api-python-client and google-auth required.\n"
        "Install with: pip install google-api-python-client google-auth",
        file=sys.stderr,
    )
    sys.exit(1)


SCOPES_READONLY = ["https://www.googleapis.com/auth/webmasters.readonly"]
SCOPES_WRITE = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/indexing",
]


def _get_service(key_file: str, api: str, version: str, scopes=None):
    """Build a Google API service from a service account key file."""
    if not Path(key_file).exists():
        print(f"Error: Key file not found: {key_file}", file=sys.stderr)
        sys.exit(1)
    scopes = scopes or SCOPES_READONLY
    creds = service_account.Credentials.from_service_account_file(key_file, scopes=scopes)
    return build(api, version, credentials=creds, cache_discovery=False)


# ── list-sites ──────────────────────────────────────────────────────

def cmd_list_sites(key_file: str, **_) -> dict:
    """List all Search Console properties accessible to the service account."""
    svc = _get_service(key_file, "webmasters", "v3")
    try:
        resp = svc.sites().list().execute()
        sites = resp.get("siteEntry", [])
        return {
            "sites": [
                {"url": s["siteUrl"], "permission": s["permissionLevel"]}
                for s in sites
            ]
        }
    except HttpError as e:
        return {"error": str(e)}


# ── analytics ───────────────────────────────────────────────────────

def cmd_analytics(
    key_file: str,
    site: str,
    days: int = 28,
    dimension: str = "query",
    row_limit: int = 1000,
    **_,
) -> dict:
    """Fetch search analytics (queries, pages, devices, countries)."""
    svc = _get_service(key_file, "webmasters", "v3")
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    dimensions = [d.strip() for d in dimension.split(",")]

    all_rows = []
    start_row = 0

    try:
        while True:
            payload = {
                "startDate": start_date,
                "endDate": end_date,
                "dimensions": dimensions,
                "rowLimit": min(row_limit - len(all_rows), 25000),
                "startRow": start_row,
            }
            resp = svc.searchanalytics().query(siteUrl=site, body=payload).execute()
            rows = resp.get("rows", [])
            if not rows:
                break
            all_rows.extend(rows)
            if len(rows) < 25000 or len(all_rows) >= row_limit:
                break
            start_row += 25000

        # Flatten keys into named columns
        records = []
        for row in all_rows:
            rec = {}
            for i, dim in enumerate(dimensions):
                rec[dim] = row["keys"][i] if i < len(row["keys"]) else None
            rec["clicks"] = row.get("clicks", 0)
            rec["impressions"] = row.get("impressions", 0)
            rec["ctr"] = round(row.get("ctr", 0) * 100, 2)
            rec["position"] = round(row.get("position", 0), 1)
            records.append(rec)

        records.sort(key=lambda r: r["clicks"], reverse=True)

        return {
            "site": site,
            "period": f"{start_date} to {end_date}",
            "dimensions": dimensions,
            "total_rows": len(records),
            "summary": {
                "total_clicks": sum(r["clicks"] for r in records),
                "total_impressions": sum(r["impressions"] for r in records),
                "avg_ctr": round(
                    sum(r["ctr"] for r in records) / max(len(records), 1), 2
                ),
                "avg_position": round(
                    sum(r["position"] for r in records) / max(len(records), 1), 1
                ),
            },
            "rows": records,
        }
    except HttpError as e:
        return {"error": str(e)}


# ── inspect ─────────────────────────────────────────────────────────

def cmd_inspect(key_file: str, site: str, url: str = "", **_) -> dict:
    """Inspect a single URL's index status in Google."""
    if not url:
        return {"error": "URL is required for inspect command"}

    svc = _get_service(key_file, "searchconsole", "v1")
    try:
        resp = (
            svc.urlInspection()
            .index()
            .inspect(
                body={
                    "inspectionUrl": url,
                    "siteUrl": site,
                    "languageCode": "en-US",
                }
            )
            .execute()
        )
        result = resp.get("inspectionResult", {})
        idx = result.get("indexStatusResult", {})
        mobile = result.get("mobileUsabilityResult", {})
        rich = result.get("richResultsResult", {})

        return {
            "url": url,
            "verdict": idx.get("verdict"),
            "coverage_state": idx.get("coverageState"),
            "robots_txt": idx.get("robotsTxtState"),
            "indexing_state": idx.get("indexingState"),
            "page_fetch": idx.get("pageFetchState"),
            "crawled_as": idx.get("crawledAs"),
            "last_crawl": idx.get("lastCrawlTime"),
            "google_canonical": idx.get("googleCanonical"),
            "user_canonical": idx.get("userCanonical"),
            "sitemaps": idx.get("sitemap", []),
            "referring_urls": idx.get("referringUrls", []),
            "mobile_usability": mobile.get("verdict"),
            "rich_results": rich.get("verdict"),
            "inspection_link": result.get("inspectionResultLink"),
        }
    except HttpError as e:
        return {"url": url, "error": str(e)}


# ── sitemaps ────────────────────────────────────────────────────────

def cmd_sitemaps(key_file: str, site: str, **_) -> dict:
    """List all sitemaps and their index status."""
    svc = _get_service(key_file, "webmasters", "v3")
    try:
        resp = svc.sitemaps().list(siteUrl=site).execute()
        sitemaps = resp.get("sitemap", [])
        records = []
        for sm in sitemaps:
            contents = sm.get("contents", [])
            submitted = sum(int(c.get("submitted", 0) or 0) for c in contents)
            indexed = sum(int(c.get("indexed", 0) or 0) for c in contents)
            records.append({
                "path": sm.get("path"),
                "last_submitted": sm.get("lastSubmitted"),
                "last_downloaded": sm.get("lastDownloaded"),
                "warnings": sm.get("warnings", 0),
                "errors": sm.get("errors", 0),
                "urls_submitted": submitted,
                "urls_indexed": indexed,
            })
        return {"site": site, "sitemaps": records}
    except HttpError as e:
        return {"error": str(e)}


# ── index-request ───────────────────────────────────────────────────

def cmd_index_request(key_file: str, url: str = "", **_) -> dict:
    """Request Google to (re-)index a URL. Quota: 200/day per property."""
    if not url:
        return {"error": "URL is required for index-request command"}

    creds = service_account.Credentials.from_service_account_file(
        key_file, scopes=SCOPES_WRITE
    )
    svc = build("indexing", "v3", credentials=creds, cache_discovery=False)

    try:
        resp = (
            svc.urlNotifications()
            .publish(body={"url": url, "type": "URL_UPDATED"})
            .execute()
        )
        meta = resp.get("urlNotificationMetadata", {})
        latest = meta.get("latestUpdate", {})
        return {
            "url": meta.get("url", url),
            "notify_time": latest.get("notifyTime"),
            "type": latest.get("type"),
            "status": "requested",
        }
    except HttpError as e:
        return {"url": url, "error": str(e)}


# ── batch-inspect ───────────────────────────────────────────────────

def cmd_batch_inspect(key_file: str, site: str, urls_file: str = "", **_) -> dict:
    """Inspect multiple URLs from a file (one URL per line)."""
    if not urls_file:
        return {"error": "--urls-file is required for batch-inspect"}
    path = Path(urls_file)
    if not path.exists():
        return {"error": f"File not found: {urls_file}"}

    urls = [line.strip() for line in path.read_text().splitlines() if line.strip()]
    if not urls:
        return {"error": "No URLs found in file"}

    svc = _get_service(key_file, "searchconsole", "v1")
    results = []
    for i, url in enumerate(urls):
        print(f"[{i + 1}/{len(urls)}] Inspecting: {url[:60]}...", file=sys.stderr)
        try:
            resp = (
                svc.urlInspection()
                .index()
                .inspect(body={"inspectionUrl": url, "siteUrl": site, "languageCode": "en-US"})
                .execute()
            )
            idx = resp.get("inspectionResult", {}).get("indexStatusResult", {})
            results.append({
                "url": url,
                "verdict": idx.get("verdict"),
                "coverage_state": idx.get("coverageState"),
                "robots_txt": idx.get("robotsTxtState"),
                "page_fetch": idx.get("pageFetchState"),
                "last_crawl": idx.get("lastCrawlTime"),
                "google_canonical": idx.get("googleCanonical"),
            })
        except HttpError as e:
            results.append({"url": url, "verdict": "ERROR", "error": str(e)})
        time.sleep(0.3)

    summary = {}
    for r in results:
        v = r.get("verdict", "UNKNOWN")
        summary[v] = summary.get(v, 0) + 1

    return {"site": site, "total": len(results), "summary": summary, "results": results}


# ── index-batch ────────────────────────────────────────────────────

def _get_urls_from_sitemap(sitemap_url: str) -> List[str]:
    """Fetch URLs from a sitemap XML (handles sitemap indexes recursively)."""
    try:
        import requests as req
        resp = req.get(sitemap_url, timeout=30)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

        urls = [el.text.strip() for el in root.findall(".//sm:url/sm:loc", ns) if el.text]

        for el in root.findall(".//sm:sitemap/sm:loc", ns):
            if el.text:
                urls.extend(_get_urls_from_sitemap(el.text.strip()))
        return urls
    except Exception as e:
        print(f"Error fetching sitemap: {e}", file=sys.stderr)
        return []


def cmd_index_batch(key_file: str, sitemap_url: str = "", limit: int = 200, **_) -> dict:
    """Request indexing for URLs from a sitemap. Quota: 200/day per property."""
    if not sitemap_url:
        return {"error": "--sitemap-url is required for index-batch"}

    urls = _get_urls_from_sitemap(sitemap_url)
    if not urls:
        return {"error": "No URLs found in sitemap"}

    if len(urls) > limit:
        urls = urls[:limit]

    creds = service_account.Credentials.from_service_account_file(key_file, scopes=SCOPES_WRITE)
    svc = build("indexing", "v3", credentials=creds, cache_discovery=False)

    results = []
    for i, url in enumerate(urls):
        print(f"[{i + 1}/{len(urls)}] Indexing: {url[:60]}...", file=sys.stderr)
        try:
            resp = svc.urlNotifications().publish(body={"url": url, "type": "URL_UPDATED"}).execute()
            meta = resp.get("urlNotificationMetadata", {})
            results.append({"url": url, "status": "requested", "notify_time": meta.get("latestUpdate", {}).get("notifyTime")})
        except HttpError as e:
            results.append({"url": url, "status": "error", "error": str(e)})
        time.sleep(0.5)

    success = sum(1 for r in results if r["status"] == "requested")
    return {"sitemap": sitemap_url, "total": len(results), "success": success, "failed": len(results) - success, "results": results}


# ── coverage ───────────────────────────────────────────────────────

def _categorize_redirect(url: str) -> str:
    """Categorize a URL's redirect type from Coverage export."""
    parsed = urlparse(url)
    if parsed.netloc.startswith("www."):
        return "www_to_non_www"
    if parsed.scheme == "http":
        return "http_to_https"
    path = parsed.path
    if path and not path.endswith("/") and "." not in path.split("/")[-1]:
        return "missing_trailing_slash"
    if "//" in path[1:]:
        return "path_redirect"
    return "other"


def _parse_csv_file(filepath: Path) -> List[dict]:
    """Parse a CSV file into a list of dicts using stdlib csv."""
    rows = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(dict(row))
    except Exception:
        pass
    return rows


def cmd_coverage(path: str = "", **_) -> dict:
    """Parse GSC Coverage CSV export folder (Metadata.csv, Table.csv, Chart.csv)."""
    if not path:
        return {"error": "--path to Coverage export folder is required"}

    folder = Path(path)
    if not folder.is_dir():
        return {"error": f"Not a directory: {path}"}

    result = {
        "folder": str(folder),
        "issue_type": None,
        "urls": [],
        "history": [],
        "categorized": {},
        "summary": {},
    }

    categories = {
        "www_to_non_www": [], "non_www_to_www": [], "missing_trailing_slash": [],
        "extra_trailing_slash": [], "http_to_https": [], "path_redirect": [], "other": [],
    }

    # Metadata.csv
    metadata_file = folder / "Metadata.csv"
    if metadata_file.exists():
        for row in _parse_csv_file(metadata_file):
            if row.get("Property") == "Issue":
                result["issue_type"] = row.get("Value", "")

    # Table.csv
    table_file = folder / "Table.csv"
    if table_file.exists():
        for row in _parse_csv_file(table_file):
            url = row.get("URL", "")
            if url:
                cat = _categorize_redirect(url)
                result["urls"].append({"url": url, "last_crawled": row.get("Last crawled", ""), "redirect_type": cat})
                categories.setdefault(cat, []).append(url)

    # Chart.csv
    chart_file = folder / "Chart.csv"
    if chart_file.exists():
        for row in _parse_csv_file(chart_file):
            date = row.get("Date", "")
            affected = row.get("Affected pages", "0")
            if date:
                try:
                    affected = int(affected)
                except (ValueError, TypeError):
                    affected = 0
                result["history"].append({"date": date, "affected_pages": affected})

    result["categorized"] = {k: v for k, v in categories.items() if v}
    result["summary"] = {
        "total_urls": len(result["urls"]),
        "www_redirects": len(categories["www_to_non_www"]) + len(categories["non_www_to_www"]),
        "trailing_slash_issues": len(categories["missing_trailing_slash"]) + len(categories["extra_trailing_slash"]),
        "http_redirects": len(categories["http_to_https"]),
        "path_redirects": len(categories["path_redirect"]),
        "other": len(categories["other"]),
    }
    return result


# ── links ──────────────────────────────────────────────────────────

def cmd_links(path: str = "", **_) -> dict:
    """Parse GSC Links CSV export folder."""
    if not path:
        return {"error": "--path to Links export folder is required"}

    folder = Path(path)
    if not folder.is_dir():
        return {"error": f"Not a directory: {path}"}

    result = {"folder": str(folder), "external_links": [], "internal_links": [], "top_linking_sites": [], "top_linked_pages": []}

    filenames = ["Table.csv", "External links.csv", "Internal links.csv", "Top linking sites.csv", "Top linked pages.csv"]
    for filename in filenames:
        filepath = folder / filename
        if not filepath.exists():
            continue
        rows = _parse_csv_file(filepath)
        if "External" in filename or "linking sites" in filename.lower():
            result["external_links"].extend(rows)
        elif "Internal" in filename or "linked pages" in filename.lower():
            result["internal_links"].extend(rows)
        else:
            cols = [c.lower() for c in (rows[0].keys() if rows else [])]
            if any("site" in c for c in cols):
                result["top_linking_sites"].extend(rows)
            else:
                result["top_linked_pages"].extend(rows)

    return result


# ── audit ──────────────────────────────────────────────────────────

def cmd_audit(key_file: str, site: str, days: int = 28, **_) -> dict:
    """Run a 3-phase GSC SEO audit: data collection, issue identification, scoring."""

    audit = {
        "generated_at": datetime.now().isoformat(),
        "site": site,
        "seo_score": 100,
        "phases": {},
        "issues": [],
        "actions": [],
    }

    # ── Phase 1: Data Collection ──────────────────────────────────
    print("Phase 1: Data Collection...", file=sys.stderr)

    # 1a. Sitemaps
    print("  [1/4] Sitemaps...", file=sys.stderr)
    sitemaps_data = cmd_sitemaps(key_file=key_file, site=site)
    total_submitted = sum(s.get("urls_submitted", 0) for s in sitemaps_data.get("sitemaps", []))
    total_indexed = sum(s.get("urls_indexed", 0) for s in sitemaps_data.get("sitemaps", []))
    audit["phases"]["sitemaps"] = {
        "count": len(sitemaps_data.get("sitemaps", [])),
        "urls_submitted": total_submitted,
        "urls_indexed": total_indexed,
    }

    # 1b. Analytics
    print("  [2/4] Search Analytics...", file=sys.stderr)
    analytics_data = cmd_analytics(key_file=key_file, site=site, days=days, dimension="page", row_limit=500)
    audit["phases"]["analytics"] = analytics_data.get("summary", {})
    pages = analytics_data.get("rows", [])

    # 1c. URL Inspection (top 10 pages)
    print("  [3/4] URL Inspection (top 10)...", file=sys.stderr)
    inspection_results = []
    top_urls = [r.get("page", "") for r in pages[:10] if r.get("page")]
    svc = _get_service(key_file, "searchconsole", "v1")
    for url in top_urls:
        try:
            resp = svc.urlInspection().index().inspect(
                body={"inspectionUrl": url, "siteUrl": site, "languageCode": "en-US"}
            ).execute()
            idx = resp.get("inspectionResult", {}).get("indexStatusResult", {})
            inspection_results.append({"url": url, "verdict": idx.get("verdict"), "coverage_state": idx.get("coverageState")})
        except HttpError:
            inspection_results.append({"url": url, "verdict": "ERROR"})
        time.sleep(0.3)
    audit["phases"]["inspections"] = inspection_results

    # 1d. PageSpeed (top 3 pages)
    print("  [4/4] PageSpeed (top 3)...", file=sys.stderr)
    cwv_results = []
    try:
        import requests as req
        PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        for url in top_urls[:3]:
            try:
                r = req.get(PSI_URL, params={"url": url, "strategy": "mobile", "category": "performance"}, timeout=60)
                if r.status_code == 200:
                    data = r.json()
                    cats = data.get("lighthouseResult", {}).get("categories", {})
                    score = int(cats.get("performance", {}).get("score", 0) * 100)
                    cwv_results.append({"url": url, "performance_score": score})
                time.sleep(2)
            except Exception:
                pass
    except ImportError:
        pass
    audit["phases"]["cwv"] = cwv_results

    # ── Phase 2: Issue Identification ─────────────────────────────
    print("Phase 2: Issue Identification...", file=sys.stderr)
    score = 100

    # Not-indexed pages
    not_indexed = [r for r in inspection_results if r.get("verdict") != "PASS" and r.get("verdict") != "ERROR"]
    if not_indexed:
        score -= len(not_indexed) * 5
        audit["issues"].append({"type": "indexing", "severity": "high", "count": len(not_indexed), "urls": [r["url"] for r in not_indexed]})
        audit["actions"].append({
            "priority": "HIGH", "category": "Indexing",
            "title": f"{len(not_indexed)} pages not indexed",
            "steps": ["Use URL Inspection in GSC", "Request indexing for each URL", "Check for noindex tags or robots.txt blocks"],
        })

    # Poor CWV
    poor_cwv = [r for r in cwv_results if r.get("performance_score", 100) < 50]
    if poor_cwv:
        score -= len(poor_cwv) * 10
        audit["issues"].append({"type": "performance", "severity": "high", "count": len(poor_cwv), "urls": [r["url"] for r in poor_cwv]})
        audit["actions"].append({
            "priority": "HIGH", "category": "Performance",
            "title": f"{len(poor_cwv)} pages with poor Core Web Vitals (<50)",
            "steps": ["Optimize images (WebP/AVIF, lazy loading)", "Reduce JavaScript bundle size", "Enable compression and caching"],
        })

    # Low CTR opportunities
    low_ctr = [r for r in pages if r.get("impressions", 0) > 100 and r.get("ctr", 100) < 2][:10]
    if low_ctr:
        audit["issues"].append({"type": "ctr", "severity": "medium", "count": len(low_ctr), "urls": [r.get("page", "") for r in low_ctr]})
        audit["actions"].append({
            "priority": "MEDIUM", "category": "CTR Optimization",
            "title": f"{len(low_ctr)} pages with high impressions but low CTR (<2%)",
            "steps": ["Improve meta titles (compelling, keyword-rich)", "Optimize meta descriptions (add call-to-action)", "Add structured data for rich snippets"],
        })

    # Sitemap coverage gap
    if total_submitted > 0 and total_indexed < total_submitted * 0.8:
        gap = total_submitted - total_indexed
        score -= min(15, gap // 10)
        audit["issues"].append({"type": "sitemap_gap", "severity": "medium", "submitted": total_submitted, "indexed": total_indexed})
        audit["actions"].append({
            "priority": "MEDIUM", "category": "Index Coverage",
            "title": f"Only {total_indexed}/{total_submitted} sitemap URLs indexed ({int(total_indexed / total_submitted * 100)}%)",
            "steps": ["Review excluded pages in GSC Coverage report", "Check for quality issues on non-indexed pages", "Improve internal linking to non-indexed pages"],
        })

    # Manual checks reminder
    audit["actions"].append({
        "priority": "INFO", "category": "Manual Review",
        "title": "Manual GSC checks required (not available via API)",
        "steps": [
            "Check Manual Actions: GSC > Security & Manual Actions",
            "Check Security Issues: GSC > Security & Manual Actions > Security issues",
            "Check Mobile Usability: GSC > Experience > Mobile Usability",
            "Review full Index Coverage: GSC > Pages > Why pages aren't indexed",
        ],
    })

    audit["seo_score"] = max(0, min(100, score))

    # ── Phase 3: Summary ──────────────────────────────────────────
    print(f"Phase 3: Score = {audit['seo_score']}/100", file=sys.stderr)

    return audit


# ── CLI entry ───────────────────────────────────────────────────────

COMMANDS = {
    "list-sites": cmd_list_sites,
    "analytics": cmd_analytics,
    "inspect": cmd_inspect,
    "batch-inspect": cmd_batch_inspect,
    "sitemaps": cmd_sitemaps,
    "index-request": cmd_index_request,
    "index-batch": cmd_index_batch,
    "coverage": cmd_coverage,
    "links": cmd_links,
    "audit": cmd_audit,
}


def main():
    parser = argparse.ArgumentParser(
        description="Query Google Search Console API for SEO data"
    )
    parser.add_argument(
        "command",
        choices=COMMANDS.keys(),
        help="Command to run",
    )
    parser.add_argument("url", nargs="?", default="", help="URL (for inspect / index-request)")
    parser.add_argument(
        "--key-file",
        default=os.getenv("GSC_KEY_FILE", "service-account-key.json"),
        help="Path to service account JSON key (or set GSC_KEY_FILE env var)",
    )
    parser.add_argument(
        "--site",
        default=os.getenv("GSC_SITE_URL", ""),
        help="Search Console property URL, e.g. sc-domain:example.com (or set GSC_SITE_URL)",
    )
    parser.add_argument("--days", type=int, default=int(os.getenv("GSC_DEFAULT_DAYS", "28")), help="Lookback period for analytics (default: 28)")
    parser.add_argument("--dimension", default="query", help="Analytics dimension(s), comma-separated (query,page,device,country,date)")
    parser.add_argument("--row-limit", type=int, default=1000, help="Max rows for analytics (default: 1000)")
    parser.add_argument("--urls-file", default="", help="File with URLs, one per line (for batch-inspect)")
    parser.add_argument("--sitemap-url", default="", help="Sitemap URL (for index-batch)")
    parser.add_argument("--limit", type=int, default=200, help="Max URLs for index-batch (default: 200, quota: 200/day)")
    parser.add_argument("--path", default="", help="Path to GSC CSV export folder (for coverage/links)")
    parser.add_argument("--json", "-j", action="store_true", help="Output JSON (always JSON, flag kept for consistency)")

    args = parser.parse_args()

    # Validate required args
    if args.command in ("analytics", "inspect", "batch-inspect", "sitemaps", "audit") and not args.site:
        print("Error: --site is required (or set GSC_SITE_URL env var)", file=sys.stderr)
        sys.exit(1)

    fn = COMMANDS[args.command]
    result = fn(**vars(args))

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    # Always output JSON (GSC data is structured)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
