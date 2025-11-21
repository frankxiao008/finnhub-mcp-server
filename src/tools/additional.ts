import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { 
  PeersInputSchema,
  InsiderTransactionsInputSchema,
  SymbolLookupInputSchema
} from "../schemas/index.js";
import { formatResponse, formatNumber, formatCurrency, formatDate, truncateText } from "../services/formatting.js";
import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export function registerAdditionalTools(server: McpServer, apiService: FinnhubAPIService) {
  // Company Peers Tool
  server.registerTool(
    "finnhub_get_company_peers",
    {
      title: "Get Company Peers",
      description: `Get a list of company peers (similar companies in the same industry).

This tool retrieves ticker symbols of companies that are considered peers or competitors.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of peer company ticker symbols.

Examples:
  - Use when: "Who are Apple's competitors?" -> params with symbol="AAPL"
  - Use when: "Find similar companies to Tesla" -> params with symbol="TSLA"`,
      inputSchema: PeersInputSchema,
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
        const peers = await apiService.makeRequest<string[]>("/stock/peers", {
          symbol: params.symbol.toUpperCase()
        });

        if (!peers || peers.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No peer companies found for ${params.symbol.toUpperCase()}` 
            }]
          };
        }

        const markdownFormatter = (data: string[]) => {
          let markdown = `# Company Peers: ${params.symbol.toUpperCase()}\n\n`;
          markdown += `Found ${data.length} peer companies:\n\n`;
          markdown += data.map(peer => `- ${peer}`).join('\n');
          return markdown;
        };

        const { text, structured } = formatResponse(
          peers,
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

  // Insider Transactions Tool
  server.registerTool(
    "finnhub_get_insider_transactions",
    {
      title: "Get Insider Transactions",
      description: `Get insider trading transactions for a company.

This tool retrieves information about stock transactions made by company insiders (executives, directors, etc.).

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - from (string, optional): Start date in YYYY-MM-DD format
  - to (string, optional): End date in YYYY-MM-DD format
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "data": Array of insider transaction records
  }

Examples:
  - Use when: "Show me recent insider trading for Apple" -> params with symbol="AAPL"
  - Use when: "What insider activity happened at Tesla?" -> params with symbol="TSLA"`,
      inputSchema: InsiderTransactionsInputSchema,
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
        const requestParams: Record<string, string> = {
          symbol: params.symbol.toUpperCase()
        };
        
        if (params.from) requestParams.from = params.from;
        if (params.to) requestParams.to = params.to;

        const response = await apiService.makeRequest<{ data: any[] }>("/stock/insider-transactions", requestParams);

        if (!response.data || response.data.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No insider transactions found for ${params.symbol.toUpperCase()}` 
            }]
          };
        }

        const markdownFormatter = (data: { data: any[] }) => {
          let markdown = `# Insider Transactions: ${params.symbol.toUpperCase()}\n\n`;
          markdown += `Found ${data.data.length} transactions\n\n`;
          
          const transactions = data.data.slice(0, 50);
          markdown += `| Name | Shares | Change | Transaction Date | Filing Date | Price |\n`;
          markdown += `|------|--------|--------|------------------|-------------|-------|\n`;
          
          transactions.forEach(txn => {
            const name = (txn.name || "Unknown").substring(0, 30);
            const shares = formatNumber(txn.share || 0, 0);
            const change = formatNumber(txn.change || 0, 0);
            const price = txn.transactionPrice ? formatCurrency(txn.transactionPrice) : "N/A";
            markdown += `| ${name} | ${shares} | ${change} | ${txn.transactionDate || "N/A"} | ${txn.filingDate || "N/A"} | ${price} |\n`;
          });
          
          if (data.data.length > 50) {
            markdown += `\n(Showing first 50 of ${data.data.length} transactions)\n`;
          }
          
          return truncateText(markdown);
        };

        const { text, structured } = formatResponse(
          response,
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

  // Symbol Lookup Tool
  server.registerTool(
    "finnhub_symbol_lookup",
    {
      title: "Symbol Lookup",
      description: `Search for stock symbols by company name or partial symbol.

This tool helps find the correct ticker symbol when you know the company name or partial symbol.

Args:
  - query (string): Search query (company name or partial ticker)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "count": number,
    "result": Array of matching symbols with descriptions
  }

Examples:
  - Use when: "What's the ticker for Apple?" -> params with query="Apple"
  - Use when: "Find symbols starting with GOOG" -> params with query="GOOG"
  - Use when: "Search for Microsoft stock" -> params with query="Microsoft"`,
      inputSchema: SymbolLookupInputSchema,
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
        const results = await apiService.makeRequest<{ count: number; result: any[] }>("/search", {
          q: params.query
        });

        if (!results.result || results.result.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No symbols found matching '${params.query}'` 
            }]
          };
        }

        const markdownFormatter = (data: { count: number; result: any[] }) => {
          let markdown = `# Symbol Search Results: "${params.query}"\n\n`;
          markdown += `Found ${data.count} result(s)\n\n`;
          
          const displayResults = data.result.slice(0, 20);
          markdown += `| Symbol | Description | Type | Exchange |\n`;
          markdown += `|--------|-------------|------|----------|\n`;
          
          displayResults.forEach(item => {
            markdown += `| ${item.symbol || "N/A"} | ${(item.description || "N/A").substring(0, 50)} | ${item.type || "N/A"} | ${item.displaySymbol || item.symbol || "N/A"} |\n`;
          });
          
          if (data.result.length > 20) {
            markdown += `\n(Showing first 20 of ${data.count} results)\n`;
          }
          
          return markdown;
        };

        const { text, structured } = formatResponse(
          results,
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
