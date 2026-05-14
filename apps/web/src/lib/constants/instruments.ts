export type AssetCategory =
  | "forex-majors"
  | "forex-minors"
  | "crypto"
  | "indices"
  | "commodities"
  | "stocks";

export interface Instrument {
  symbol: string; // canonical, e.g. "EURUSD"
  display: string; // pretty, e.g. "EUR/USD"
  name: string; // full, e.g. "Euro / US Dollar"
  category: AssetCategory;
}

export interface InstrumentGroup {
  id: AssetCategory;
  label: string;
  items: Instrument[];
}

export const INSTRUMENT_GROUPS: InstrumentGroup[] = [
  {
    id: "forex-majors",
    label: "Forex Majors",
    items: [
      {
        symbol: "EURUSD",
        display: "EUR/USD",
        name: "Euro / US Dollar",
        category: "forex-majors",
      },
      {
        symbol: "GBPUSD",
        display: "GBP/USD",
        name: "British Pound / US Dollar",
        category: "forex-majors",
      },
      {
        symbol: "USDJPY",
        display: "USD/JPY",
        name: "US Dollar / Japanese Yen",
        category: "forex-majors",
      },
      {
        symbol: "USDCHF",
        display: "USD/CHF",
        name: "US Dollar / Swiss Franc",
        category: "forex-majors",
      },
      {
        symbol: "AUDUSD",
        display: "AUD/USD",
        name: "Australian Dollar / US Dollar",
        category: "forex-majors",
      },
      {
        symbol: "USDCAD",
        display: "USD/CAD",
        name: "US Dollar / Canadian Dollar",
        category: "forex-majors",
      },
      {
        symbol: "NZDUSD",
        display: "NZD/USD",
        name: "New Zealand Dollar / US Dollar",
        category: "forex-majors",
      },
    ],
  },
  {
    id: "forex-minors",
    label: "Forex Minors",
    items: [
      {
        symbol: "EURGBP",
        display: "EUR/GBP",
        name: "Euro / British Pound",
        category: "forex-minors",
      },
      {
        symbol: "EURJPY",
        display: "EUR/JPY",
        name: "Euro / Japanese Yen",
        category: "forex-minors",
      },
      {
        symbol: "GBPJPY",
        display: "GBP/JPY",
        name: "British Pound / Japanese Yen",
        category: "forex-minors",
      },
      {
        symbol: "EURCHF",
        display: "EUR/CHF",
        name: "Euro / Swiss Franc",
        category: "forex-minors",
      },
      {
        symbol: "AUDJPY",
        display: "AUD/JPY",
        name: "Australian Dollar / Japanese Yen",
        category: "forex-minors",
      },
      {
        symbol: "GBPCAD",
        display: "GBP/CAD",
        name: "British Pound / Canadian Dollar",
        category: "forex-minors",
      },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    items: [
      {
        symbol: "BTCUSD",
        display: "BTC/USD",
        name: "Bitcoin",
        category: "crypto",
      },
      {
        symbol: "ETHUSD",
        display: "ETH/USD",
        name: "Ethereum",
        category: "crypto",
      },
      {
        symbol: "SOLUSD",
        display: "SOL/USD",
        name: "Solana",
        category: "crypto",
      },
    ],
  },
  {
    id: "indices",
    label: "Indices",
    items: [
      {
        symbol: "SPX",
        display: "SPX 500",
        name: "S&P 500",
        category: "indices",
      },
      {
        symbol: "NDX",
        display: "NAS 100",
        name: "Nasdaq 100",
        category: "indices",
      },
      {
        symbol: "DJI",
        display: "DOW 30",
        name: "Dow Jones Industrial",
        category: "indices",
      },
    ],
  },
  {
    id: "commodities",
    label: "Commodities",
    items: [
      {
        symbol: "XAUUSD",
        display: "Gold",
        name: "Gold / US Dollar",
        category: "commodities",
      },
      {
        symbol: "WTIUSD",
        display: "Oil (WTI)",
        name: "WTI Crude Oil",
        category: "commodities",
      },
    ],
  },
  {
    id: "stocks",
    label: "Stocks",
    items: [
      {
        symbol: "AAPL",
        display: "AAPL",
        name: "Apple Inc.",
        category: "stocks",
      },
      {
        symbol: "MSFT",
        display: "MSFT",
        name: "Microsoft Corp.",
        category: "stocks",
      },
      {
        symbol: "NVDA",
        display: "NVDA",
        name: "NVIDIA Corp.",
        category: "stocks",
      },
      {
        symbol: "TSLA",
        display: "TSLA",
        name: "Tesla Inc.",
        category: "stocks",
      },
      {
        symbol: "AMZN",
        display: "AMZN",
        name: "Amazon.com Inc.",
        category: "stocks",
      },
    ],
  },
];

export const DEFAULT_SYMBOL = "EURUSD";
