#!/usr/bin/env python3
"""
Google Maps Data Scraper – Final (auto-scroll + zoom-out fallback + menu_text)
Saves: CSV + Excel (optional)
"""

import argparse
import csv
import time
import os
import re
from typing import Optional, List

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd

# --------------------------
# Helpers
# --------------------------
def sanitize_field(s: Optional[str]) -> str:
    if s is None:
        return ""
    if not isinstance(s, str):
        s = str(s)
    # replace CR/LF with space
    s = s.replace("\r", " ").replace("\n", " ").strip()
    # remove control and format chars and private-use area
    s = re.sub(r'[\u0000-\u001F\u007F-\u009F\u200B-\u200F\uFEFF]', ' ', s)
    s = re.sub(r'[\uE000-\uF8FF]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def text_or_attr(el, attr_list=("text", "aria-label", "href")):
    try:
        if "text" in attr_list:
            t = el.text or ""
            if t.strip():
                return t.strip()
        for a in attr_list:
            if a == "text":
                continue
            try:
                v = el.get_attribute(a)
                if v and str(v).strip():
                    return str(v).strip()
            except Exception:
                continue
    except Exception:
        pass
    return ""

def extract_numeric_count(raw_text: str) -> str:
    if not raw_text:
        return ""
    norm = raw_text.replace("\u00A0", " ").replace("\u200e", "").replace("\u200f", "").strip()
    m = re.search(r"([\d,]+)", norm)
    if m:
        return m.group(1).replace(",", "")
    m2 = re.search(r"(\d+)", norm)
    if m2:
        return m2.group(1)
    return norm

# --------------------------
# WebDriver setup
# --------------------------
def setup_driver(manual_driver_path=None, headless=False):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")

    if manual_driver_path:
        manual_driver_path = os.path.abspath(manual_driver_path)
        service = ChromeService(executable_path=manual_driver_path)
        return webdriver.Chrome(service=service, options=opts)

    driver_path = ChromeDriverManager().install()
    service = ChromeService(executable_path=driver_path)
    return webdriver.Chrome(service=service, options=opts)

def wait_for(driver, by, selector, timeout=12):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )

# --------------------------
# Extract details from place page
# --------------------------
def extract_details_from_page(driver, timeout=10):
    data = {
        "name": "", "stars": "", "rating_count": "", "address": "",
        "phone": "", "website": "", "menu_link": "", "menu_text": "", "country": ""
    }

    def try_find(by, sel, wait=6):
        try:
            el = WebDriverWait(driver, wait).until(EC.presence_of_element_located((by, sel)))
            return el
        except Exception:
            return None

    # name
    name_el = try_find(By.CSS_SELECTOR, "h1[class*='fontHeadline'], h1", wait=8)
    if name_el:
        data["name"] = text_or_attr(name_el, ("text", "aria-label"))

    # stars
    star_el = try_find(By.CSS_SELECTOR, "span.section-star-display")
    if not star_el:
        star_el = try_find(By.XPATH, "//div[contains(@aria-label,'Rated') or contains(@aria-label,'stars')]")
    if star_el:
        raw = text_or_attr(star_el, ("text", "aria-label"))
        m = re.search(r"(\d+(\.\d+)?)", (raw or "").replace(",", ""))
        data["stars"] = m.group(1) if m else (raw or "")

    # --------------------
    # rating_count (robust)
    # --------------------
    data["rating_count"] = ""

    def extract_reviews_from_text(raw: str):
        if not raw:
            return ""
        # normalize and extract digits like "7,997" -> "7997"
        txt = raw.replace("\u00A0", " ").replace("\u200e", "").replace("\u200f", "").strip()
        m = re.search(r"([\d,]+)", txt)
        if m:
            return m.group(1).replace(",", "")
        m2 = re.search(r"(\d+)", txt)
        if m2:
            return m2.group(1)
        return ""

    # Try several candidates in order of likelihood
    candidates = [
        # 1 - review button aria-label (common)
        (By.XPATH, "//button[contains(@aria-label,'review') or contains(@aria-label,'reviews')]"),
        # 2 - text buttons with 'reviews' in visible text
        (By.XPATH, "//button[contains(translate(text(),'REVIEWS','reviews'),'reviews') or contains(translate(text(),'REVIEW','review'),'review')]"),
        # 3 - spans or divs that include 'reviews' in aria-label
        (By.CSS_SELECTOR, "span[aria-label*='reviews'], div[aria-label*='reviews']"),
        # 4 - near the star rating element: sibling or parent text
        (By.XPATH, "//span[contains(@class,'section-star-display')]/ancestor::div[1]"),
        (By.XPATH, "//span[contains(@class,'section-star-display')]/following::span[1]"),
        # 5 - generic: any element that looks like "(7,997)" or "7,997 reviews"
        (By.XPATH, "//*[contains(text(), 'reviews') or contains(text(), 'review') or contains(text(), '(')]"),
    ]

    for by, sel in candidates:
        try:
            el = WebDriverWait(driver, 2).until(EC.presence_of_element_located((by, sel)))
            raw = ""
            # prefer aria-label if present
            try:
                raw = (el.get_attribute("aria-label") or "").strip()
            except Exception:
                raw = ""
            if not raw:
                try:
                    raw = (el.text or "").strip()
                except Exception:
                    raw = ""
            val = extract_reviews_from_text(raw)
            if val:
                data["rating_count"] = val
                break
        except Exception:
            continue

    # Final fallback: search the whole page for any digit groups that look like counts near 'reviews'
    if not data["rating_count"]:
        try:
            page_text = driver.find_element(By.TAG_NAME, "body").text
            v = extract_reviews_from_text(page_text)
            if v:
                data["rating_count"] = v
        except Exception:
            pass
    # address
    addr_el = try_find(By.CSS_SELECTOR, "button[data-item-id='address']")
    if not addr_el:
        addr_el = try_find(By.XPATH, "//button[contains(@aria-label,'Address') or contains(text(),'Address')]")
    if addr_el:
        try:
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", addr_el)
            time.sleep(0.35)
        except Exception:
            pass
        data["address"] = text_or_attr(addr_el, ("text", "aria-label"))

    # phone
    phone_el = try_find(By.CSS_SELECTOR, "button[data-item-id='phone']")
    if phone_el:
        data["phone"] = text_or_attr(phone_el, ("text", "aria-label"))
        if not data["phone"]:
            tel = try_find(By.XPATH, "//a[starts-with(@href,'tel:')]")
            if tel:
                data["phone"] = text_or_attr(tel, ("href", "text"))
    else:
        tel = try_find(By.XPATH, "//a[starts-with(@href,'tel:')]")
        if tel:
            data["phone"] = text_or_attr(tel, ("href", "text"))

    # website + menu
    data["website"] = ""
    data["menu_link"] = ""
    data["menu_text"] = ""
    try:
        anchors = driver.find_elements(By.XPATH, "//a[@href] | //button[@aria-label] | //a[@target='_blank']")
        seen = set()
        for a in anchors:
            try:
                href = (a.get_attribute("href") or "").strip()
                aria = (a.get_attribute("aria-label") or "").strip()
                txt = (a.text or "").strip()
                # skip internal maps links
                if href and ("maps.google" in href or "www.google.com/maps" in href):
                    continue
                # website explicit
                if (("website" in aria.lower()) or ("website" in txt.lower())) and href:
                    data["website"] = href
                # menu detection - includes drive.google and any 'menu' word
                if (("menu" in aria.lower()) or ("menu" in txt.lower()) or ("menu" in (href or "").lower())
                   or "drive.google" in (href or "").lower() or "drive.google" in (txt or "").lower()):
                    if href:
                        data["menu_link"] = href
                        data["menu_text"] = txt or href
                    else:
                        data["menu_text"] = txt
                # fallback website
                if not data["website"] and href:
                    if href not in seen:
                        data["website"] = href
                        seen.add(href)
            except Exception:
                continue
    except Exception:
        pass

    # if still no menu, try label-based extraction
    if not data["menu_link"] and not data["menu_text"]:
        try:
            menu_candidates = driver.find_elements(By.XPATH, "//*[contains(translate(text(),'MENU','menu'),'menu') or contains(@aria-label,'Menu')]")
            for el in menu_candidates:
                try:
                    txt = (el.text or "").strip()
                    parent = None
                    try:
                        parent = el.find_element(By.XPATH, "..")
                    except Exception:
                        parent = None
                    if parent is not None:
                        try:
                            a = parent.find_element(By.XPATH, ".//a[@href]")
                            href = (a.get_attribute("href") or "").strip()
                            if href and "maps.google" not in href:
                                data["menu_link"] = href
                                data["menu_text"] = text_or_attr(a, ("text", "href"))
                                break
                        except Exception:
                            pass
                    try:
                        sib = el.find_element(By.XPATH, "following-sibling::*[1]")
                        if sib:
                            s_text = (sib.text or "").strip()
                            try:
                                a2 = sib.find_element(By.XPATH, ".//a[@href]")
                                href2 = (a2.get_attribute("href") or "").strip()
                                if href2 and "maps.google" not in href2:
                                    data["menu_link"] = href2
                                    data["menu_text"] = text_or_attr(a2, ("text", "href"))
                                    break
                            except Exception:
                                if s_text:
                                    data["menu_text"] = s_text
                                    break
                    except Exception:
                        pass
                    if txt and ("http" in txt or "drive.google" in txt.lower() or "menu" in txt.lower()):
                        data["menu_text"] = txt
                except Exception:
                    continue
        except Exception:
            pass

    # country from address
    if data["address"]:
        parts = data["address"].split(",")
        data["country"] = parts[-1].strip() if parts else ""

    # normalize phone
    if data["phone"]:
        p = data["phone"]
        if p.startswith("tel:"):
            p = p.split(":", 1)[1]
        data["phone"] = p.strip()

    return data

# --------------------------
# Improved iterative auto-scroll + zoom-out fallback + scraping
# --------------------------
def process_query_v2(driver, query: str, writer, max_results_per_query: Optional[int] = None):
    driver.get("https://www.google.com/maps")
    time.sleep(2)
    try:
        search_box = wait_for(driver, By.ID, "searchboxinput", timeout=12)
    except Exception:
        search_box = wait_for(driver, By.CSS_SELECTOR, "input[aria-label='Search Google Maps']", timeout=12)

    search_box.clear()
    search_box.send_keys(query)
    search_box.send_keys(Keys.ENTER)
    time.sleep(3.5)

    # helper to collect hrefs currently in DOM
    def collect_place_hrefs():
        hrefs_local = []
        try:
            link_candidates = driver.find_elements(By.XPATH, "//a[contains(@href,'/place/')]")
            for a in link_candidates:
                try:
                    href = a.get_attribute("href")
                    if href and href not in hrefs_local:
                        hrefs_local.append(href)
                except Exception:
                    continue
        except Exception:
            pass
        return hrefs_local

    # try to find left results pane (different UI variants)
    results_pane = None
    try:
        results_pane = WebDriverWait(driver, 8).until(
            EC.presence_of_element_located((By.XPATH,
                "//div[contains(@class,'m6QErb') or contains(@class,'section-result-list') or @role='region']"))
        )
    except Exception:
        results_pane = None

    # iterative scroll logic
    all_hrefs = []
    max_attempts = 8                # how many zoom-out cycles we'll try
    scroll_rounds_per_attempt = 12  # how many incremental scrolls per attempt
    zoom_outs_done = 0

    for attempt in range(max_attempts):
        prev_count = len(all_hrefs)

        if results_pane:
            # incremental small-step scrolling to trigger lazy-load
            for i in range(scroll_rounds_per_attempt):
                try:
                    driver.execute_script("arguments[0].scrollTop += 420;", results_pane)
                except Exception:
                    driver.execute_script("window.scrollBy(0, 600);")
                time.sleep(0.9)

                # collect newly added hrefs
                new = collect_place_hrefs()
                for h in new:
                    if h not in all_hrefs:
                        all_hrefs.append(h)

                if max_results_per_query and len(all_hrefs) >= max_results_per_query:
                    break

            # extra top->bottom nudge
            try:
                driver.execute_script("arguments[0].scrollTop = 0;", results_pane)
                time.sleep(0.25)
                driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight;", results_pane)
                time.sleep(0.6)
                new = collect_place_hrefs()
                for h in new:
                    if h not in all_hrefs:
                        all_hrefs.append(h)
            except Exception:
                pass
        else:
            # if no results pane found, try page-level scroll and collect
            for i in range(scroll_rounds_per_attempt):
                driver.execute_script("window.scrollBy(0, 800);")
                time.sleep(0.9)
                new = collect_place_hrefs()
                for h in new:
                    if h not in all_hrefs:
                        all_hrefs.append(h)
                if max_results_per_query and len(all_hrefs) >= max_results_per_query:
                    break

        # if enough results, break
        if max_results_per_query and len(all_hrefs) >= max_results_per_query:
            break

        # if count didn't increase, try zooming out map to expand area
        if len(all_hrefs) == prev_count:
            zoom_out_done = False
            # try clicking zoom-out button
            try:
                zbtn = driver.find_element(By.CSS_SELECTOR, "button[aria-label='Zoom out']")
                zbtn.click()
                zoom_out_done = True
            except Exception:
                try:
                    zbtn = driver.find_element(By.XPATH, "//button[contains(@aria-label,'zoom out') or contains(@title,'Zoom out')]")
                    zbtn.click()
                    zoom_out_done = True
                except Exception:
                    zoom_out_done = False

            # fallback: send '-' to map canvas
            if not zoom_out_done:
                try:
                    map_canvas = driver.find_element(By.XPATH, "//canvas | //div[contains(@class,'widget-scene-canvas')]")
                    map_canvas.send_keys("-")
                    zoom_out_done = True
                except Exception:
                    zoom_out_done = False

            if zoom_out_done:
                zoom_outs_done += 1
                time.sleep(2.0)
                # refresh results pane handle if possible
                try:
                    results_pane = driver.find_element(By.XPATH, "//div[contains(@class,'m6QErb') or contains(@class,'section-result-list') or @role='region']")
                except Exception:
                    results_pane = results_pane
                continue
            else:
                # cannot zoom programmatically — break to avoid infinite loop
                break

    # final trimming if user requested a max
    if max_results_per_query:
        all_hrefs = all_hrefs[:max_results_per_query]

    print(f"[+] Collected {len(all_hrefs)} place links — proceeding to scrape details...")

    # Now open each href in a new tab and extract details
    count = 0
    for href in all_hrefs:
        abort_scrape = False
        try:
            driver.execute_script("window.open(arguments[0], '_blank');", href)
            time.sleep(1.1)
            driver.switch_to.window(driver.window_handles[-1])
            WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(1.2)

            # try to scroll detail pane a little for lazy elements
            try:
                pane = driver.find_element(By.XPATH, "//div[@id='pane' or contains(@class,'section-hero-container')]")
                driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight/3;", pane)
                time.sleep(0.6)
            except Exception:
                pass

            details = extract_details_from_page(driver)
            details["search_query"] = query

            row = {k: sanitize_field(details.get(k, "")) for k in [
                "search_query", "name", "stars", "rating_count",
                "address", "phone", "website", "menu_link", "menu_text", "country"]}

            writer.writerow(row)
            print("✔ Scraped:", row.get("name", "<no-name>"))
            count += 1

        except Exception as e:
            print("[!] Error scraping:", e)
        finally:
            # Close current place tab (best-effort). Then switch back safely to any remaining window.
            try:
                if driver is not None:
                    driver.close()
            except Exception:
                pass
            # Now attempt to switch back to a valid open window handle.
            try:
                handles = driver.window_handles
                if handles and len(handles) > 0:
                    # switch to the last or first available handle (prefer original)
                    try:
                        driver.switch_to.window(handles[0])
                    except Exception:
                        driver.switch_to.window(handles[-1])
                else:
                    # no windows left, open a fresh maps tab
                    driver.get("https://www.google.com/maps")
                    time.sleep(1.2)
            except Exception as sw_e:
                # If session is invalid or lost, mark for abort after cleanup.
                print("Session lost while switching windows:", sw_e)
                abort_scrape = True
        if abort_scrape:
            break
    
    print(f"[+] Finished scraping {count} places for query '{query}'")

# --------------------------
# MAIN
# --------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-q", "--query", type=str)
    parser.add_argument("-f", "--file", type=str)
    parser.add_argument("--chromedriver", type=str)
    parser.add_argument("--max", type=int)
    args = parser.parse_args()

    queries = []
    if args.query:
        queries.append(args.query)
    elif args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            queries = [x.strip() for x in f if x.strip()]
    else:
        print("⚠ Example:")
        print('python google_maps_scraper.py -q "restaurants in qatar"')
        return

    driver = setup_driver(manual_driver_path=args.chromedriver)

    csv_path = "google_maps_results.csv"
    with open(csv_path, "w", newline='', encoding="utf-8-sig") as f:
        fieldnames = ["search_query", "name", "stars", "rating_count",
                      "address", "phone", "website", "menu_link", "menu_text", "country"]
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL, lineterminator="\r\n")
        writer.writeheader()

        for q in queries:
            process_query_v2(driver, q, writer, max_results_per_query=args.max)

    driver.quit()

    # optional excel export
    try:
        df = pd.read_csv(csv_path)
        df.to_excel("google_maps_results.xlsx", index=False)
        print("\n🎉 DONE! Files:")
        print("➡", csv_path)
        print("➡ google_maps_results.xlsx")
    except Exception as e:
        print("CSV saved but Excel export failed or openpyxl missing:", e)
        print("➡", csv_path)

if __name__ == "__main__":
    main()
