/**
 * Browser Stealth Module
 * Makes browser automation undetectable
 */

export interface StealthConfig {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
  webgl: boolean;
  canvas: boolean;
}

/**
 * Generate realistic user agent for Chrome
 */
export function generateUserAgent(): string {
  const chromeVersions = ['120', '121', '122', '123'];
  const osPlatforms = [
    'Windows NT 10.0; Win64; x64',
    'Macintosh; Intel Mac OS X 10_15_7',
    'X11; Linux x86_64',
  ];

  const chrome = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  const platform = osPlatforms[Math.floor(Math.random() * osPlatforms.length)];

  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome}.0.0.0 Safari/537.36`;
}

/**
 * Generate random but realistic viewport size
 */
export function generateViewport(): { width: number; height: number } {
  const commonResolutions = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1440 },
  ];

  return commonResolutions[Math.floor(Math.random() * commonResolutions.length)];
}

/**
 * Generate stealth configuration
 */
export function generateStealthConfig(): StealthConfig {
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Denver',
    'Europe/London',
  ];

  const locales = ['en-US', 'en-GB', 'en-CA'];

  return {
    userAgent: generateUserAgent(),
    viewport: generateViewport(),
    locale: locales[Math.floor(Math.random() * locales.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    webgl: true,
    canvas: true,
  };
}

/**
 * Get stealth flags for agent-browser
 */
export function getStealthFlags(config: StealthConfig): string[] {
  return [
    `--user-agent="${config.userAgent}"`,
    `--window-size=${config.viewport.width},${config.viewport.height}`,
    `--lang=${config.locale}`,
    `--timezone-id=${config.timezone}`,
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
  ];
}

/**
 * JavaScript to inject into page to mask automation
 */
export function getStealthScript(): string {
  return `
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });

    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Mock chrome runtime
    window.chrome = {
      runtime: {}
    };

    // Remove automation indicators
    delete navigator.__proto__.webdriver;
  `;
}
