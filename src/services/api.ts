import { API_BASE_URL } from "../constants.js";

export class FinnhubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "FinnhubAPIError";
  }
}

export class FinnhubAPIService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "Finnhub API key is required. Set FINNHUB_API_KEY environment variable."
      );
    }
    this.apiKey = apiKey;
  }

  async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Add API key
    url.searchParams.append("token", this.apiKey);
    
    // Add other parameters
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, String(value));
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new FinnhubAPIError(
            "Rate limit exceeded. Please wait before making more requests.",
            429
          );
        }
        
        if (response.status === 401) {
          throw new FinnhubAPIError(
            "Invalid API key. Please check your FINNHUB_API_KEY.",
            401
          );
        }

        if (response.status === 403) {
          throw new FinnhubAPIError(
            "Access forbidden. This endpoint may not be available on your plan.",
            403
          );
        }

        const errorText = await response.text();
        throw new FinnhubAPIError(
          `API request failed: ${response.status} ${response.statusText}. ${errorText}`,
          response.status,
          errorText
        );
      }

      const data = await response.json() as any;
      
      // Check for API-level errors
      if (data && typeof data === 'object' && 'error' in data) {
        throw new FinnhubAPIError(`API Error: ${data.error}`, response.status, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof FinnhubAPIError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new FinnhubAPIError(
          `Network error: ${error.message}`,
          undefined,
          error
        );
      }
      
      throw new FinnhubAPIError("Unknown error occurred", undefined, error);
    }
  }
}
