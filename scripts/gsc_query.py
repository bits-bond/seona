#!/usr/bin/env python3
"""
Query Google Search Console API for search analytics, URL inspection,
sitemap status, and indexing requests.

Requires a Google service account with Search Console access.

Usage:
    python gsc_query.py analytics --site sc-domain:example.com --key-file sa.json
    python gsc_query.py inspect https://example.com/page --site sc-domain:example.com --key-file sa.json
    python gsc_query.py sitemaps --site sc-domain:example.com --key-file sa.json
    python gsc_query.py index-request https://example.com/page --key-file sa.json
    python gsc_query.py list-sites --key-file sa.json

Environment variables (alternative to CLI flags):
    GSC_KEY_FILE    — Path to service account JSON key
    GSC_SITE_URL    — Search Console property URL (e.g., sc-domain:example.com)
    GSC_DEFAULT_DAYS — Default lookback period (default: 28)
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

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


# ── CLI entry ───────────────────────────────────────────────────────

COMMANDS = {
    "list-sites": cmd_list_sites,
    "analytics": cmd_analytics,
    "inspect": cmd_inspect,
    "sitemaps": cmd_sitemaps,
    "index-request": cmd_index_request,
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
    parser.add_argument("--json", "-j", action="store_true", help="Output JSON (always JSON, flag kept for consistency)")

    args = parser.parse_args()

    # Validate required args
    if args.command in ("analytics", "inspect", "sitemaps") and not args.site:
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
