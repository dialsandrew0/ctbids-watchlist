import { chromium, Browser, Page } from 'playwright';
import { ScrapedAuctionItem, ScrapedAuctionItemSchema } from '@/lib/validators/schemas';

const CTBIDS_BASE_URL = 'https://www.ctbids.com';
const CTBIDS_WATCHING_URL = `${CTBIDS_BASE_URL}/estate-auctions/search?s=1&SearchType=10`;

interface ScraperConfig {
  username?: string;
  password?: string;
  headless?: boolean;
  timeout?: number;
}

export class CTBidsScraper {
  private browser: Browser | null = null;
  private config: Required<ScraperConfig>;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      username: config.username || '',
      password: config.password || '',
      headless: config.headless !== false,
      timeout: config.timeout || 30000,
    };
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async authenticateIfNeeded(page: Page): Promise<void> {
    if (!this.config.username || !this.config.password) {
      console.log('No CTBids credentials provided, attempting unauthenticated scraping');
      return;
    }

    try {
      // Check if already logged in
      await page.goto(CTBIDS_BASE_URL);
      const isLoggedIn = await page.locator('text=My Account').isVisible({ timeout: 5000 }).catch(() => false);

      if (isLoggedIn) {
        console.log('Already authenticated to CTBids');
        return;
      }

      // Navigate to login
      await page.goto(`${CTBIDS_BASE_URL}/security/login`);
      await page.waitForLoadState('domcontentloaded');

      // Fill login form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      await emailInput.fill(this.config.username);
      await passwordInput.fill(this.config.password);
      await page.locator('button:has-text("Login")').click();

      // Wait for navigation after login
      await page.waitForNavigation({ timeout: this.config.timeout });
      console.log('Successfully authenticated to CTBids');
    } catch (error) {
      console.error('Failed to authenticate:', error);
      throw new Error(`CTBids authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeWatchlist(): Promise<ScrapedAuctionItem[]> {
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();
    const items: ScrapedAuctionItem[] = [];

    try {
      await this.authenticateIfNeeded(page);

      // Navigate to watchlist
      await page.goto(CTBIDS_WATCHING_URL);
      await page.waitForLoadState('domcontentloaded');

      // Get all item rows
      const itemElements = await page.locator('.search-result-item, [data-testid="search-result"]').all();

      console.log(`Found ${itemElements.length} items in watchlist`);

      for (const element of itemElements) {
        try {
          const item = await this.parseItemElement(element, page);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.error('Error parsing item element:', error);
          // Continue with next item
        }
      }
    } catch (error) {
      console.error('Error scraping watchlist:', error);
      throw error;
    } finally {
      await page.close();
    }

    return items;
  }

  async scrapeItemDetail(itemUrl: string): Promise<ScrapedAuctionItem | null> {
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();

    try {
      await this.authenticateIfNeeded(page);
      await page.goto(itemUrl);
      await page.waitForLoadState('domcontentloaded');

      return await this.parseItemPage(page);
    } catch (error) {
      console.error(`Error scraping item detail from ${itemUrl}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async parseItemElement(element: any, page: Page): Promise<ScrapedAuctionItem | null> {
    try {
      // Extract basic info from the item card/row
      const title = await element.locator('h3, .item-title, [class*="title"]').first().textContent();
      const urlElement = await element.locator('a').first();
      const relativeUrl = await urlElement?.getAttribute('href');

      if (!title || !relativeUrl) return null;

      const itemUrl = relativeUrl.startsWith('http') 
        ? relativeUrl 
        : `${CTBIDS_BASE_URL}${relativeUrl}`;

      // Extract bid info
      const currentBidText = await element.locator('[class*="bid"], .current-bid').first().textContent();
      const endTimeText = await element.locator('[class*="time"], .end-time').first().textContent();

      const currentBid = this.parseBidAmount(currentBidText);
      const endTime = this.parseEndTime(endTimeText);

      // Get auction info
      const auctionTitle = await element.locator('[class*="auction-name"], .auction-title').first().textContent() || 'Unknown Auction';

      return ScrapedAuctionItemSchema.parse({
        title: title.trim(),
        url: itemUrl,
        current_bid: currentBid,
        end_time: endTime,
        auction_title: auctionTitle.trim(),
        auction_url: CTBIDS_BASE_URL,
      });
    } catch (error) {
      console.error('Error parsing item element:', error);
      return null;
    }
  }

  private async parseItemPage(page: Page): Promise<ScrapedAuctionItem | null> {
    try {
      const title = await page.locator('h1, [class*="item-title"]').first().textContent();
      const currentBidText = await page.locator('[class*="current-bid"], .bid-amount').first().textContent();
      const endTimeText = await page.locator('[class*="end-time"], .time-remaining').first().textContent();
      const imageUrl = await page.locator('img[class*="item-image"]').first().getAttribute('src');

      if (!title) return null;

      const currentBid = this.parseBidAmount(currentBidText);
      const endTime = this.parseEndTime(endTimeText);
      const auctionTitle = await page.locator('[class*="auction-name"]').first().textContent() || 'Unknown Auction';

      return ScrapedAuctionItemSchema.parse({
        title: title.trim(),
        url: page.url(),
        current_bid: currentBid,
        image_url: imageUrl,
        end_time: endTime,
        auction_title: auctionTitle.trim(),
        auction_url: CTBIDS_BASE_URL,
      });
    } catch (error) {
      console.error('Error parsing item page:', error);
      return null;
    }
  }

  private parseBidAmount(text?: string | null): number | null {
    if (!text) return null;
    const match = text.match(/\$?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  private parseEndTime(text?: string | null): string {
    if (!text) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Try to parse relative time like "2 days, 3 hours"
    try {
      const now = new Date();
      let totalMs = 0;

      // Days
      const daysMatch = text.match(/(\d+)\s*days?/i);
      if (daysMatch) {
        totalMs += parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000;
      }

      // Hours
      const hoursMatch = text.match(/(\d+)\s*hours?/i);
      if (hoursMatch) {
        totalMs += parseInt(hoursMatch[1]) * 60 * 60 * 1000;
      }

      // Minutes
      const minutesMatch = text.match(/(\d+)\s*minutes?/i);
      if (minutesMatch) {
        totalMs += parseInt(minutesMatch[1]) * 60 * 1000;
      }

      if (totalMs > 0) {
        return new Date(now.getTime() + totalMs).toISOString();
      }

      // Try parsing as absolute date
      const parsed = new Date(text);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (error) {
      console.error('Error parsing end time:', error);
    }

    // Default to 7 days from now
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// Helper function for single-use scraping
export async function scrapeWatchlist(config: ScraperConfig = {}): Promise<ScrapedAuctionItem[]> {
  const scraper = new CTBidsScraper(config);
  try {
    await scraper.init();
    return await scraper.scrapeWatchlist();
  } finally {
    await scraper.close();
  }
}

export async function scrapeItemDetail(
  itemUrl: string,
  config: ScraperConfig = {}
): Promise<ScrapedAuctionItem | null> {
  const scraper = new CTBidsScraper(config);
  try {
    await scraper.init();
    return await scraper.scrapeItemDetail(itemUrl);
  } finally {
    await scraper.close();
  }
}
