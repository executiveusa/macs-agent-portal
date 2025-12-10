export interface MustangListing {
  id: string;
  title: string;
  url: string;
  provider: string;
  location: string;
  askingPrice: string;
  mileage: string;
  summary: string;
  freshness: string;
}

export interface FirecrawlSearchRequest {
  searchTerm?: string;
  preferredLocations?: string[];
  maxResults?: number;
}

export interface FirecrawlSearchResponse {
  listings: MustangListing[];
  source: "live" | "fallback";
}

const FALLBACK_LISTINGS: MustangListing[] = [
  {
    id: "fallback-autotrader-001",
    title: "2021 Ford Mustang Mach 1 Premium",
    url: "https://www.autotrader.com/cars-for-sale/vehicledetails.xhtml?listingId=fallback-autotrader-001",
    provider: "AutoTrader",
    location: "Phoenix, AZ",
    askingPrice: "$49,880",
    mileage: "7,205 mi",
    summary:
      "Track-ready Mach 1 with Handling Package, Tremec 6-speed manual, and Recaro seats. Perfect balance of collectability and daily usability.",
    freshness: "Updated 2 days ago",
  },
  {
    id: "fallback-bringatrailer-002",
    title: "1967 Ford Mustang Fastback 390 GTA",
    url: "https://bringatrailer.com/listing/fallback-bringatrailer-002",
    provider: "Bring a Trailer",
    location: "Nashville, TN",
    askingPrice: "Auction est. $120,000",
    mileage: "42,115 mi (TMU)",
    summary:
      "Nut-and-bolt restored S-code fastback finished in Raven Black over red deluxe interior. Concours-quality build with Marti Report.",
    freshness: "Bidding ends in 4 hours",
  },
  {
    id: "fallback-carsandbids-003",
    title: "2024 Ford Mustang Dark Horse",
    url: "https://carsandbids.com/auctions/fallback-carsandbids-003",
    provider: "Cars & Bids",
    location: "Austin, TX",
    askingPrice: "Bid at $62,500",
    mileage: "1,420 mi",
    summary:
      "3D-printed titanium shift ball, MagneRide, and the full Dark Horse Handling Package make this the most track-capable S650 yet.",
    freshness: "Live auction",
  },
];

const DEFAULT_SOURCES = [
  {
    provider: "AutoTrader",
    url: "https://www.autotrader.com/cars-for-sale/ford/mustang",
    location: "Nationwide",
  },
  {
    provider: "Cars.com",
    url: "https://www.cars.com/shopping/results/?makes[]=ford&models[]=ford-mustang",
    location: "Nationwide",
  },
  {
    provider: "Bring a Trailer",
    url: "https://bringatrailer.com/ford/mustang/",
    location: "Nationwide",
  },
  {
    provider: "Cars & Bids",
    url: "https://carsandbids.com/search?q=mustang",
    location: "Nationwide",
  },
];

const FIRECRAWL_BASE_URL = import.meta.env.VITE_FIRECRAWL_BASE_URL ?? "https://api.firecrawl.dev/v2";

export async function searchMustangListings(
  request: FirecrawlSearchRequest = {},
): Promise<FirecrawlSearchResponse> {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const searchTerm = request.searchTerm?.trim() ?? "Ford Mustang for sale";
  const maxResults = request.maxResults ?? 9;
  const preferredLocations = request.preferredLocations ?? [];

  if (!apiKey) {
    console.warn("Firecrawl API key missing. Returning fallback Mustang listings.");
    return {
      listings: FALLBACK_LISTINGS,
      source: "fallback",
    };
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const aggregatedListings: MustangListing[] = [];

    for (const source of DEFAULT_SOURCES) {
      if (aggregatedListings.length >= maxResults) break;

      const response = await fetch(`${FIRECRAWL_BASE_URL}/map`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: source.url,
          searchOptions: {
            includePatterns: ["mustang"],
            excludePatterns: ["parts", "merch"],
          },
          limit: Math.min(12, maxResults),
        }),
      });

      if (!response.ok) {
        console.warn(`Firecrawl request failed for ${source.provider}: ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as {
        success?: boolean;
        links?: Array<{ url: string; title?: string; description?: string }>;
      };

      if (!payload?.links?.length) continue;

      const curatedListings = payload.links
        .filter((link) =>
          link.title?.toLowerCase().includes("mustang") || link.description?.toLowerCase().includes("mustang"),
        )
        .slice(0, maxResults - aggregatedListings.length)
        .map((link, index) => {
          let hostname = "their marketplace";
          try {
            hostname = new URL(link.url).hostname.replace(/^www\./, "");
          } catch (error) {
            console.warn("Unable to parse Firecrawl listing URL", error);
          }

          return {
            id: `${source.provider.toLowerCase().replace(/\s+/g, "-")}-${index}-${Date.now()}`,
            title: link.title?.trim() || `${source.provider} Mustang Listing`,
            url: link.url,
            provider: source.provider,
            location: preferredLocations[0] ?? source.location,
            askingPrice: "See listing",
            mileage: "Verify on site",
            summary:
              link.description?.trim() ||
              `${source.provider} Mustang opportunity uncovered via Firecrawl from ${hostname}.`,
            freshness: `Fetched via Firecrawl for \"${searchTerm}\"`,
          } satisfies MustangListing;
        });

      aggregatedListings.push(...curatedListings);
    }

    if (!aggregatedListings.length) {
      return { listings: FALLBACK_LISTINGS, source: "fallback" };
    }

    return {
      listings: aggregatedListings.slice(0, maxResults),
      source: "live",
    };
  } catch (error) {
    console.error("Failed to fetch Firecrawl listings", error);
    return {
      listings: FALLBACK_LISTINGS,
      source: "fallback",
    };
  }
}
