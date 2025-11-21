import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { FinnhubAPIService } from "./services/api.js";
import { registerQuoteTool } from "./tools/quote.js";
import { registerCompanyProfileTool } from "./tools/company.js";
import { registerNewsTools } from "./tools/news.js";
import { registerCandleTool } from "./tools/candle.js";
import { registerFinancialsTools } from "./tools/financials.js";
import { registerAdditionalTools } from "./tools/additional.js";

// Initialize MCP Server
const server = new McpServer({
  name: "finnhub-mcp-server",
  version: "1.0.0"
});

// Get API key from environment
const apiKey = process.env.FINNHUB_API_KEY;
if (!apiKey) {
  console.error("Error: FINNHUB_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize API service
const apiService = new FinnhubAPIService(apiKey);

// Register all tools
registerQuoteTool(server, apiService);
registerCompanyProfileTool(server, apiService);
registerNewsTools(server, apiService);
registerCandleTool(server, apiService);
registerFinancialsTools(server, apiService);
registerAdditionalTools(server, apiService);

// Transport selection
const transport = process.env.TRANSPORT || "stdio";

async function runStdio() {
  console.error("Starting Finnhub MCP server with stdio transport...");
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
  console.error("Finnhub MCP server running on stdio");
}

async function runHTTP() {
  console.error("Starting Finnhub MCP server with HTTP transport...");
  
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "finnhub-mcp-server", version: "1.0.0" });
  });

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });
    
    res.on("close", () => transport.close());
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`Finnhub MCP server running on http://localhost:${port}/mcp`);
    console.error(`Health check available at http://localhost:${port}/health`);
  });
}

// Start server
if (transport === "http") {
  runHTTP().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
