<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\RecentSearch;
use App\Models\User;
use App\Services\PostService;
use App\Services\TrendingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExploreController extends Controller
{
    public function __construct(
        private PostService $postService,
        private TrendingService $trendingService,
    ) {}

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $filter = $request->query('filter', 'popular');
        $period = $request->query('period', '24h');
        $viewer = $request->user();
        $viewerId = $viewer?->id;

        if ($q !== '' && $viewer) {
            RecentSearch::updateOrCreate(
                ['user_id' => $viewer->id, 'query' => $q],
                ['updated_at' => now()]
            );
        }

        $posts = [];
        $users = [];

        if ($q !== '') {
            $cleanTag = ltrim($q, '#');
            if ($filter === 'users') {
                $users = UserResource::collection(
                    User::with('profile')
                        ->where('is_suspended', false)
                        ->where('is_deactivated', false)
                        ->where(function ($query) use ($q) {
                            $query->where('name', 'like', "%{$q}%")
                                ->orWhere('username', 'like', "%{$q}%");
                        })
                        ->limit(25)
                        ->get()
                )->resolve($request);
            } else {
                $postQuery = Post::query()
                    ->with($this->postService->defaultRelations($viewerId))
                    ->published()
                    ->where('visibility', 'public')
                    ->whereHas('user', fn ($u) => $u->where('is_suspended', false)->where('is_deactivated', false)->where('is_private', false));

                if (str_starts_with($q, '#')) {
                    $postQuery->whereHas('hashtags', fn ($h) => $h->where('name', strtolower($cleanTag)));
                } else {
                    $postQuery->where(function ($pq) use ($q) {
                        $pq->where('content', 'like', "%{$q}%")
                            ->orWhereHas('user', fn ($u) => $u->where('username', 'like', "%{$q}%")->orWhere('name', 'like', "%{$q}%"));
                    });
                }

                if ($filter === 'media') {
                    $postQuery->whereHas('media');
                }

                if ($filter === 'popular') {
                    $postQuery->orderByDesc('likes_count')->orderByDesc('reposts_count');
                } else {
                    $postQuery->orderByDesc('created_at');
                }

                $posts = PostResource::collection($postQuery->limit(25)->get())->resolve($request);
            }
        } else {
            $posts = PostResource::collection(
                Post::with($this->postService->defaultRelations($viewerId))
                    ->published()
                    ->topLevel()
                    ->where('visibility', 'public')
                    ->whereHas('user', fn ($u) => $u->where('is_suspended', false)->where('is_deactivated', false)->where('is_private', false))
                    ->orderByDesc('likes_count')
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get()
            )->resolve($request);
        }

        $recentSearches = $viewer
            ? $viewer->recentSearches()->latest('updated_at')->limit(6)->get(['id', 'query'])
            : [];

        return Inertia::render('Explore/Index', [
            'query' => $q,
            'filter' => $filter,
            'period' => $period,
            'posts' => $posts,
            'users' => $users,
            'trendingHashtags' => $this->trendingService->getTrendingHashtags($period, 12),
            'trendingTopics' => $this->trendingService->getTrendingTopics($period, 8),
            'recentSearches' => $recentSearches,
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (strlen($q) < 1) {
            return response()->json(['users' => [], 'hashtags' => []]);
        }

        $users = User::with('profile')
            ->where('is_suspended', false)
            ->where('is_deactivated', false)
            ->where(function ($query) use ($q) {
                $query->where('username', 'like', "{$q}%")
                    ->orWhere('name', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'is_verified' => $u->is_verified,
                'avatar_url' => $u->profile?->avatar_url,
            ]);

        $cleanTag = ltrim(strtolower($q), '#');
        $hashtags = Hashtag::where('is_restricted', false)
            ->where('name', 'like', "{$cleanTag}%")
            ->orderByDesc('posts_count')
            ->limit(5)
            ->get(['id', 'name', 'posts_count']);

        return response()->json([
            'users' => $users,
            'hashtags' => $hashtags,
        ]);
    }

    public function clearRecentSearches(Request $request): JsonResponse
    {
        $request->user()->recentSearches()->delete();

        return response()->json(['cleared' => true]);
    }
}
