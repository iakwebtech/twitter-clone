<?php

namespace App\Services;

use App\Models\Hashtag;
use App\Models\TrendingTopic;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TrendingService
{
    public function getTrendingHashtags(string $period = '24h', int $limit = 10)
    {
        return Cache::remember("trending_hashtags_{$period}_{$limit}", 120, function () use ($period, $limit) {
            $since = match ($period) {
                '24h' => now()->subDay(),
                '7d' => now()->subDays(7),
                default => null,
            };

            $query = Hashtag::query()
                ->where('is_restricted', false)
                ->select('hashtags.*');

            if ($since) {
                $query->withCount(['posts as recent_posts_count' => fn ($q) => $q->where('posts.created_at', '>=', $since)])
                    ->orderByDesc('recent_posts_count');
            }

            return $query->orderByDesc('posts_count')
                ->limit($limit)
                ->get();
        });
    }

    public function getTrendingTopics(string $period = '24h', int $limit = 10)
    {
        return TrendingTopic::query()
            ->where('is_active', true)
            ->when($period !== 'all', fn ($q) => $q->where('period', $period))
            ->orderByDesc('score')
            ->limit($limit)
            ->get();
    }

    public function refreshTrending(): void
    {
        $topHashtags = DB::table('post_hashtags')
            ->join('posts', 'posts.id', '=', 'post_hashtags.post_id')
            ->join('hashtags', 'hashtags.id', '=', 'post_hashtags.hashtag_id')
            ->where('hashtags.is_restricted', false)
            ->where('posts.created_at', '>=', now()->subDay())
            ->select('hashtags.id', DB::raw('COUNT(*) as count'))
            ->groupBy('hashtags.id')
            ->orderByDesc('count')
            ->limit(20)
            ->pluck('hashtags.id')
            ->toArray();

        Hashtag::query()->update(['is_trending' => false]);
        if (! empty($topHashtags)) {
            Hashtag::whereIn('id', $topHashtags)->update(['is_trending' => true]);
        }

        Cache::forget('sidebar_trending_hashtags');
        Cache::forget('trending_hashtags_24h_10');
        Cache::forget('trending_hashtags_7d_10');
        Cache::forget('trending_hashtags_all_10');
    }
}
