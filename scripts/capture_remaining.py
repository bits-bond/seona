from playwright.sync_api import sync_playwright
import time

pages = {
    "team": "https://jun.legal/team",
    "ki": "https://jun.legal/ki",
    "it-vertragsrecht": "https://jun.legal/it-vertragsrecht",
    "karriere": "https://jun.legal/karriere",
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = ctx.new_page()
    for name, url in pages.items():
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            time.sleep(2)
            path = f"/Users/davut/projects/claude-seo/screenshots/jun_legal_{name}.png"
            page.screenshot(path=path, full_page=True)
            print(f"Saved: {path}")
        except Exception as e:
            print(f"Error on {url}: {e}")
    browser.close()
