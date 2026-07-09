import { Review, stripRetiredRatings } from '@/lib/tacoData';
import { supabase } from '@/lib/supabase';

type ReviewRow = {
  id: string;
  restaurant_id: string;
  reviewer_name: string;
  review_date: string;
  ordered: string | null;
  price: string | null;
  taste: number;
  service: number;
  atmosphere: number;
  value: number;
  tortilla: number;
  salsa: number;
  filling: number;
  balance: number;
  sentence_review: string | null;
  memorable_quote: string | null;
  restaurant: { name: string } | null;
  awards: { award: { name: string } | null }[] | null;
};

function rowToReview(row: ReviewRow): Review {
  return stripRetiredRatings({
    id: row.id,
    restaurantName: row.restaurant?.name || 'Unnamed Restaurant',
    reviewerName: row.reviewer_name,
    date: row.review_date,
    ordered: row.ordered || '',
    price: row.price || '',
    photo: '',
    taste: Number(row.taste),
    service: Number(row.service),
    atmosphere: Number(row.atmosphere),
    value: Number(row.value),
    tortilla: Number(row.tortilla),
    salsa: Number(row.salsa),
    filling: Number(row.filling),
    balance: Number(row.balance),
    sentenceReview: row.sentence_review || '',
    memorableQuote: row.memorable_quote || '',
    awards: (row.awards || []).map(item => item.award?.name).filter((name): name is string => Boolean(name)),
  });
}

export async function loadReviews(): Promise<Review[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('reviews')
    .select('id, restaurant_id, reviewer_name, review_date, ordered, price, taste, service, atmosphere, value, tortilla, salsa, filling, balance, sentence_review, memorable_quote, restaurant:restaurants(name), awards:review_awards(award:awards(name))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as unknown as ReviewRow[]).map(rowToReview);
}

export async function saveReviewToDatabase(review: Review): Promise<Review> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const restaurantName = review.restaurantName.trim();
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .upsert({ name: restaurantName }, { onConflict: 'name' })
    .select('id, name')
    .single();

  if (restaurantError) throw restaurantError;

  const { data: reviewRow, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      restaurant_id: restaurant.id,
      reviewer_name: review.reviewerName.trim(),
      review_date: review.date,
      ordered: review.ordered,
      price: review.price,
      taste: review.taste,
      service: review.service,
      atmosphere: review.atmosphere,
      value: review.value,
      tortilla: review.tortilla,
      salsa: review.salsa,
      filling: review.filling,
      balance: review.balance,
      sentence_review: review.sentenceReview,
      memorable_quote: review.memorableQuote,
    })
    .select('id')
    .single();

  if (reviewError) throw reviewError;

  if (review.awards.length > 0) {
    const awardRows = await Promise.all(review.awards.map(async name => {
      const { data: award, error: awardError } = await supabase!
        .from('awards')
        .upsert({ name }, { onConflict: 'name' })
        .select('id')
        .single();
      if (awardError) throw awardError;
      return { review_id: reviewRow.id, award_id: award.id };
    }));

    const { error: awardLinkError } = await supabase
      .from('review_awards')
      .insert(awardRows);
    if (awardLinkError) throw awardLinkError;
  }

  return { ...stripRetiredRatings(review), id: reviewRow.id, restaurantName };
}
