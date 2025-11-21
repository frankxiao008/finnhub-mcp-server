import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { QuoteInputSchema } from "../schemas/index.js";
import { Quote } from "../types.js";
import { formatResponse, formatNumber, formatPercent, formatCurrency } from "../services/formatting.js";
import { ResponseFormat } from "../constants.js";
import { z } from "zod";

export function registerQuoteTool(server: McpServer, apiService: FinnhubAPIService) {
  server.registerTool(
    "finnhub_get_quote",
    {
      title: "Get Stock Quote",
      description: `Get real-time quote data for a stock symbol including current price, change, and daily statistics.

This tool retrieves the latest trading information for a specific stock, including current price, daily high/low, open price, previous close, and price changes.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "c": number,     // Current price
    "d": number,     // Change
    "dp": number,    // Percent change
    "h": number,     // High price of the day
    "l": number,     // Low price of the day
    "o": number,     // Open price of the day
    "pc": number,    // Previous close price
    "t": number      // Timestamp
  }

Examples:
  - Use when: "What's the current price of Apple stock?" -> params with symbol="AAPL"
  - Use when: "Get Tesla's stock quote" -> params with symbol="TSLA"

Error Handling:
  - Returns error if symbol is invalid or not found
  - Returns rate limit error if too many requests`,
      inputSchema: QuoteInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: any) => {
      try {
        const format = params.response_format ?? ResponseFormat.MARKDOWN;
        const quote = await apiService.makeRequest<Quote>("/quote", {
          symbol: params.symbol.toUpperCase()
        });

        const markdownFormatter = (data: Quote) => {
          return `# Stock Quote: ${params.symbol.toUpperCase()}

**Current Price:** ${formatCurrency(data.c)}
**Change:** ${formatNumber(data.d)} (${formatPercent(data.dp)})
**Day Range:** ${formatCurrency(data.l)} - ${formatCurrency(data.h)}
**Open:** ${formatCurrency(data.o)}
**Previous Close:** ${formatCurrency(data.pc)}
**Last Updated:** ${new Date(data.t * 1000).toISOString()}`;
        };

        const { text, structured } = formatResponse(
          quote,
          format,
          markdownFormatter
        );

        return {
          content: [{ type: "text", text }],
          // structuredContent: structured
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
          };
        }
        throw error;
      }
    }
  );
}
