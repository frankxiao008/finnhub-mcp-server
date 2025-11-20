#!/usr/bin/env python3
"""
Finnhub MCP Server

A Model Context Protocol server that provides access to Finnhub's alternative data APIs,
focusing on press releases, insider transactions, and financial data.
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List

# Import pip_system_certs BEFORE other imports to patch certifi with Windows certs
import pip_system_certs.wrapt_requests

import certifi
import requests
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Finnhub API configuration
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
API_KEY = os.getenv("FINNHUB_API_KEY")

if not API_KEY:
    raise ValueError("FINNHUB_API_KEY environment variable is required")

# Initialize the server
server = Server("finnhub-mcp-server")

# Create session for API requests with proper SSL certificate verification
session = requests.Session()
session.params = {"token": API_KEY}
session.verify = certifi.where()


@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available Finnhub alternative data tools."""
    return [
        Tool(
            name="get_press_releases",
            description="Get major press releases for a company. Returns recent press releases with headlines, summaries, and publication dates.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., AAPL, TSLA)"
                    },
                    "from_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format (optional, defaults to 30 days ago)"
                    },
                    "to_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format (optional, defaults to today)"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_insider_transactions",
            description="Get insider trading transactions for a company. Returns recent insider buy/sell activities.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., AAPL, TSLA)"
                    },
                    "from_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD format (optional, defaults to 90 days ago)"
                    },
                    "to_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD format (optional, defaults to today)"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_basic_financials",
            description="Get basic financial metrics and ratios for a company.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., AAPL, TSLA)"
                    },
                    "metric": {
                        "type": "string",
                        "description": "Metric type: 'all' for all metrics, 'price' for price metrics, 'valuation' for valuation ratios, 'margin' for margin metrics",
                        "enum": ["all", "price", "valuation", "margin"],
                        "default": "all"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_company_profile",
            description="Get detailed company profile information including business description, industry, market cap, and key metrics.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., AAPL, TSLA)"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_earnings_surprises",
            description="Get earnings surprise data showing actual vs estimated earnings.",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock symbol (e.g., AAPL, TSLA)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of quarters to retrieve (default: 4)",
                        "minimum": 1,
                        "maximum": 20,
                        "default": 4
                    }
                },
                "required": ["symbol"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
    """Handle tool calls."""
    if name == "get_press_releases":
        return await get_press_releases(arguments)
    elif name == "get_insider_transactions":
        return await get_insider_transactions(arguments)
    elif name == "get_basic_financials":
        return await get_basic_financials(arguments)
    elif name == "get_company_profile":
        return await get_company_profile(arguments)
    elif name == "get_earnings_surprises":
        return await get_earnings_surprises(arguments)
    else:
        raise ValueError(f"Unknown tool: {name}")


async def get_press_releases(args: Dict[str, Any]) -> List[TextContent]:
    """Get press releases for a company."""
    symbol = args["symbol"].upper()
    
    # Set default date range (30 days)
    to_date = args.get("to_date", datetime.now().strftime("%Y-%m-%d"))
    from_date = args.get("from_date", (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
    
    url = f"{FINNHUB_BASE_URL}/press-releases"
    params = {
        "symbol": symbol,
        "from": from_date,
        "to": to_date
    }
    
    response = session.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data.get("majorDevelopment"):
        return [TextContent(type="text", text=f"No press releases found for {symbol} between {from_date} and {to_date}")]
    
    # Format the press releases
    releases = []
    for release in data["majorDevelopment"][:10]:  # Limit to 10 most recent
        releases.append({
            "date": release.get("datetime", ""),
            "headline": release.get("headline", ""),
            "summary": release.get("summary", ""),
            "url": release.get("url", "")
        })
    
    result = {
        "symbol": symbol,
        "date_range": f"{from_date} to {to_date}",
        "press_releases": releases
    }
    
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def get_insider_transactions(args: Dict[str, Any]) -> List[TextContent]:
    """Get insider transactions for a company."""
    symbol = args["symbol"].upper()
    
    # Set default date range (90 days)
    to_date = args.get("to_date", datetime.now().strftime("%Y-%m-%d"))
    from_date = args.get("from_date", (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"))
    
    url = f"{FINNHUB_BASE_URL}/stock/insider-transactions"
    params = {
        "symbol": symbol,
        "from": from_date,
        "to": to_date
    }
    
    response = session.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data.get("data"):
        return [TextContent(type="text", text=f"No insider transactions found for {symbol} between {from_date} and {to_date}")]
    
    # Format the transactions
    transactions = []
    for transaction in data["data"][:20]:  # Limit to 20 most recent
        transactions.append({
            "date": transaction.get("transactionDate", ""),
            "name": transaction.get("name", ""),
            "share": transaction.get("share", 0),
            "change": transaction.get("change", 0),
            "filingDate": transaction.get("filingDate", ""),
            "transactionCode": transaction.get("transactionCode", ""),
            "transactionPrice": transaction.get("transactionPrice", 0)
        })
    
    result = {
        "symbol": symbol,
        "date_range": f"{from_date} to {to_date}",
        "insider_transactions": transactions
    }
    
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def get_basic_financials(args: Dict[str, Any]) -> List[TextContent]:
    """Get basic financial metrics for a company."""
    symbol = args["symbol"].upper()
    metric_type = args.get("metric", "all")
    
    url = f"{FINNHUB_BASE_URL}/stock/metric"
    params = {
        "symbol": symbol,
        "metric": "all"  # Always get all metrics, then filter
    }
    
    response = session.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data.get("metric"):
        return [TextContent(type="text", text=f"No financial metrics found for {symbol}")]
    
    metrics = data["metric"]
    
    # Filter metrics based on type
    if metric_type == "price":
        filtered_metrics = {k: v for k, v in metrics.items() if any(term in k.lower() for term in ["price", "52week", "beta"])}
    elif metric_type == "valuation":
        filtered_metrics = {k: v for k, v in metrics.items() if any(term in k.lower() for term in ["pe", "pb", "ps", "ev", "ratio"])}
    elif metric_type == "margin":
        filtered_metrics = {k: v for k, v in metrics.items() if any(term in k.lower() for term in ["margin", "roe", "roa", "roic"])}
    else:
        filtered_metrics = metrics
    
    result = {
        "symbol": symbol,
        "metric_type": metric_type,
        "metrics": filtered_metrics,
        "series": data.get("series", {})
    }
    
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def get_company_profile(args: Dict[str, Any]) -> List[TextContent]:
    """Get company profile information."""
    symbol = args["symbol"].upper()
    
    url = f"{FINNHUB_BASE_URL}/stock/profile2"
    params = {"symbol": symbol}
    
    response = session.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data:
        return [TextContent(type="text", text=f"No company profile found for {symbol}")]
    
    return [TextContent(type="text", text=json.dumps(data, indent=2))]


async def get_earnings_surprises(args: Dict[str, Any]) -> List[TextContent]:
    """Get earnings surprise data."""
    symbol = args["symbol"].upper()
    limit = args.get("limit", 4)
    
    url = f"{FINNHUB_BASE_URL}/stock/earnings"
    params = {
        "symbol": symbol,
        "limit": limit
    }
    
    response = session.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    if not data:
        return [TextContent(type="text", text=f"No earnings data found for {symbol}")]
    
    result = {
        "symbol": symbol,
        "earnings_surprises": data
    }
    
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def async_main():
    """Async main entry point."""
    # Run the server using stdio
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream, 
            write_stream, 
            InitializationOptions(
                server_name="finnhub",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


def main():
    """Main entry point for the script."""
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
