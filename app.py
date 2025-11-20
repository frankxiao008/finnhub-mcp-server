#!/usr/bin/env python3
"""
Finnhub MCP Server for Hugging Face Spaces
A Gradio-based MCP server providing access to Finnhub's financial data APIs
"""

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict

import gradio as gr
import requests

# Finnhub API configuration
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
API_KEY = os.getenv("FINNHUB_API_KEY", "")

# Create session for API requests
session = requests.Session()
if API_KEY:
    session.params = {"token": API_KEY}


def get_press_releases(symbol: str, from_date: str = "", to_date: str = "") -> str:
    """Get press releases for a company."""
    if not API_KEY:
        return json.dumps({"error": "FINNHUB_API_KEY not configured"}, indent=2)

    symbol = symbol.upper().strip()
    if not symbol:
        return json.dumps({"error": "Symbol is required"}, indent=2)

    # Set default date range (30 days)
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    if not from_date:
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    url = f"{FINNHUB_BASE_URL}/press-releases"
    params = {
        "symbol": symbol,
        "from": from_date,
        "to": to_date
    }

    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("majorDevelopment"):
            return json.dumps({
                "symbol": symbol,
                "message": f"No press releases found for {symbol} between {from_date} and {to_date}"
            }, indent=2)

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

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


def get_insider_transactions(symbol: str, from_date: str = "", to_date: str = "") -> str:
    """Get insider transactions for a company."""
    if not API_KEY:
        return json.dumps({"error": "FINNHUB_API_KEY not configured"}, indent=2)

    symbol = symbol.upper().strip()
    if not symbol:
        return json.dumps({"error": "Symbol is required"}, indent=2)

    # Set default date range (90 days)
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    if not from_date:
        from_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

    url = f"{FINNHUB_BASE_URL}/stock/insider-transactions"
    params = {
        "symbol": symbol,
        "from": from_date,
        "to": to_date
    }

    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("data"):
            return json.dumps({
                "symbol": symbol,
                "message": f"No insider transactions found for {symbol} between {from_date} and {to_date}"
            }, indent=2)

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

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


def get_basic_financials(symbol: str, metric_type: str = "all") -> str:
    """Get basic financial metrics for a company."""
    if not API_KEY:
        return json.dumps({"error": "FINNHUB_API_KEY not configured"}, indent=2)

    symbol = symbol.upper().strip()
    if not symbol:
        return json.dumps({"error": "Symbol is required"}, indent=2)

    url = f"{FINNHUB_BASE_URL}/stock/metric"
    params = {
        "symbol": symbol,
        "metric": "all"
    }

    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data.get("metric"):
            return json.dumps({
                "symbol": symbol,
                "message": f"No financial metrics found for {symbol}"
            }, indent=2)

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

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


def get_company_profile(symbol: str) -> str:
    """Get company profile information."""
    if not API_KEY:
        return json.dumps({"error": "FINNHUB_API_KEY not configured"}, indent=2)

    symbol = symbol.upper().strip()
    if not symbol:
        return json.dumps({"error": "Symbol is required"}, indent=2)

    url = f"{FINNHUB_BASE_URL}/stock/profile2"
    params = {"symbol": symbol}

    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data:
            return json.dumps({
                "symbol": symbol,
                "message": f"No company profile found for {symbol}"
            }, indent=2)

        return json.dumps(data, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


def get_earnings_surprises(symbol: str, limit: int = 4) -> str:
    """Get earnings surprise data."""
    if not API_KEY:
        return json.dumps({"error": "FINNHUB_API_KEY not configured"}, indent=2)

    symbol = symbol.upper().strip()
    if not symbol:
        return json.dumps({"error": "Symbol is required"}, indent=2)

    url = f"{FINNHUB_BASE_URL}/stock/earnings"
    params = {
        "symbol": symbol,
        "limit": limit
    }

    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data:
            return json.dumps({
                "symbol": symbol,
                "message": f"No earnings data found for {symbol}"
            }, indent=2)

        result = {
            "symbol": symbol,
            "earnings_surprises": data
        }

        return json.dumps(result, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


# Create Gradio interface with tabs for each tool
with gr.Blocks(title="Finnhub MCP Server") as app:
    gr.Markdown("# Finnhub MCP Server")
    gr.Markdown("Access Finnhub's financial data APIs through MCP. Get press releases, insider transactions, financial metrics, company profiles, and earnings data.")

    if not API_KEY:
        gr.Markdown("⚠️ **Warning:** FINNHUB_API_KEY environment variable is not set. Please configure it in Hugging Face Space settings.")

    with gr.Tabs():
        with gr.Tab("Press Releases"):
            with gr.Row():
                pr_symbol = gr.Textbox(label="Stock Symbol", placeholder="e.g., AAPL, TSLA")
            with gr.Row():
                pr_from = gr.Textbox(label="From Date (YYYY-MM-DD)", placeholder="Optional, defaults to 30 days ago")
                pr_to = gr.Textbox(label="To Date (YYYY-MM-DD)", placeholder="Optional, defaults to today")
            pr_button = gr.Button("Get Press Releases")
            pr_output = gr.Textbox(label="Result", lines=20, max_lines=50)
            pr_button.click(get_press_releases, inputs=[pr_symbol, pr_from, pr_to], outputs=pr_output)

        with gr.Tab("Insider Transactions"):
            with gr.Row():
                it_symbol = gr.Textbox(label="Stock Symbol", placeholder="e.g., AAPL, TSLA")
            with gr.Row():
                it_from = gr.Textbox(label="From Date (YYYY-MM-DD)", placeholder="Optional, defaults to 90 days ago")
                it_to = gr.Textbox(label="To Date (YYYY-MM-DD)", placeholder="Optional, defaults to today")
            it_button = gr.Button("Get Insider Transactions")
            it_output = gr.Textbox(label="Result", lines=20, max_lines=50)
            it_button.click(get_insider_transactions, inputs=[it_symbol, it_from, it_to], outputs=it_output)

        with gr.Tab("Financial Metrics"):
            with gr.Row():
                fm_symbol = gr.Textbox(label="Stock Symbol", placeholder="e.g., AAPL, TSLA")
                fm_type = gr.Dropdown(
                    label="Metric Type",
                    choices=["all", "price", "valuation", "margin"],
                    value="all"
                )
            fm_button = gr.Button("Get Financial Metrics")
            fm_output = gr.Textbox(label="Result", lines=20, max_lines=50)
            fm_button.click(get_basic_financials, inputs=[fm_symbol, fm_type], outputs=fm_output)

        with gr.Tab("Company Profile"):
            cp_symbol = gr.Textbox(label="Stock Symbol", placeholder="e.g., AAPL, TSLA")
            cp_button = gr.Button("Get Company Profile")
            cp_output = gr.Textbox(label="Result", lines=20, max_lines=50)
            cp_button.click(get_company_profile, inputs=[cp_symbol], outputs=cp_output)

        with gr.Tab("Earnings Surprises"):
            with gr.Row():
                es_symbol = gr.Textbox(label="Stock Symbol", placeholder="e.g., AAPL, TSLA")
                es_limit = gr.Slider(label="Number of Quarters", minimum=1, maximum=20, value=4, step=1)
            es_button = gr.Button("Get Earnings Surprises")
            es_output = gr.Textbox(label="Result", lines=20, max_lines=50)
            es_button.click(get_earnings_surprises, inputs=[es_symbol, es_limit], outputs=es_output)

    gr.Markdown("---")
    gr.Markdown("### MCP Integration")
    gr.Markdown(f"**MCP Server URL:** `https://your-space.hf.space/gradio_api/mcp/sse`")
    gr.Markdown("Use this URL in your MCP client configuration to access these tools programmatically.")


if __name__ == "__main__":
    # Note: mcp_server=True will be available in Gradio 5.0+
    # For now, we launch as a regular Gradio app
    # When deployed to HF Spaces, update requirements.txt to gradio>=5.0
    app.launch(share=True)
