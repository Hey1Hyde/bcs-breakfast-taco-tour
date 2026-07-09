export const legacyCategories = [
  { key: 'taste', label: 'Taste', emoji: '🤤' },
  { key: 'service', label: 'Customer Service', emoji: '🤝' },
  { key: 'atmosphere', label: 'Atmosphere', emoji: '🌵' },
  { key: 'value', label: 'Value', emoji: '💵' },
] as const;
export const breakdownCategories = [
  { key: 'tortilla', label: 'Tortilla', emoji: '🫓' },
  { key: 'salsa', label: 'Salsa', emoji: '🌶️' },
  { key: 'filling', label: 'Filling Quality', emoji: '🥩' },
  { key: 'balance', label: 'Taco Balance', emoji: '⚖️' },
] as const;
export const ratingKeys = [...legacyCategories, ...breakdownCategories].map(category => category.key);
export const awardOptions = ['Best Tortilla','Best Salsa','Best Meat/Filling','Hidden Gem','Worth the Drive','I’ll Be Back','Hall of Fame'];
const activeAwardOptions = new Set<string>(awardOptions);
export type LegacyKey = typeof legacyCategories[number]['key'];
export type BreakdownKey = typeof breakdownCategories[number]['key'];
export type RatingKey = LegacyKey | BreakdownKey;
export type Review = {
  id: string; restaurantName: string; reviewerName: string; date: string; ordered: string; price: string;
  sentenceReview: string; memorableQuote: string; awards: string[];
} & Record<RatingKey, number>;
export const blankRatings = { taste: 8, service: 8, atmosphere: 8, value: 8, tortilla: 8, salsa: 8, filling: 8, balance: 8 } as Record<RatingKey, number>;
export function overallScore(r: Pick<Review, BreakdownKey>) { return (r.tortilla + r.salsa + r.filling + r.balance) / 4; }
export function fmt(n: number) { return Number.isFinite(n) ? n.toFixed(2) : '—'; }
export function normalizeRating(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.round(Math.min(10, Math.max(1, numberValue)) * 10) / 10 : 8;
}
export function normalizeReview(review: Partial<Review> & Record<string, unknown>): Review {
  return {
    id: typeof review.id === 'string' ? review.id : crypto.randomUUID(),
    restaurantName: typeof review.restaurantName === 'string' ? review.restaurantName : 'Unnamed Restaurant',
    reviewerName: typeof review.reviewerName === 'string' ? review.reviewerName : 'Anonymous',
    date: typeof review.date === 'string' ? review.date : new Date().toISOString().slice(0,10),
    ordered: typeof review.ordered === 'string' ? review.ordered : '',
    price: typeof review.price === 'string' ? review.price : '',
    sentenceReview: typeof review.sentenceReview === 'string' ? review.sentenceReview : '',
    memorableQuote: typeof review.memorableQuote === 'string' ? review.memorableQuote : '',
    awards: Array.isArray(review.awards) ? review.awards.filter((award): award is string => typeof award === 'string') : [],
    taste: normalizeRating(review.taste),
    service: normalizeRating(review.service),
    atmosphere: normalizeRating(review.atmosphere),
    value: normalizeRating(review.value),
    tortilla: normalizeRating(review.tortilla),
    salsa: normalizeRating(review.salsa),
    filling: normalizeRating(review.filling),
    balance: normalizeRating(review.balance),
  };
}
export function groupByRestaurant(reviews: Review[]) {
  const map = new Map<string, Review[]>();
  reviews.forEach(r => { const key = r.restaurantName.trim() || 'Unnamed Restaurant'; map.set(key, [...(map.get(key) || []), r]); });
  return [...map.entries()].map(([name, items]) => {
    const avg = (key: RatingKey | 'overall') => items.reduce((sum, r) => sum + (key === 'overall' ? overallScore(r) : r[key]), 0) / items.length;
    const awards = [...new Set(items.flatMap(r => r.awards))].filter(award => activeAwardOptions.has(award));
    return { name, reviews: items, count: items.length, overall: avg('overall'), taste: avg('taste'), service: avg('service'), atmosphere: avg('atmosphere'), value: avg('value'), tortilla: avg('tortilla'), salsa: avg('salsa'), filling: avg('filling'), balance: avg('balance'), awards };
  }).sort((a,b) => b.overall - a.overall);
}
