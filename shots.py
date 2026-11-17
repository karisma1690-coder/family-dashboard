import asyncio, os
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8123/index.html"
OUT = "/workspace/work/family-dashboard/shots"
os.makedirs(OUT, exist_ok=True)

async def shot(page, name, locator=None, pad=0):
    path = os.path.join(OUT, name + ".png")
    if locator:
        el = page.locator(locator).first
        await el.scroll_into_view_if_needed()
        await page.wait_for_timeout(250)
        await el.screenshot(path=path)
    else:
        await page.screenshot(path=path)
    print("saved", path)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2,
                                  is_mobile=True, has_touch=True, locale="ko-KR", timezone_id="Asia/Seoul")
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL, wait_until="load")
        await page.wait_for_timeout(6000)

        await shot(page, "01_top")
        await shot(page, "02_family", ".card-family")
        await shot(page, "03_weekly", ".card-weekly")
        await shot(page, "04_stamp_mission", ".card-stamp")

        # 미션 카드 단독
        await page.locator("#btnMissionDone").click()
        await page.wait_for_timeout(700)
        await shot(page, "05_mission", ".card-mission")

        await shot(page, "06_study", ".card-study")
        await shot(page, "07_todo", ".card-todo")
        await shot(page, "08_chat", ".card-chat")

        # 공부 추가 모달
        await page.locator('#studyMembers [data-add="study"]').first.click()
        await page.wait_for_timeout(500)
        await shot(page, "09_item_modal")
        await page.locator("#modalItem [data-close]").first.click()
        await page.wait_for_timeout(300)

        # 고정 항목 모달
        await page.locator("#btnFixedItems").click()
        await page.wait_for_timeout(500)
        await shot(page, "10_fixed_modal")
        await page.locator("#modalFixed [data-close]").first.click()
        await page.wait_for_timeout(300)

        # 설정 모달
        await page.locator("#btnSettings").click()
        await page.wait_for_timeout(500)
        await shot(page, "11_settings")
        await page.locator("#modalSettings [data-close]").first.click()
        await page.wait_for_timeout(300)

        # 타이머 작동 모습
        await page.locator('#timerPresets [data-min="20"]').click()
        await page.locator("#btnTimerStart").click()
        await page.wait_for_timeout(2200)
        await shot(page, "12_timer_running", ".timer")
        await page.locator("#btnTimerStart").click()

        # 360px 폭
        page2 = await ctx.new_page()
        await page2.set_viewport_size({"width": 360, "height": 800})
        await page2.goto(URL, wait_until="load")
        await page2.wait_for_timeout(2500)
        await page2.screenshot(path=os.path.join(OUT, "13_narrow_360.png"))

        # 데스크톱
        page3 = await ctx.new_page()
        await page3.set_viewport_size({"width": 1280, "height": 900})
        await page3.goto(URL, wait_until="load")
        await page3.wait_for_timeout(2500)
        await page3.screenshot(path=os.path.join(OUT, "14_desktop.png"))

        print("errors:", errs)
        await b.close()

asyncio.run(main())
