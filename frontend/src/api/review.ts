import client from './client'
import type { ReviewItem, ReviewStats, DetailedStats } from '../types/review'

export async function getTodayReviews(): Promise<ReviewItem[]> {
  const res = await client.get<ReviewItem[]>('/reviews/today')
  return res.data
}

export async function answerReview(planId: number, quality: number): Promise<ReviewItem> {
  const res = await client.post<ReviewItem>(`/reviews/${planId}/answer`, { quality })
  return res.data
}

export async function getReviewStats(): Promise<ReviewStats> {
  const res = await client.get<ReviewStats>('/reviews/stats')
  return res.data
}

export async function getDetailedStats(): Promise<DetailedStats> {
  const res = await client.get<DetailedStats>('/reviews/detailed-stats')
  return res.data
}
