import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { CandleInputSchema } from "../schemas/index.js";
import { Candle } from "../types.js";
import { formatResponse, formatCurrency, formatDate } from "../services/formatting.js";
import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export function registerCandleTool(server: McpServer, apiService: FinnhubAPIService) {
  server.registerTool(
    "finnhub_get_candles",
    {
      title: "Get Stock Candles",
      description: `Get historical candlestick (OHLCV) data for a stock.

This tool retrieves historical price data including open, high, low, close prices and volume for a specific time period and resolution.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - resolution (string): Time resolution - '1', '5', '15', '30', '60' (minutes), 'D' (day), 'W' (week), 'M' (month)
  - from (number): Start time as UNIX timestamp
  - to (number): End time as UNIX timestamp
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "c": number[],  // Close prices
    "h": number[],  // High prices
    "l": number[],  // Low prices
    "o": number[],  // Open prices
    "s": string,    // Status ("ok" or "no_data")
    "t": number[],  // Timestamps
    "v": number[]   // Volume
  }

Examples:
  - Use when: "Get Apple's daily price history for last month"
  - Use when: "Show me Tesla's hourly candles for yesterday"

Error Handling:
  - Returns status "no_data" if no data available for the period
  - Returns error if symbol is invalid`,
      inputSchema: CandleInputSchema,
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
        const candle = await apiService.makeRequest<Candle>("/stock/candle", {
          symbol: params.symbol.toUpperCase(),
          resolution: params.resolution,
          from: params.from,
          to: params.to
        });

        if (candle.s === "no_data") {
          return {
            content: [{ 
              type: "text", 
              text: `No candle data found for ${params.symbol.toUpperCase()} in the specified time range` 
            }]
          };
        }

        const markdownFormatter = (data: Candle) => {
          const dataPoints = data.c.length;
          let markdown = `# Candlestick Data: ${params.symbol.toUpperCase()}\n\n`;
          markdown += `**Resolution:** ${params.resolution}\n`;
          markdown += `**Period:** ${formatDate(params.from)} to ${formatDate(params.to)}\n`;
          markdown += `**Data Points:** ${dataPoints}\n\n`;
          
          if (dataPoints > 0) {
            markdown += `## Summary\n`;
            markdown += `**First Close:** ${formatCurrency(data.c[0])}\n`;
            markdown += `**Last Close:** ${formatCurrency(data.c[dataPoints - 1])}\n`;
            markdown += `**Period High:** ${formatCurrency(Math.max(...data.h))}\n`;
            markdown += `**Period Low:** ${formatCurrency(Math.min(...data.l))}\n`;
            markdown += `**Total Volume:** ${data.v.reduce((a, b) => a + b, 0).toLocaleString()}\n\n`;
            
            // Show last 10 data points
            const lastN = Math.min(10, dataPoints);
            markdown += `## Last ${lastN} Data Points\n\n`;
            markdown += `| Date | Open | High | Low | Close | Volume |\n`;
            markdown += `|------|------|------|-----|-------|--------|\n`;
            
            for (let i = dataPoints - lastN; i < dataPoints; i++) {
              markdown += `| ${formatDate(data.t[i])} | ${formatCurrency(data.o[i])} | ${formatCurrency(data.h[i])} | ${formatCurrency(data.l[i])} | ${formatCurrency(data.c[i])} | ${data.v[i].toLocaleString()} |\n`;
            }
            
            if (dataPoints > lastN) {
              markdown += `\n(Showing last ${lastN} of ${dataPoints} data points)\n`;
            }
          }
          
          return markdown;
        };

        const { text, structured } = formatResponse(
          candle,
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
