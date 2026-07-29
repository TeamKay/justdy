import { NextResponse } from "next/server";

// --- HELPER TO FETCH GHANA STOCK EXCHANGE PRICES ---
async function fetchGhanaStockPrice(symbol: string) {
  // Strip suffix if present (e.g., "MTNGH.GSE" -> "MTNGH")
  const cleanSymbol = symbol
    .replace(/\.(GSE|GH)$/i, "")
    .trim()
    .toLowerCase();

  try {
    // 1. Try real-time live trading endpoint
    let gseResponse = await fetch(
      `https://dev.kwayisi.org/apis/gse/live/${cleanSymbol}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    );

    let price: number | null = null;

    if (gseResponse.ok) {
      const liveData = await gseResponse.json();
      if (typeof liveData.price === "number") {
        price = liveData.price;
      }
    }

    // 2. Fallback to daily close / equities summary endpoint if live endpoint is inactive
    if (price === null) {
      gseResponse = await fetch(
        `https://dev.kwayisi.org/apis/gse/equities/${cleanSymbol}`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 }, // Cache for 5 minutes
        },
      );

      if (gseResponse.ok) {
        const equityData = await gseResponse.json();
        if (typeof equityData.price === "number") {
          price = equityData.price;
        }
      }
    }

    if (price === null) {
      return null;
    }

    // 3. Format response to match Yahoo Finance structure for seamless frontend compatibility
    return {
      chart: {
        result: [
          {
            meta: {
              currency: "GHS",
              symbol: cleanSymbol.toUpperCase(),
              regularMarketPrice: price,
              chartPreviousClose: price,
            },
          },
        ],
        error: null,
      },
    };
  } catch (err) {
    console.error(`GSE Fetch Error for ${cleanSymbol}:`, err);
    return null;
  }
}

// --- HELPER TO FETCH YAHOO FINANCE PRICES ---
async function fetchYahooPrice(symbol: string) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`Yahoo Fetch Error for ${symbol}:`, err);
    return null;
  }
}

// --- MAIN ROUTE HANDLER ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const region = searchParams.get("region")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const cleanSymbol = symbol.trim().toUpperCase();

  // Determine if it's explicitly a Ghana stock
  const isGhanaStock =
    region === "GHANA" ||
    cleanSymbol.endsWith(".GSE") ||
    cleanSymbol.endsWith(".GH");

  if (isGhanaStock) {
    const gseData = await fetchGhanaStockPrice(cleanSymbol);
    if (gseData) {
      return NextResponse.json(gseData);
    }
    return NextResponse.json(
      { error: `Ghana Stock Exchange ticker "${cleanSymbol}" not found` },
      { status: 404 },
    );
  }

  // Default: Fetch from Yahoo Finance (US/Global Stocks)
  const data = await fetchYahooPrice(cleanSymbol);

  // Fallback: If Yahoo Finance fails or returns no data, attempt Ghana Stock Exchange lookup
  if (!data || data?.chart?.result === null) {
    const fallbackGseData = await fetchGhanaStockPrice(cleanSymbol);
    if (fallbackGseData) {
      return NextResponse.json(fallbackGseData);
    }
  }

  if (!data) {
    return NextResponse.json(
      { error: `Failed to fetch data for symbol "${cleanSymbol}"` },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

// // app/api/finance/route.ts
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const symbol = searchParams.get("symbol");

//   if (!symbol) {
//     return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
//   }

//   const cleanSymbol = symbol.trim().toUpperCase();
//   const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1m&range=1d`;

//   try {
//     const response = await fetch(yahooUrl, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         Accept: "application/json",
//       },
//       // Cache price for 60 seconds to prevent hitting Yahoo rate limits
//       next: { revalidate: 60 },
//     });

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: `Yahoo returned HTTP ${response.status}` },
//         { status: response.status },
//       );
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error(`Error fetching symbol ${cleanSymbol}:`, error);
//     return NextResponse.json(
//       { error: "Failed to fetch stock data" },
//       { status: 500 },
//     );
//   }
// }
