import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { CompanyNewsInputSchema, MarketNewsInputSchema } from "../schemas/index.js";
import { NewsArticle, MarketNews } from "../types.js";
import { formatResponse, formatDateTime, truncateText } from "../services/formatting.js";
import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export function registerNewsTools(server: McpServer, apiService: FinnhubAPIService) {
  // Company News Tool
  server.registerTool(
    "finnhub_get_company_news",
    {
      title: "Get Company News",
      description: `Get recent news articles for a specific company.

This tool retrieves news articles related to a specific company within a date range.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - from (string): Start date in YYYY-MM-DD format
  - to (string): End date in YYYY-MM-DD format
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of news articles with:
  {
    "category": string,
    "datetime": number,
    "headline": string,
    "id": number,
    "image": string,
    "related": string,
    "source": string,
    "summary": string,
    "url": string
  }

Examples:
  - Use when: "What's the latest news about Apple?" -> params with symbol="AAPL", from=recent date, to=today
  - Use when: "Show me Tesla news from last week" -> params with symbol="TSLA", from=last week, to=today

Error Handling:
  - Returns empty array if no news found
  - Returns error if date format is invalid`,
      inputSchema: CompanyNewsInputSchema,
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
        const news = await apiService.makeRequest<NewsArticle[]>("/company-news", {
          symbol: params.symbol.toUpperCase(),
          from: params.from,
          to: params.to
        });

        if (!news || news.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No news found for ${params.symbol.toUpperCase()} between ${params.from} and ${params.to}` 
            }]
          };
        }

        const markdownFormatter = (data: NewsArticle[]) => {
          let markdown = `# News for ${params.symbol.toUpperCase()} (${params.from} to ${params.to})\n\n`;
          markdown += `Found ${data.length} article(s)\n\n`;
          
          data.forEach((article, index) => {
            markdown += `## ${index + 1}. ${article.headline}\n\n`;
            markdown += `**Source:** ${article.source}\n`;
            markdown += `**Date:** ${formatDateTime(article.datetime)}\n`;
            markdown += `**Category:** ${article.category}\n`;
            if (article.summary) {
              markdown += `**Summary:** ${article.summary}\n`;
            }
            markdown += `**URL:** ${article.url}\n\n`;
            markdown += `---\n\n`;
          });
          
          return truncateText(markdown);
        };

        const { text, structured } = formatResponse(
          news,
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

  // Market News Tool
  server.registerTool(
    "finnhub_get_market_news",
    {
      title: "Get Market News",
      description: `Get general market news articles by category.

This tool retrieves the latest market news articles from various sources, categorized by topic.

Args:
  - category ('general' | 'forex' | 'crypto' | 'merger'): News category (default: 'general')
  - min_id (number, optional): Minimum news ID for pagination
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of news articles with:
  {
    "category": string,
    "datetime": number,
    "headline": string,
    "id": number,
    "image": string,
    "related": string,
    "source": string,
    "summary": string,
    "url": string
  }

Examples:
  - Use when: "What's the latest market news?" -> params with category="general"
  - Use when: "Show me crypto news" -> params with category="crypto"

Error Handling:
  - Returns empty array if no news found`,
      inputSchema: MarketNewsInputSchema,
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
        const requestParams: Record<string, string | number> = {
          category: params.category
        };
        
        if (params.min_id) {
          requestParams.minId = params.min_id;
        }

        const news = await apiService.makeRequest<MarketNews[]>("/news", requestParams);

        if (!news || news.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No ${params.category} news found` 
            }]
          };
        }

        const markdownFormatter = (data: MarketNews[]) => {
          let markdown = `# ${params.category.toUpperCase()} Market News\n\n`;
          markdown += `Found ${data.length} article(s)\n\n`;
          
          data.slice(0, 20).forEach((article, index) => {
            markdown += `## ${index + 1}. ${article.headline}\n\n`;
            markdown += `**Source:** ${article.source}\n`;
            markdown += `**Date:** ${formatDateTime(article.datetime)}\n`;
            if (article.summary) {
              markdown += `**Summary:** ${article.summary}\n`;
            }
            markdown += `**URL:** ${article.url}\n\n`;
            markdown += `---\n\n`;
          });
          
          if (data.length > 20) {
            markdown += `\n(Showing first 20 of ${data.length} articles)\n`;
          }
          
          return truncateText(markdown);
        };

        const { text, structured } = formatResponse(
          news,
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
