"""Discover actual pages on jun.legal by crawling links from the homepage."""
from playwright.sync_api import sync_playwright
import json

def discover(page, url):
    page.goto(url, wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(2000)

    links = page.evaluate('''() => {
        const links = new Set();
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (href.startsWith('https://jun.legal') && !href.includes('#') && !href.includes('mailto:') && !href.includes('tel:')) {
                links.add(href);
            }
        });
        return Array.from(links).sort();
    }''')
    return links

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = ctx.new_page()
    links = discover(page, 'https://jun.legal/')
    print(f"Found {len(links)} internal links:")
    for link in links:
        print(f"  {link}")

    # Also discover from kontakt and karriere (which worked)
    for extra_url in ['https://jun.legal/kontakt/', 'https://jun.legal/karriere/']:
        extra_links = discover(page, extra_url)
        for link in extra_links:
            if link not in links:
                links.append(link)
                print(f"  (new) {link}")

    browser.close()
