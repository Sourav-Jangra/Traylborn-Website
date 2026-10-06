export interface PriceBreakdown {
  basePrice: number;
  participants: number;
  total: number;
}

export function calculatePrice(basePrice: number, participants: number): PriceBreakdown {
  return { basePrice, participants, total: basePrice * participants };
}
