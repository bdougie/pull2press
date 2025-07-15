const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/pull2press-home.png', fullPage: true });
  
  // Also get the computed styles of the button
  const buttonStyles = await page.evaluate(() => {
    const button = document.querySelector('button[type="submit"]');
    if (button) {
      const styles = window.getComputedStyle(button);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        classList: button.className
      };
    }
    return null;
  });
  
  console.log('Button styles:', buttonStyles);
  console.log('Screenshot saved to /tmp/pull2press-home.png');
  
  await browser.close();
})();