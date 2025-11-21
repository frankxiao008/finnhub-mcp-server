import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { 
  BasicFinancialsInputSchema, 
  EarningsSurprisesInputSchema,
  RecommendationTrendsInputSchema 
} from "../schemas/index.js";
import { BasicFinancials, EarningsSurprise, RecommendationTrend } from "../types.js";
import { formatResponse, formatNumber, truncateText } from "../services/formatting.js";
import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export function registerFinancialsTools(server: McpServer, apiService: FinnhubAPIService) {
  // Basic Financials Tool
  server.registerTool(
    "finnhub_get_basic_financials",
    {
      title: "Get Basic Financials",
      description: `Get basic financial metrics and ratios for a company.

This tool retrieves fundamental financial data including margins, valuation ratios, growth metrics, and more.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - metric ('all' | 'margin' | 'price' | 'growth' | 'valuation'): Type of metrics to retrieve (default: 'all')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "metric": object with current metric values,
    "series": {
      "annual": historical annual data,
      "quarterly": historical quarterly data
    }
  }

Examples:
  - Use when: "What are Apple's financial metrics?" -> params with symbol="AAPL", metric="all"
  - Use when: "Show me Microsoft's valuation ratios" -> params with symbol="MSFT", metric="valuation"`,
      inputSchema: BasicFinancialsInputSchema,
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
        const financials = await apiService.makeRequest<BasicFinancials>("/stock/metric", {
          symbol: params.symbol.toUpperCase(),
          metric: params.metric
        });

        const markdownFormatter = (data: BasicFinancials) => {
          let markdown = `# Basic Financials: ${params.symbol.toUpperCase()}\n\n`;
          
          if (data.metric && Object.keys(data.metric).length > 0) {
            markdown += `## Current Metrics\n\n`;
            
            const sortedMetrics = Object.entries(data.metric).sort((a, b) => a[0].localeCompare(b[0]));
            
            for (const [key, value] of sortedMetrics.slice(0, 50)) {
              markdown += `**${key}:** ${formatNumber(value)}\n`;
            }
            
            if (sortedMetrics.length > 50) {
              markdown += `\n... and ${sortedMetrics.length - 50} more metrics\n`;
            }
          }
          
          return truncateText(markdown);
        };

        const { text, structured } = formatResponse(
          financials,
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

  // Earnings Surprises Tool
  server.registerTool(
    "finnhub_get_earnings_surprises",
    {
      title: "Get Earnings Surprises",
      description: `Get historical earnings surprises for a company.

This tool retrieves past earnings reports showing actual vs estimated EPS and surprise percentages.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - limit (number): Number of records to return (1-100, default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of earnings surprise records with actual, estimate, and surprise values.

Examples:
  - Use when: "How did Apple perform vs earnings estimates?" -> params with symbol="AAPL"
  - Use when: "Show Tesla's earnings history" -> params with symbol="TSLA"`,
      inputSchema: EarningsSurprisesInputSchema,
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
        const surprises = await apiService.makeRequest<EarningsSurprise[]>("/stock/earnings", {
          symbol: params.symbol.toUpperCase(),
          limit: params.limit
        });

        if (!surprises || surprises.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No earnings data found for ${params.symbol.toUpperCase()}` 
            }]
          };
        }

        const markdownFormatter = (data: EarningsSurprise[]) => {
          let markdown = `# Earnings Surprises: ${params.symbol.toUpperCase()}\n\n`;
          markdown += `| Period | Actual EPS | Estimate EPS | Surprise | Surprise % |\n`;
          markdown += `|--------|-----------|--------------|----------|------------|\n`;
          
          data.forEach(item => {
            const period = `Q${item.quarter} ${item.year}`;
            markdown += `| ${period} | ${formatNumber(item.actual)} | ${formatNumber(item.estimate)} | ${formatNumber(item.surprise)} | ${formatNumber(item.surprisePercent)}% |\n`;
          });
          
          return markdown;
        };

        const { text, structured } = formatResponse(
          surprises,
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

  // Recommendation Trends Tool
  server.registerTool(
    "finnhub_get_recommendation_trends",
    {
      title: "Get Analyst Recommendation Trends",
      description: `Get analyst recommendation trends for a stock.

This tool retrieves the latest analyst recommendations showing buy, hold, and sell ratings over time.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of recommendation trends by period with buy/hold/sell counts.

Examples:
  - Use when: "What do analysts say about Apple stock?" -> params with symbol="AAPL"
  - Use when: "Show me analyst ratings for Tesla" -> params with symbol="TSLA"`,
      inputSchema: RecommendationTrendsInputSchema,
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
        const trends = await apiService.makeRequest<RecommendationTrend[]>("/stock/recommendation", {
          symbol: params.symbol.toUpperCase()
        });

        if (!trends || trends.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No recommendation data found for ${params.symbol.toUpperCase()}` 
            }]
          };
        }

        const markdownFormatter = (data: RecommendationTrend[]) => {
          let markdown = `# Analyst Recommendations: ${params.symbol.toUpperCase()}\n\n`;
          markdown += `| Period | Strong Buy | Buy | Hold | Sell | Strong Sell | Total |\n`;
          markdown += `|--------|-----------|-----|------|------|-------------|-------|\n`;
          
          data.forEach(item => {
            const total = item.strongBuy + item.buy + item.hold + item.sell + item.strongSell;
            markdown += `| ${item.period} | ${item.strongBuy} | ${item.buy} | ${item.hold} | ${item.sell} | ${item.strongSell} | ${total} |\n`;
          });
          
          return markdown;
        };

        const { text, structured } = formatResponse(
          trends,
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
