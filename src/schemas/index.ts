import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable");

export const QuoteInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  response_format: ResponseFormatSchema
});

export const CompanyProfileInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  response_format: ResponseFormatSchema
});

export const CompanyNewsInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .describe("Start date in YYYY-MM-DD format"),
  to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .describe("End date in YYYY-MM-DD format"),
  response_format: ResponseFormatSchema
});

export const MarketNewsInputSchema = z.object({
  category: z.enum(["general", "forex", "crypto", "merger"])
    .default("general")
    .describe("News category"),
  min_id: z.number()
    .int()
    .positive()
    .optional()
    .describe("Minimum news ID for pagination"),
  response_format: ResponseFormatSchema
});

export const CandleInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  resolution: z.enum(["1", "5", "15", "30", "60", "D", "W", "M"])
    .describe("Time resolution: 1, 5, 15, 30, 60 (minutes), D (day), W (week), M (month)"),
  from: z.number()
    .int()
    .positive()
    .describe("UNIX timestamp for start time"),
  to: z.number()
    .int()
    .positive()
    .describe("UNIX timestamp for end time"),
  response_format: ResponseFormatSchema
});

export const BasicFinancialsInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  metric: z.enum(["all", "margin", "price", "growth", "valuation"])
    .default("all")
    .describe("Metric type to retrieve"),
  response_format: ResponseFormatSchema
});

export const EarningsSurprisesInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe("Number of records to return"),
  response_format: ResponseFormatSchema
});

export const RecommendationTrendsInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  response_format: ResponseFormatSchema
});

export const PeersInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  response_format: ResponseFormatSchema
});

export const InsiderTransactionsInputSchema = z.object({
  symbol: z.string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must not exceed 10 characters")
    .describe("Stock ticker symbol (e.g., 'AAPL', 'GOOGL')"),
  from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .describe("Start date in YYYY-MM-DD format"),
  to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .describe("End date in YYYY-MM-DD format"),
  response_format: ResponseFormatSchema
});

export const EarningsCalendarInputSchema = z.object({
  from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .describe("Start date in YYYY-MM-DD format"),
  to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .describe("End date in YYYY-MM-DD format"),
  symbol: z.string()
    .max(10)
    .optional()
    .describe("Filter by specific symbol"),
  international: z.boolean()
    .default(false)
    .describe("Include international markets"),
  response_format: ResponseFormatSchema
});

export const SymbolLookupInputSchema = z.object({
  query: z.string()
    .min(1, "Query is required")
    .max(50, "Query must not exceed 50 characters")
    .describe("Search query (company name or ticker)"),
  response_format: ResponseFormatSchema
});
