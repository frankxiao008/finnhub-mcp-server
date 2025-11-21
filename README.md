# Finnhub MCP Server

A Model Context Protocol (MCP) server that provides access to Finnhub's financial data API, enabling LLMs to retrieve real-time stock quotes, company profiles, news, financial metrics, and more.

## Features

### Available Tools

1. **finnhub_get_quote** - Get real-time stock quotes with price, change, and daily statistics
2. **finnhub_get_company_profile** - Get comprehensive company information including industry, market cap, and details
3. **finnhub_get_company_news** - Get recent news articles for specific companies
4. **finnhub_get_market_news** - Get general market news by category (general, forex, crypto, merger)
5. **finnhub_get_candles** - Get historical candlestick (OHLCV) price data
6. **finnhub_get_basic_financials** - Get financial metrics and ratios (margins, growth, valuation)
7. **finnhub_get_earnings_surprises** - Get historical earnings vs estimates
8. **finnhub_get_recommendation_trends** - Get analyst buy/hold/sell recommendations
9. **finnhub_get_company_peers** - Get list of competitor companies
10. **finnhub_get_insider_transactions** - Get insider trading activity
11. **finnhub_symbol_lookup** - Search for stock symbols by company name

## Prerequisites

- Node.js 18+ 
- A Finnhub API key (get one free at [https://finnhub.io/register](https://finnhub.io/register))
- For Vercel deployment: A Vercel account

## Installation

### 1. Clone or download this repository

```bash
git clone <your-repo-url>
cd finnhub-mcp-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Finnhub API key:

```
FINNHUB_API_KEY=your_actual_api_key_here
TRANSPORT=stdio
```

### 4. Build the project

```bash
npm run build
```

## Usage

### Local Development (stdio transport)

For local development with Claude Desktop or other MCP clients:

```bash
npm start
```

The server will run using stdio transport, which is suitable for local MCP clients.

### HTTP Server (for remote deployment)

To run as an HTTP server:

```bash
TRANSPORT=http npm start
```

The server will start on `http://localhost:3000/mcp` by default.

## Deploying to Vercel

### Step 1: Prepare your project

Ensure your project is built and ready:

```bash
npm run build
```

### Step 2: Install Vercel CLI (optional)

```bash
npm install -g vercel
```

### Step 3: Deploy via Vercel CLI

From your project directory:

```bash
vercel
```

Follow the prompts:
1. Confirm the project settings
2. Set up the project (choose default settings)
3. Deploy

### Step 4: Set Environment Variables on Vercel

After deployment, you need to add your Finnhub API key:

**Via Vercel Dashboard:**
1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - Name: `FINNHUB_API_KEY`
   - Value: Your Finnhub API key
   - Environment: Production (and Preview if needed)
4. Click "Save"

**Via Vercel CLI:**

```bash
vercel env add FINNHUB_API_KEY
```

When prompted:
- Enter your Finnhub API key
- Select environments (Production, Preview, Development)

### Step 5: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

### Step 6: Test your deployment

Your server will be available at:
```
https://your-project-name.vercel.app/mcp
```

Test the health endpoint:
```bash
curl https://your-project-name.vercel.app/health
```

You should see:
```json
{"status":"ok","server":"finnhub-mcp-server","version":"1.0.0"}
```

## Alternative Deployment: Via Git Integration

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Configure project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: Leave as default
5. Add environment variable:
   - Name: `FINNHUB_API_KEY`
   - Value: Your API key
6. Click "Deploy"

## Using with MCP Clients

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**For local (stdio):**

```json
{
  "mcpServers": {
    "finnhub": {
      "command": "node",
      "args": ["/path/to/finnhub-mcp-server/dist/index.js"],
      "env": {
        "FINNHUB_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**For Vercel deployment (HTTP):**

```json
{
  "mcpServers": {
    "finnhub": {
      "url": "https://your-project-name.vercel.app/mcp"
    }
  }
}
```

## API Rate Limits

The free Finnhub API tier includes:
- 60 API calls per minute
- Various data endpoints available

For production use, consider upgrading your Finnhub plan.

## Tool Examples

### Get a stock quote
```
"Get me the current price of Apple stock"
→ Uses finnhub_get_quote with symbol="AAPL"
```

### Get company information
```
"Tell me about Tesla"
→ Uses finnhub_get_company_profile with symbol="TSLA"
```

### Get recent news
```
"What's the latest news about Microsoft?"
→ Uses finnhub_get_company_news with symbol="MSFT"
```

### Get financial metrics
```
"Show me Apple's financial ratios"
→ Uses finnhub_get_basic_financials with symbol="AAPL"
```

### Find a symbol
```
"What's the ticker symbol for Amazon?"
→ Uses finnhub_symbol_lookup with query="Amazon"
```

## Project Structure

```
finnhub-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── constants.ts          # Configuration constants
│   ├── types.ts              # TypeScript type definitions
│   ├── schemas/              # Zod validation schemas
│   │   └── index.ts
│   ├── services/             # API services
│   │   ├── api.ts            # Finnhub API client
│   │   └── formatting.ts     # Response formatting utilities
│   └── tools/                # MCP tool implementations
│       ├── quote.ts          # Stock quote tool
│       ├── company.ts        # Company profile tool
│       ├── news.ts           # News tools
│       ├── candle.ts         # Price history tool
│       ├── financials.ts     # Financial metrics tools
│       └── additional.ts     # Additional tools
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── vercel.json               # Vercel configuration
├── .env.example              # Environment variable template
└── README.md
```

## Troubleshooting

### "FINNHUB_API_KEY is required" error

Make sure you've set the environment variable:
- Locally: Add to `.env` file
- Vercel: Add via dashboard or CLI

### Build errors

```bash
rm -rf dist node_modules
npm install
npm run build
```

### Vercel deployment issues

1. Check build logs in Vercel dashboard
2. Ensure environment variables are set
3. Verify `vercel.json` configuration
4. Check that `dist/index.js` exists after build

## License

MIT

## Support

For Finnhub API issues, visit [Finnhub Documentation](https://finnhub.io/docs/api)

For MCP protocol questions, visit [MCP Documentation](https://modelcontextprotocol.io)
