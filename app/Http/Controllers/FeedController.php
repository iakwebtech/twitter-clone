<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(Request $request): Response|JsonResponse
    {
        $tab = $request->query('tab', 'for_you');
        if (! in_array($tab, ['for_you', 'following', 'latest', 'trending'], true)) {
            $tab = 'for_you';
        }

        $perPage = (int) config('pulse.feed_per_page', 15);
        $paginator = $this->postService->getFeed($request->user(), $tab, $perPage);

        $posts = PostResource::collection($paginator->items())->resolve($request);
        $nextCursor = $paginator->nextCursor()?->encode();

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'posts' => $posts,
                'next_cursor' => $nextCursor,
            ]);
        }

        return Inertia::render('Home', [
            'tab' => $tab,
            'posts' => $posts,
            'nextCursor' => $nextCursor,
        ]);
    }
}
