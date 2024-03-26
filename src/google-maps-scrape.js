import puppeteer from 'puppeteer';

async function autoScroll(page) {
  await page.evaluate(async () => {
    const wrapper = document.querySelector('div[role="feed"]')

    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 1000;
      var scrollDelay = 3000;

      var timer = setInterval(async () => {
        var scrollHeightBefore = wrapper.scrollHeight;
        wrapper.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeightBefore) {
          totalHeight = 0;
          await new Promise((resolve) => setTimeout(resolve, scrollDelay));

          // Calculate scrollHeight after waiting
          var scrollHeightAfter = wrapper.scrollHeight;

          if (scrollHeightAfter > scrollHeightBefore) {
            // More content loaded, keep scrolling
            return;
          } else {
            // No more content loaded, stop scrolling
            clearInterval(timer);
            resolve();
          }
        }
      }, 500);
    });
  });
}


export async function scrapeGoogleMaps(prompt) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
    
  // Navigate to Google Maps
  await page.goto('https://www.google.com/maps')
  
  // Type the place in search box and hit Enter

  await page.type('input[id="searchboxinput"]', prompt)
  await page.keyboard.press('Enter')
  
  // Wait for the results to load
  await page.waitForSelector('div[role="feed"]')

  await autoScroll(page)

  // Extract the data
  const places = await page.evaluate(() => {
    const results = Array.from(document.querySelectorAll('div[role="feed"] a'))
    return results.map(result => {
      const name = result.getAttribute('aria-label')
      const href = result.getAttribute('href')

      const contentContainer = result.parentNode.lastChild.querySelector('.fontBodyMedium')
      console.log(contentContainer)
      const ratingContainer = contentContainer?.querySelector('.fontBodyMedium').firstChild
      const rating = ratingContainer?.firstChild?.textContent
      const rewiews = ratingContainer?.lastChild?.textContent?.replace('(', '').replace(')', '')

      return { name, rating, rewiews, href }
    }).filter(place => place.name)
  })

  const placesCompletedInfo = []

  for (const place of places) {
    await page.goto(place.href)
    await page.waitForSelector('div[role="main"]')

    const placeInfo = await page.evaluate(() => {
      const main = document.querySelector('div[role="main"]')

      const description = main.querySelector('div[role="region"] button > .fontBodyMedium > div')?.innerText
      const address = main.querySelector('div[role="region"] button[data-item-id="address"')?.innerText
      const phone = main.querySelector('div[role="region"] button[data-item-id^=phone] .fontBodyMedium')?.innerText
      const website = main.querySelector('div[role="region"] a[data-item-id="authority"')?.innerText

      return { description, address, phone, website }
    })

    placesCompletedInfo.push({ ...place, ...placeInfo })
  }

  await browser.close()

  return placesCompletedInfo
}
