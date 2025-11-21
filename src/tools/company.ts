import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FinnhubAPIService } from "../services/api.js";
import { CompanyProfileInputSchema } from "../schemas/index.js";
import { CompanyProfile } from "../types.js";
import { formatResponse, formatMarketCap } from "../services/formatting.js";
import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export function registerCompanyProfileTool(server: McpServer, apiService: FinnhubAPIService) {
  server.registerTool(
    "finnhub_get_company_profile",
    {
      title: "Get Company Profile",
      description: `Get comprehensive company profile information including industry, market cap, and company details.

This tool retrieves detailed information about a company including its name, industry, country, IPO date, market capitalization, website, and more.

Args:
  - symbol (string): Stock ticker symbol (e.g., 'AAPL', 'GOOGL')
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  {
    "country": string,
    "currency": string,
    "exchange": string,
    "ipo": string,
    "marketCapitalization": number,
    "name": string,
    "phone": string,
    "shareOutstanding": number,
    "ticker": string,
    "weburl": string,
    "logo": string,
    "finnhubIndustry": string
  }

Examples:
  - Use when: "Tell me about Apple Inc" -> params with symbol="AAPL"
  - Use when: "What industry is Microsoft in?" -> params with symbol="MSFT"

Error Handling:
  - Returns error if symbol is invalid or not found`,
      inputSchema: CompanyProfileInputSchema,
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
        const profile = await apiService.makeRequest<CompanyProfile>("/stock/profile2", {
          symbol: params.symbol.toUpperCase()
        });

        if (!profile.name) {
          return {
            content: [{ 
              type: "text", 
              text: `No company profile found for symbol '${params.symbol.toUpperCase()}'` 
            }]
          };
        }

        const markdownFormatter = (data: CompanyProfile) => {
          return `# ${data.name} (${data.ticker})

**Industry:** ${data.finnhubIndustry || "N/A"}
**Country:** ${data.country}
**Exchange:** ${data.exchange}
**Currency:** ${data.currency}

## Financial Information
**Market Cap:** ${formatMarketCap(data.marketCapitalization)}
**Shares Outstanding:** ${(data.shareOutstanding || 0).toLocaleString()}

## Company Details
**IPO Date:** ${data.ipo || "N/A"}
**Phone:** ${data.phone || "N/A"}
**Website:** ${data.weburl || "N/A"}
${data.logo ? `**Logo:** ${data.logo}` : ""}`;
        };

        const { text, structured } = formatResponse(
          profile,
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
