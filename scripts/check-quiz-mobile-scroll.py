#!/usr/bin/env python3
"""Assert quiz ayah is visible on a phone-sized viewport (no black-void gap)."""

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:43123/#/quiz"


def measure(page):
    return page.evaluate(
        """() => {
          const ayah = document.querySelector('.quiz-wizard-ayah-box');
          const top = document.querySelector('.quiz-wizard-top');
          const bottom = document.querySelector('.quiz-wizard-bottom');
          const verse = document.querySelector('.quiz-wizard-verse-line');
          const step = document.querySelector('.quiz-wizard-step-head');
          if (!ayah || !top || !bottom || !verse) {
            return { ok: false, reason: 'missing nodes' };
          }
          const ar = ayah.getBoundingClientRect();
          const tr = top.getBoundingClientRect();
          const br = bottom.getBoundingClientRect();
          const wordsInAyahViewport = [...ayah.querySelectorAll('.quiz-word-arabic')].filter((el) => {
            const r = el.getBoundingClientRect();
            const clip = ayah.getBoundingClientRect();
            return r.bottom > clip.top + 2 && r.top < clip.bottom - 2 && r.height > 6;
          }).length;
          const wordsOnScreen = [...ayah.querySelectorAll('.quiz-word-arabic')].filter((el) => {
            const r = el.getBoundingClientRect();
            return r.bottom > 0 && r.top < window.innerHeight && r.height > 6;
          }).length;
          return {
            ok: true,
            ayahHeight: Math.round(ar.height),
            verseHeight: Math.round(verse.getBoundingClientRect().height),
            gap: Math.round(br.top - tr.bottom),
            wordsInAyahViewport,
            wordsOnScreen,
            wordCount: ayah.querySelectorAll('.quiz-word-token').length,
            ayahOverflowY: getComputedStyle(ayah).overflowY,
            topOverflow: getComputedStyle(top).overflow,
            ayahTop: Math.round(ar.top),
            ayahInView: ar.top < window.innerHeight && ar.bottom > 60 && ar.height > 40,
            stepOnScreen: step ? step.getBoundingClientRect().top < window.innerHeight : false,
            metaInBottom: !!bottom.querySelector('.quiz-wizard-meta-bar'),
          };
        }"""
    )


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page.emulate_media(color_scheme="dark")
        page.goto(URL, wait_until="networkidle")
        page.wait_for_selector(".quiz-wizard-ayah-box .quiz-word-arabic", timeout=30000)

        for _ in range(10):
            if page.locator(".quiz-wizard-ayah-box .quiz-word-token").count() >= 12:
                break
            page.locator(".quiz-wizard-skip").last.click()
            page.wait_for_timeout(200)

        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(100)
        metrics = measure(page)
        page.screenshot(path="/tmp/quiz-mobile-check.png", full_page=False)

        # Desktop-ish fixed pane (no mobile media query)
        page.set_viewport_size({"width": 900, "height": 800})
        page.wait_for_timeout(200)
        page.evaluate("window.scrollTo(0, 0)")
        desk = measure(page)
        page.screenshot(path="/tmp/quiz-desktop-check.png", full_page=False)
        browser.close()

    print("mobile", metrics)
    print("desktop", desk)

    assert metrics.get("ok"), metrics
    assert metrics["metaInBottom"], "meta/progress should live in bottom pane"
    assert metrics["ayahInView"], f"ayah not in view: {metrics}"
    assert metrics["wordsOnScreen"] >= 4, f"verse not readable on first screen: {metrics}"
    assert metrics["gap"] < 40, f"black-void style grid gap: {metrics}"
    assert metrics["ayahOverflowY"] == "visible", f"nested scroll still on: {metrics}"

    assert desk.get("ok"), desk
    assert desk["gap"] < 40, f"desktop gap: {desk}"
    assert desk["ayahHeight"] >= 140, f"desktop ayah still starved: {desk}"
    assert desk["wordsInAyahViewport"] >= 4, f"desktop ayah clipped empty: {desk}"
    print("PASS")


if __name__ == "__main__":
    main()
