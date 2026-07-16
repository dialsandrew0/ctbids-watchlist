# CTBids Scraper Selector Notes

This document tracks the CSS selectors used to parse CTBids pages. These may break if CTBids updates their DOM structure.

## Current Selectors

### Watchlist Page
URL: https://www.ctbids.com/estate-auctions/search?s=1&SearchType=10

```javascript
// Item cards/rows
'.search-result-item' or '[data-testid="search-result"]'

// Within item:
// - Title: 'h3, .item-title, [class*="title"]'
// - URL: 'a' href
// - Current bid: '[class*="bid"], .current-bid'
// - End time: '[class*="time"], .end-time'
// - Image: 'img[class*="item-image"]' src
```

### Item Detail Page

```javascript
// Item title
'h1, [class*="item-title"]'

// Bid amount
'[class*="current-bid"], .bid-amount'

// End time
'[class*="end-time"], .time-remaining'

// Item image
'img[class*="item-image"]'

// Auction name
'[class*="auction-name"]'
```

## Fallback Strategies

If a selector fails:

1. **Log the error** - Check browser console for what changed
2. **Update selector** - Use DevTools to find new CSS class/ID
3. **Add to fallback chain** - The scraper tries multiple selectors with `.first()`
4. **Manual ingest** - Users can paste URLs directly if scraper breaks

## How to Debug

1. Open CTBids in browser
2. Right-click any item → "Inspect Element"
3. Find the actual CSS class/ID being used
4. Update `lib/scraper/ctbids.ts` with new selector
5. Test: `npm run scraper:test`

## Known Issues

- **Auction titles**: May not always be visible in item cards, sometimes requires clicking through
- **Images**: Some items may not have images, URL will be null
- **End time parsing**: Relative times ("2 days left") are parsed; absolute times parsed from ISO format
- **Bid amount formatting**: Handles currency symbols and comma-separated thousands

## Future Improvements

- [ ] Use Playwright's `waitForSelector` with timeout
- [ ] Add retry logic with exponential backoff
- [ ] Implement headless browser pool for concurrent scraping
- [ ] Cache selectors after successful parse
- [ ] Add screenshot capture on selector failure
