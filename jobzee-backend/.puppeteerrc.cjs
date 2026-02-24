/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Only skip Chrome download in production (Render)
  skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
};
