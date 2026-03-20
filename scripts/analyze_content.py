#!/usr/bin/env python3
"""
Analyze content quality metrics for SEO.

Evaluates readability scores, content freshness, language consistency,
text quality issues, and keyword analysis.

Usage:
    python analyze_content.py https://example.com
    python analyze_content.py https://example.com --json
    python analyze_content.py https://example.com --timeout 15
"""

import argparse
import ipaddress
import json
import math
import re
import socket
import sys
from collections import Counter
from datetime import datetime
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

# Optional dependencies
try:
    import textstat
    HAS_TEXTSTAT = True
except ImportError:
    HAS_TEXTSTAT = False

try:
    from langdetect import detect, detect_langs
    HAS_LANGDETECT = True
except ImportError:
    HAS_LANGDETECT = False


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ClaudeSEO/1.0; +https://github.com/DDX1/seona)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
    'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
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


def _extract_text(soup: BeautifulSoup) -> str:
    """Extract visible text content from HTML."""
    for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
        element.decompose()
    text = soup.get_text(separator=' ', strip=True)
    return re.sub(r'\s+', ' ', text)


def _count_syllables(text: str) -> int:
    """Simple syllable counter fallback."""
    text = text.lower()
    count = 0
    vowels = 'aeiouy'
    for word in text.split():
        word_count = 0
        prev_was_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                word_count += 1
            prev_was_vowel = is_vowel
        if word.endswith('e') and word_count > 1:
            word_count -= 1
        count += max(1, word_count)
    return count


def _analyze_readability(text: str) -> dict:
    """Analyze text readability metrics."""
    result = {
        "flesch_reading_ease": 0.0,
        "flesch_kincaid_grade": 0.0,
        "gunning_fog": 0.0,
        "smog_index": 0.0,
        "coleman_liau_index": 0.0,
        "automated_readability_index": 0.0,
        "dale_chall_score": 0.0,
        "reading_time_minutes": 0.0,
        "speaking_time_minutes": 0.0,
        "sentence_count": 0,
        "word_count": 0,
        "char_count": 0,
        "syllable_count": 0,
        "avg_sentence_length": 0.0,
        "avg_word_length": 0.0,
        "difficult_words_count": 0,
        "difficult_words_percentage": 0.0,
    }

    if not text or len(text) < 100:
        return result

    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = text.split()

    result["sentence_count"] = len(sentences)
    result["word_count"] = len(words)
    result["char_count"] = len(text)

    if result["sentence_count"] > 0:
        result["avg_sentence_length"] = round(result["word_count"] / result["sentence_count"], 1)
    if result["word_count"] > 0:
        result["avg_word_length"] = round(sum(len(w) for w in words) / result["word_count"], 1)

    result["reading_time_minutes"] = round(result["word_count"] / 225, 1)
    result["speaking_time_minutes"] = round(result["word_count"] / 150, 1)

    if HAS_TEXTSTAT:
        try:
            result["flesch_reading_ease"] = round(textstat.flesch_reading_ease(text), 1)
            result["flesch_kincaid_grade"] = round(textstat.flesch_kincaid_grade(text), 1)
            result["gunning_fog"] = round(textstat.gunning_fog(text), 1)
            result["smog_index"] = round(textstat.smog_index(text), 1)
            result["coleman_liau_index"] = round(textstat.coleman_liau_index(text), 1)
            result["automated_readability_index"] = round(textstat.automated_readability_index(text), 1)
            result["dale_chall_score"] = round(textstat.dale_chall_readability_score(text), 1)
            result["syllable_count"] = textstat.syllable_count(text)
            result["difficult_words_count"] = textstat.difficult_words(text)
            if result["word_count"] > 0:
                result["difficult_words_percentage"] = round(
                    result["difficult_words_count"] / result["word_count"] * 100, 1
                )
        except Exception:
            pass
    else:
        syllables = _count_syllables(text)
        result["syllable_count"] = syllables
        if result["sentence_count"] > 0 and result["word_count"] > 0:
            asl = result["word_count"] / result["sentence_count"]
            asw = syllables / result["word_count"]
            result["flesch_reading_ease"] = round(206.835 - (1.015 * asl) - (84.6 * asw), 1)
            result["flesch_kincaid_grade"] = round((0.39 * asl) + (11.8 * asw) - 15.59, 1)

    return result


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse various date formats."""
    if not date_str:
        return None
    formats = [
        '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%B %d, %Y', '%d %B %Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str[:26], fmt)
        except (ValueError, TypeError):
            continue
    return None


def _analyze_freshness(response, soup: BeautifulSoup) -> dict:
    """Analyze content freshness signals."""
    result = {
        "freshness_status": "unknown",
        "content_age_days": -1,
        "last_modified_header": "",
        "published_date": None,
        "modified_date": None,
        "date_sources": [],
    }

    # Last-Modified header
    last_modified = response.headers.get('Last-Modified')
    if last_modified:
        result["last_modified_header"] = last_modified
        result["date_sources"].append("Last-Modified header")

    # Schema.org dates
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                data = data[0] if data else {}
            if 'datePublished' in data:
                result["published_date"] = data['datePublished']
                result["date_sources"].append("Schema.org datePublished")
            if 'dateModified' in data:
                result["modified_date"] = data['dateModified']
                result["date_sources"].append("Schema.org dateModified")
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    # Meta tags
    for meta in soup.find_all('meta'):
        prop = meta.get('property', '') or meta.get('name', '')
        content = meta.get('content', '')
        if prop in ['article:published_time', 'og:published_time'] and not result["published_date"]:
            result["published_date"] = content
            result["date_sources"].append(f"Meta {prop}")
        elif prop in ['article:modified_time', 'og:updated_time'] and not result["modified_date"]:
            result["modified_date"] = content
            result["date_sources"].append(f"Meta {prop}")

    # Time elements
    for time_el in soup.find_all('time'):
        datetime_attr = time_el.get('datetime')
        if datetime_attr and not result["published_date"]:
            result["published_date"] = datetime_attr
            result["date_sources"].append("HTML time element")

    # Calculate content age
    reference_date_str = result["modified_date"] or result["published_date"]
    if reference_date_str:
        parsed = _parse_date(reference_date_str)
        if parsed:
            now = datetime.now(parsed.tzinfo) if parsed.tzinfo else datetime.now()
            age_days = (now - parsed).days
            result["content_age_days"] = age_days
            if age_days <= 30:
                result["freshness_status"] = "fresh"
            elif age_days <= 180:
                result["freshness_status"] = "recent"
            elif age_days <= 365:
                result["freshness_status"] = "aging"
            else:
                result["freshness_status"] = "stale"

    return result


def _analyze_language(url: str, soup: BeautifulSoup, text: str) -> dict:
    """Analyze language consistency."""
    result = {
        "detected_language": "",
        "confidence": 0.0,
        "url_language": "",
        "html_lang": "",
        "meta_language": "",
        "language_match": True,
        "issues": [],
    }

    # URL language
    parsed = urlparse(url)
    path_parts = parsed.path.strip('/').split('/')
    if path_parts and len(path_parts[0]) == 2:
        result["url_language"] = path_parts[0].lower()

    # HTML lang
    html_tag = soup.find('html')
    if html_tag and html_tag.get('lang'):
        result["html_lang"] = html_tag.get('lang', '').split('-')[0].lower()

    # Meta language
    meta_lang = soup.find('meta', attrs={'http-equiv': 'content-language'})
    if meta_lang:
        result["meta_language"] = meta_lang.get('content', '').split('-')[0].lower()

    # Detect language
    if HAS_LANGDETECT and text and len(text) > 50:
        try:
            result["detected_language"] = detect(text)
            langs = detect_langs(text)
            if langs:
                result["confidence"] = round(langs[0].prob, 2)
        except Exception:
            pass

    # Check mismatches
    languages = [v for v in [result["url_language"], result["html_lang"], result["detected_language"]] if v]
    if len(set(languages)) > 1:
        result["language_match"] = False
        result["issues"].append(
            f"Language mismatch: URL={result['url_language']}, "
            f"HTML={result['html_lang']}, Detected={result['detected_language']}"
        )

    return result


def _analyze_text_quality(text: str, soup: BeautifulSoup) -> dict:
    """Analyze text quality issues."""
    result = {
        "all_caps_count": 0,
        "has_all_caps_text": False,
        "has_excessive_punctuation": False,
        "duplicate_sentences": [],
        "very_long_sentences": [],
        "very_short_paragraphs": 0,
    }

    if not text:
        return result

    words = text.split()
    all_caps = [w for w in words if len(w) >= 4 and w.isupper()]
    result["all_caps_count"] = len(all_caps)
    result["has_all_caps_text"] = len(all_caps) > 5

    punct_count = sum(1 for c in text if c in '!?')
    result["has_excessive_punctuation"] = punct_count > 10

    sentences = re.split(r'[.!?]+', text)
    for s in sentences:
        if len(s.split()) > 40:
            result["very_long_sentences"].append(s.strip()[:100] + '...')

    paragraphs = soup.find_all('p')
    for p in paragraphs:
        p_text = p.get_text(strip=True)
        if p_text and len(p_text.split()) < 20:
            result["very_short_paragraphs"] += 1

    seen = {}
    for s in sentences:
        s_clean = s.strip().lower()
        if len(s_clean) > 30:
            if s_clean in seen:
                result["duplicate_sentences"].append(s_clean[:80])
            else:
                seen[s_clean] = True

    return result


def _analyze_keywords(soup: BeautifulSoup, text: str) -> dict:
    """Analyze keyword usage and distribution."""
    result = {
        "top_words": [],
        "top_phrases": [],
        "title_keywords": [],
        "h1_keywords": [],
        "first_100_words": [],
    }

    if not text:
        return result

    words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', text.lower()) if w not in STOP_WORDS]
    total = len(words)

    word_counts = Counter(words)
    for word, count in word_counts.most_common(15):
        density = round(count / total * 100, 2) if total > 0 else 0
        result["top_words"].append({"word": word, "count": count, "density": density})

    title = soup.find('title')
    if title:
        result["title_keywords"] = [
            w for w in re.findall(r'\b[a-zA-Z]{3,}\b', title.get_text(strip=True).lower())
            if w not in STOP_WORDS
        ]

    h1 = soup.find('h1')
    if h1:
        result["h1_keywords"] = [
            w for w in re.findall(r'\b[a-zA-Z]{3,}\b', h1.get_text(strip=True).lower())
            if w not in STOP_WORDS
        ]

    result["first_100_words"] = list(set(words[:100]))[:20]

    # 2-word phrases
    phrase_counts = Counter()
    for i in range(len(words) - 1):
        phrase_counts[f"{words[i]} {words[i+1]}"] += 1
    for phrase, count in phrase_counts.most_common(10):
        if count >= 2:
            result["top_phrases"].append({"phrase": phrase, "count": count})

    return result


def _generate_issues(readability, freshness, language, text_quality) -> tuple:
    """Generate issues and recommendations."""
    issues = []
    recommendations = []

    r = readability
    if r["flesch_kincaid_grade"] > 12:
        issues.append(f"Content is too complex (Grade {r['flesch_kincaid_grade']}, target: 6-8)")
        recommendations.append("Simplify text: use shorter sentences and simpler words")
    if r["avg_sentence_length"] > 25:
        issues.append(f"Sentences too long (avg {r['avg_sentence_length']} words)")
        recommendations.append("Break long sentences into shorter ones")
    if r["word_count"] < 300:
        issues.append(f"Thin content ({r['word_count']} words)")
        recommendations.append("Expand content to at least 300-500 words")

    f = freshness
    if f["freshness_status"] == "stale":
        issues.append(f"Content is stale ({f['content_age_days']} days old)")
        recommendations.append("Update content with fresh information")
    elif f["freshness_status"] == "unknown" and not f["date_sources"]:
        issues.append("No publication date found")
        recommendations.append("Add datePublished/dateModified to schema markup")

    if language["issues"]:
        issues.extend(language["issues"])
        recommendations.append("Ensure HTML lang attribute matches content language")

    q = text_quality
    if q["has_all_caps_text"]:
        issues.append(f"Excessive ALL CAPS text ({q['all_caps_count']} words)")
        recommendations.append("Avoid using all caps for emphasis")
    if q["duplicate_sentences"]:
        issues.append(f"Duplicate sentences found ({len(q['duplicate_sentences'])})")
        recommendations.append("Remove or rewrite duplicate content")
    if q["very_long_sentences"]:
        issues.append(f"Very long sentences found ({len(q['very_long_sentences'])})")

    return issues, recommendations


def _calculate_score(readability, freshness, language, text_quality) -> int:
    """Calculate overall content quality score (0-100)."""
    score = 100

    r = readability
    if r["flesch_kincaid_grade"] > 12:
        score -= 15
    elif r["flesch_kincaid_grade"] > 10:
        score -= 8
    elif r["flesch_kincaid_grade"] > 8:
        score -= 3
    if r["word_count"] < 300:
        score -= 15
    elif r["word_count"] < 500:
        score -= 5

    f = freshness
    if f["freshness_status"] == "stale":
        score -= 15
    elif f["freshness_status"] == "aging":
        score -= 8
    elif f["freshness_status"] == "unknown":
        score -= 10

    if not language["language_match"]:
        score -= 15

    q = text_quality
    if q["has_all_caps_text"]:
        score -= 10
    if q["duplicate_sentences"]:
        score -= 10
    if q["very_long_sentences"]:
        score -= 5
    if q["has_excessive_punctuation"]:
        score -= 5

    return max(0, min(100, score))


def analyze_content(url: str, timeout: int = 30) -> dict:
    """
    Analyze content quality of a URL.

    Returns a dictionary with readability, freshness, language, text quality,
    keywords, issues, recommendations, and an overall score.
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
    text = _extract_text(soup)

    readability = _analyze_readability(text)
    freshness = _analyze_freshness(response, soup)
    language = _analyze_language(url, soup, text)
    text_quality = _analyze_text_quality(text, soup)
    keywords = _analyze_keywords(soup, text)
    issues, recommendations = _generate_issues(readability, freshness, language, text_quality)
    score = _calculate_score(readability, freshness, language, text_quality)

    return {
        "url": url,
        "score": score,
        "readability": readability,
        "freshness": freshness,
        "language": language,
        "text_quality": text_quality,
        "keywords": keywords,
        "issues": issues,
        "recommendations": recommendations,
        "optional_deps": {
            "textstat": HAS_TEXTSTAT,
            "langdetect": HAS_LANGDETECT,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Analyze content quality for SEO")
    parser.add_argument("url", help="URL to analyze")
    parser.add_argument("--json", "-j", action="store_true", help="Output full JSON")
    parser.add_argument("--timeout", "-t", type=int, default=30, help="Timeout in seconds")

    args = parser.parse_args()
    result = analyze_content(args.url, timeout=args.timeout)

    if result.get("error"):
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(result, indent=2, default=str))
    else:
        print(f"Content Analysis: {result['url']}")
        print(f"{'=' * 50}")
        print(f"Score: {result['score']}/100")
        r = result['readability']
        print(f"\nReadability:")
        print(f"  Word count:          {r['word_count']}")
        print(f"  Sentence count:      {r['sentence_count']}")
        print(f"  Avg sentence length: {r['avg_sentence_length']} words")
        print(f"  Flesch Reading Ease: {r['flesch_reading_ease']}")
        print(f"  Flesch-Kincaid:      {r['flesch_kincaid_grade']}")
        print(f"  Reading time:        {r['reading_time_minutes']} min")
        f = result['freshness']
        print(f"\nFreshness: {f['freshness_status']}")
        if f['content_age_days'] >= 0:
            print(f"  Age: {f['content_age_days']} days")
        lang = result['language']
        if lang['detected_language'] or lang['html_lang']:
            print(f"\nLanguage: detected={lang['detected_language']}, html={lang['html_lang']}")
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
