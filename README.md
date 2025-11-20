---
title: Finnhub MCP Server
emoji: 📈
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 5.0.0
app_file: app.py
pinned: false
license: mit
---

# Finnhub MCP Server

A Model Context Protocol (MCP) server that provides access to Finnhub's financial data APIs through a Gradio interface. This server can be used as a standalone web app or integrated with MCP-compatible clients like Claude Desktop or VS Code.

## Features

This MCP server provides 5 powerful financial data tools:

### 1. **Press Releases**
Get major press releases for any company with headlines, summaries, and publication dates.

### 2. **Insider Transactions**
Track insider trading activities including buy/sell transactions by company insiders.

### 3. **Financial Metrics**
Access comprehensive financial metrics and ratios:
- **All metrics**: Complete financial overview
- **Price metrics**: Stock prices, 52-week ranges, beta
- **Valuation ratios**: P/E, P/B, P/S, EV ratios
- **Margin metrics**: ROE, ROA, ROIC, profit margins

### 4. **Company Profile**
Retrieve detailed company information including business description, industry, market cap, and more.

### 5. **Earnings Surprises**
View earnings surprise data showing actual vs estimated earnings over multiple quarters.

## Setup

### Getting a Finnhub API Key

1. Sign up for a free account at [Finnhub.io](https://finnhub.io/)
2. Get your API key from the dashboard
3. Add the API key to this Space's environment variables:
   - Go to Space Settings → Variables and secrets
   - Add: `FINNHUB_API_KEY` = `your_api_key_here`

## Usage

### As a Web Interface

Simply use the tabs in this Space to interact with each tool. Enter a stock symbol (e.g., AAPL, TSLA, MSFT) and optional parameters, then click the button to fetch data.

### As an MCP Server

You can integrate this server with MCP-compatible clients:

#### MCP Endpoint URL
```
https://your-username-finnhub-mcp.hf.space/gradio_api/mcp/sse
```

#### Configuration for VS Code

Create or update `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "finnhub": {
      "url": "https://your-username-finnhub-mcp.hf.space/gradio_api/mcp/sse"
    }
  }
}
```

#### Configuration for Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "finnhub": {
      "url": "https://your-username-finnhub-mcp.hf.space/gradio_api/mcp/sse"
    }
  }
}
```

## Example Queries

### Press Releases
```
Symbol: AAPL
From Date: 2024-01-01
To Date: 2024-01-31
```

### Insider Transactions
```
Symbol: TSLA
From Date: 2024-01-01
To Date: 2024-03-31
```

### Financial Metrics
```
Symbol: MSFT
Metric Type: valuation
```

### Company Profile
```
Symbol: GOOGL
```

### Earnings Surprises
```
Symbol: NVDA
Quarters: 4
```

## API Rate Limits

- **Free tier**: 60 API calls/minute
- **Upgrade**: Consider upgrading your Finnhub plan for higher limits

## Technical Details

### Tools Available via MCP

When using this as an MCP server, the following tools are exposed:

1. `get_press_releases` - Fetch company press releases
2. `get_insider_transactions` - Get insider trading data
3. `get_basic_financials` - Retrieve financial metrics
4. `get_company_profile` - Get company information
5. `get_earnings_surprises` - View earnings surprise data

### Technology Stack

- **Gradio**: Web interface and MCP server hosting
- **Finnhub API**: Financial data source
- **Python**: Backend implementation
- **Hugging Face Spaces**: Free hosting platform

## Local Development

To run this locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set your API key:
   ```bash
   export FINNHUB_API_KEY=your_api_key_here
   ```

4. Run the app:
   ```bash
   python app.py
   ```

5. Access at `http://localhost:7860`
6. MCP endpoint at `http://localhost:7860/gradio_api/mcp/sse`

## License

MIT License - Feel free to use and modify for your needs.

## Links

- [Finnhub API Documentation](https://finnhub.io/docs/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Gradio MCP Guide](https://www.gradio.app/guides/mcp-server)

## Support

For issues or questions:
- Check [Finnhub API Status](https://status.finnhub.io/)
- Review [Finnhub API Docs](https://finnhub.io/docs/api)
- Verify your API key is correctly configured
