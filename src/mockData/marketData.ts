
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
}

export const topStocks: StockData[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 187.68,
    change: 3.42,
    changePercent: 1.86,
    sparklineData: [182, 183.5, 184.2, 185.7, 186.3, 186.9, 187.68]
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 411.22,
    change: 5.78,
    changePercent: 1.43,
    sparklineData: [402.5, 405.1, 408.4, 409.5, 410.2, 410.8, 411.22]
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 728.33,
    change: 12.45,
    changePercent: 1.74,
    sparklineData: [702.1, 710.3, 712.5, 715.2, 718.9, 725.5, 728.33]
  }
];

export const bottomStocks: StockData[] = [
  {
    symbol: 'META',
    name: 'Meta Platforms',
    price: 472.01,
    change: -8.93,
    changePercent: -1.86,
    sparklineData: [485.1, 483.2, 480.5, 477.8, 475.2, 473.9, 472.01]
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    price: 605.88,
    change: -10.12,
    changePercent: -1.64,
    sparklineData: [622.5, 621.0, 618.4, 615.2, 612.1, 608.5, 605.88]
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 243.32,
    change: -7.68,
    changePercent: -3.06,
    sparklineData: [257.0, 254.2, 252.1, 249.8, 247.9, 245.1, 243.32]
  }
];

export const marketIndices = [
  {
    symbol: 'SPX',
    name: 'S&P 500',
    price: 5148.21,
    change: 12.38,
    changePercent: 0.24,
    sparklineData: [5125.8, 5130.4, 5135.2, 5139.5, 5142.3, 5145.8, 5148.21]
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones',
    price: 38989.83,
    change: -32.17,
    changePercent: -0.08,
    sparklineData: [39050.2, 39040.5, 39025.8, 39015.2, 39005.1, 38995.4, 38989.83]
  },
  {
    symbol: 'IXIC',
    name: 'Nasdaq',
    price: 16277.46,
    change: 37.82,
    changePercent: 0.23,
    sparklineData: [16220.3, 16235.8, 16245.2, 16255.8, 16265.4, 16270.2, 16277.46]
  }
];
