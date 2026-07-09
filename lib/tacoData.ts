export const officialCategories = [
  { key: 'taste', label: 'Taste', weight: 0.5, emoji: '🤤' },
  { key: 'service', label: 'Customer Service', weight: 0.2, emoji: '🤝' },
  { key: 'atmosphere', label: 'Atmosphere', weight: 0.15, emoji: '🌵' },
  { key: 'value', label: 'Value', weight: 0.15, emoji: '💵' },
] as const;
export const breakdownCategories = [
  { key: 'tortilla', label: 'Tortilla', emoji: '🫓' },
  { key: 'salsa', label: 'Salsa', emoji: '🌶️' },
  { key: 'filling', label: 'Filling Quality', emoji: '🥩' },
  { key: 'balance', label: 'Taco Balance', emoji: '⚖️' },
] as const;
export const awardOptions = ['Best Tortilla','Best Salsa','Best Meat/Filling','Best Value','Hidden Gem','Worth the Drive','Best Atmosphere','Friendliest Staff','I’ll Be Back','Hall of Fame'];
export type OfficialKey = typeof officialCategories[number]['key'];
export type BreakdownKey = typeof breakdownCategories[number]['key'];
export type Review = {
  id: string; restaurantName: string; reviewerName: string; date: string; ordered: string; price: string; photo?: string;
  sentenceReview: string; memorableQuote: string; awards: string[];
} & Record<OfficialKey | BreakdownKey, number>;
export const blankRatings = { taste: 4, service: 4, atmosphere: 4, value: 4, tortilla: 4, salsa: 4, filling: 4, balance: 4 } as Record<OfficialKey | BreakdownKey, number>;
export const seedReviews: Review[] = [{ id:'seed-jesses', restaurantName:'Jesse’s Taqueria', reviewerName:'Tour Crew', date:'2026-01-01', ordered:'Breakfast tacos', price:'', photo:'', sentenceReview:'Ready for the first official stop on the B/CS Breakfast Taco Tour.', memorableQuote:'Let the tortilla rankings begin.', awards:['Hidden Gem'], ...blankRatings }];
export function overallScore(r: Pick<Review, OfficialKey>) { return r.taste*.5 + r.service*.2 + r.atmosphere*.15 + r.value*.15; }
export function fmt(n: number) { return Number.isFinite(n) ? n.toFixed(2) : '—'; }
export function stripRetiredRatings(review: Review & { egg?: number; cheese?: number }): Review {
  const { egg: _egg, cheese: _cheese, ...activeReview } = review;
  return activeReview;
}
export function groupByRestaurant(reviews: Review[]) {
  const map = new Map<string, Review[]>();
  reviews.forEach(r => { const key = r.restaurantName.trim() || 'Unnamed Restaurant'; map.set(key, [...(map.get(key) || []), r]); });
  return [...map.entries()].map(([name, items]) => {
    const avg = (key: OfficialKey | BreakdownKey | 'overall') => items.reduce((sum, r) => sum + (key === 'overall' ? overallScore(r) : r[key]), 0) / items.length;
    const awards = [...new Set(items.flatMap(r => r.awards))];
    return { name, reviews: items, count: items.length, overall: avg('overall'), taste: avg('taste'), service: avg('service'), atmosphere: avg('atmosphere'), value: avg('value'), tortilla: avg('tortilla'), salsa: avg('salsa'), filling: avg('filling'), balance: avg('balance'), awards };
  }).sort((a,b) => b.overall - a.overall);
}
