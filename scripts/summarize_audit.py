"""Summarize the audit_results.json for analysis."""
import json

with open("/Users/davut/projects/claude-seo/screenshots/audit_results.json") as f:
    data = json.load(f)

for page_name, page_data in data.items():
    if page_name == "image_sitemap":
        print(f"\n{'='*60}")
        print(f"IMAGE SITEMAP")
        print(f"{'='*60}")
        print(f"Status: {page_data.get('status', 'N/A')}")
        content = page_data.get('content', '')
        if 'error' in page_data:
            print(f"Error: {page_data['error']}")
        else:
            # Print first 2000 chars of sitemap
            print(content[:3000])
        continue

    print(f"\n{'='*60}")
    print(f"PAGE: {page_name}")
    print(f"{'='*60}")

    for viewport, vp_data in page_data.items():
        if 'error' in vp_data:
            print(f"\n  [{viewport}] ERROR: {vp_data['error']}")
            continue

        print(f"\n  [{viewport}]")
        print(f"    URL: {vp_data.get('url', 'N/A')}")
        print(f"    Title: {vp_data.get('pageTitle', 'N/A')}")

        # Images
        imgs = vp_data.get('images', [])
        print(f"\n    <img> elements: {len(imgs)}")
        for img in imgs:
            src_short = img['src'][-80:] if img['src'] else 'EMPTY'
            print(f"      [{img['index']}] src=...{src_short}")
            print(f"          alt={'[MISSING]' if not img['hasAlt'] else repr(img['altValue'])}")
            print(f"          loading={img.get('loading')} | w={img.get('width')} h={img.get('height')}")
            print(f"          naturalW={img.get('naturalWidth')} naturalH={img.get('naturalHeight')}")
            print(f"          srcset={img.get('srcset', 'NONE')}")
            print(f"          sizes={img.get('sizes', 'NONE')}")
            print(f"          inViewport={img.get('isInViewport')}")
            print(f"          decoding={img.get('decoding')} fetchPriority={img.get('fetchPriority')}")

        # Pictures
        pics = vp_data.get('pictures', [])
        print(f"\n    <picture> elements: {len(pics)}")
        for pic in pics:
            print(f"      [{pic['index']}] sources={len(pic['sources'])}")
            for s in pic['sources']:
                print(f"          type={s.get('type')} media={s.get('media')} srcset={s.get('srcset','')[:80]}")

        # SVGs
        svgs = vp_data.get('svgs', [])
        print(f"\n    SVG elements: {len(svgs)}")
        accessible = sum(1 for s in svgs if s.get('ariaHidden') == 'true' or s.get('role') == 'presentation' or s.get('ariaLabel'))
        no_a11y = [s for s in svgs if not s.get('ariaHidden') and not s.get('role') and not s.get('ariaLabel') and not s.get('title')]
        print(f"      With aria-hidden/role/ariaLabel: {accessible}")
        print(f"      WITHOUT any a11y attribute: {len(no_a11y)}")
        for s in no_a11y[:5]:
            print(f"        SVG[{s['index']}] {s['width']}x{s['height']} class={s.get('className','')}")

        # BG Images
        bgs = vp_data.get('bgImages', [])
        print(f"\n    Background images: {len(bgs)}")
        for bg in bgs[:5]:
            print(f"      {bg['tag']}.{bg.get('className','')[:40]} => {bg['backgroundImage'][:100]}")

        # Performance entries
        perfs = vp_data.get('perfEntries', [])
        print(f"\n    Performance resource entries (images): {len(perfs)}")
        for p in perfs:
            size_kb = round(p.get('transferSize', 0) / 1024, 1)
            print(f"      {p['name'][-60:]} | {size_kb}KB | {p.get('duration',0)}ms")

        # Meta tags
        meta = vp_data.get('metaTags', {})
        print(f"\n    og:image = {meta.get('ogImage', 'MISSING')}")
        print(f"    twitter:image = {meta.get('twitterImage', 'MISSING')}")

        # Favicons
        favs = vp_data.get('favicons', [])
        print(f"\n    Favicons: {len(favs)}")
        for fav in favs:
            print(f"      {fav['rel']}: {fav['href']} ({fav.get('type','')}) sizes={fav.get('sizes','')}")

        # Only print desktop data to keep it short
        if viewport == 'desktop':
            continue
