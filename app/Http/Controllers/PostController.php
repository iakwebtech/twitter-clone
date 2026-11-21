<?php

namespace App\Http\Controllers;

use App\Http\Requests\Post\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\PollOption;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\PostDraft;
use App\Models\ScheduledPost;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function store(StorePostRequest $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();

        if ($request->filled('parent_id')) {
            $parent = Post::with('user')->findOrFail($request->integer('parent_id'));
            Gate::authorize('reply', $parent);
        }

        $files = $request->file('media', []);
        $post = $this->postService->createPost($user, $request->validated(), is_array($files) ? $files : []);

        if ($request->filled('draft_id')) {
            PostDraft::where('id', $request->integer('draft_id'))->where('user_id', $user->id)->delete();
        }

        $resource = (new PostResource($post))->resolve($request);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['post' => $resource], 201);
        }

        return back()->with('success', $request->filled('scheduled_for') ? 'Post scheduled!' : 'Post published!');
    }

    public function show(Request $request, Post $post): Response
    {
        Gate::authorize('view', $post);

        $post->increment('views_count');
        $viewerId = $request->user()?->id;

        $post->load($this->postService->defaultRelations($viewerId));

        // Ancestor thread chain
        $ancestors = collect();
        $current = $post->parent_id ? Post::with($this->postService->defaultRelations($viewerId))->find($post->parent_id) : null;
        while ($current && $ancestors->count() < 10) {
            $ancestors->prepend($current);
            $current = $current->parent_id ? Post::with($this->postService->defaultRelations($viewerId))->find($current->parent_id) : null;
        }

        $replies = Post::query()
            ->with(array_merge($this->postService->defaultRelations($viewerId), [
                'replies' => fn ($q) => $q->with($this->postService->defaultRelations($viewerId))->limit(3),
            ]))
            ->where('parent_id', $post->id)
            ->orderByDesc('likes_count')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Post/Show', [
            'post' => (new PostResource($post))->resolve($request),
            'ancestors' => PostResource::collection($ancestors)->resolve($request),
            'replies' => PostResource::collection($replies->items())->resolve($request),
            'hasMoreReplies' => $replies->hasMorePages(),
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse|JsonResponse
    {
        Gate::authorize('update', $post);

        $maxLen = (int) config('pulse.max_post_length', 280);
        $validated = $request->validate([
            'content' => ['required', 'string', "max:{$maxLen}"],
            'visibility' => ['sometimes', 'in:public,followers,private'],
        ]);

        $post->update($validated);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['post' => (new PostResource($post->fresh($this->postService->defaultRelations($request->user()->id))))->resolve($request)]);
        }

        return back()->with('success', 'Post updated.');
    }

    public function destroy(Request $request, Post $post): RedirectResponse|JsonResponse
    {
        Gate::authorize('delete', $post);

        $this->postService->deletePost($post);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['deleted' => true]);
        }

        return back()->with('success', 'Post deleted.');
    }

    public function togglePin(Request $request, Post $post): RedirectResponse|JsonResponse
    {
        Gate::authorize('update', $post);
        $user = $request->user();

        DB::transaction(function () use ($user, $post) {
            if ($post->is_pinned) {
                $post->update(['is_pinned' => false]);
                $user->profile()->update(['pinned_post_id' => null]);
            } else {
                Post::where('user_id', $user->id)->where('is_pinned', true)->update(['is_pinned' => false]);
                $post->update(['is_pinned' => true]);
                $user->profile()->update(['pinned_post_id' => $post->id]);
            }
        });

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['is_pinned' => $post->fresh()->is_pinned]);
        }

        return back()->with('success', $post->fresh()->is_pinned ? 'Post pinned to profile.' : 'Post unpinned.');
    }

    public function like(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('view', $post);

        return response()->json($this->postService->toggleLike($request->user(), $post));
    }

    public function repost(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('view', $post);

        return response()->json($this->postService->toggleRepost($request->user(), $post));
    }

    public function bookmark(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('view', $post);

        return response()->json($this->postService->toggleBookmark($request->user(), $post));
    }

    public function votePoll(Request $request, Post $post): JsonResponse
    {
        Gate::authorize('view', $post);

        $request->validate([
            'option_id' => ['required', 'integer', 'exists:poll_options,id'],
        ]);

        $poll = $post->poll;
        if (! $poll) {
            return response()->json(['message' => 'Poll not found.'], 404);
        }

        if ($poll->isExpired()) {
            return response()->json(['message' => 'This poll has ended.'], 422);
        }

        $user = $request->user();
        $alreadyVoted = PollVote::where('poll_id', $poll->id)->where('user_id', $user->id)->exists();
        if ($alreadyVoted) {
            return response()->json(['message' => 'You have already voted in this poll.'], 422);
        }

        $option = PollOption::where('id', $request->integer('option_id'))
            ->where('poll_id', $poll->id)
            ->firstOrFail();

        DB::transaction(function () use ($poll, $option, $user) {
            PollVote::create([
                'poll_id' => $poll->id,
                'poll_option_id' => $option->id,
                'user_id' => $user->id,
            ]);

            $option->increment('votes_count');
            $poll->increment('total_votes');
        });

        $poll->refresh()->load('options');

        return response()->json([
            'poll' => [
                'id' => $poll->id,
                'total_votes' => $poll->total_votes,
                'user_voted_option_id' => $option->id,
                'options' => $poll->options->map(fn ($opt) => [
                    'id' => $opt->id,
                    'option_text' => $opt->option_text,
                    'votes_count' => $opt->votes_count,
                    'percentage' => $poll->total_votes > 0 ? round(($opt->votes_count / $poll->total_votes) * 100) : 0,
                ]),
            ],
        ]);
    }

    public function drafts(Request $request): JsonResponse
    {
        $drafts = $request->user()->drafts()->latest('updated_at')->get();

        return response()->json(['drafts' => $drafts]);
    }

    public function saveDraft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:500'],
            'visibility' => ['nullable', 'in:public,followers,private'],
            'location' => ['nullable', 'string', 'max:120'],
        ]);

        $draft = $request->user()->drafts()->create($validated);

        return response()->json(['draft' => $draft], 201);
    }

    public function deleteDraft(Request $request, PostDraft $draft): JsonResponse
    {
        abort_unless($draft->user_id === $request->user()->id, 403);
        $draft->delete();

        return response()->json(['deleted' => true]);
    }

    public function cancelScheduled(Request $request, ScheduledPost $scheduledPost): JsonResponse
    {
        abort_unless($scheduledPost->user_id === $request->user()->id, 403);
        $scheduledPost->update(['status' => 'cancelled']);

        return response()->json(['cancelled' => true]);
    }
}
