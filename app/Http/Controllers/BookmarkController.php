<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Models\BookmarksCollection;
use App\Models\Post;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookmarkController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $collectionId = $request->query('collection');
        $relations = $this->postService->defaultRelations($user->id);

        $collections = $user->bookmarkCollections()->withCount('posts')->get();

        if ($collectionId) {
            $collection = $user->bookmarkCollections()->findOrFail($collectionId);
            $posts = $collection->posts()->with($relations)->latest('bookmarks_collection_posts.created_at')->get();
        } else {
            $posts = $user->bookmarks()->with($relations)->latest('post_bookmarks.created_at')->get();
        }

        return Inertia::render('Bookmarks/Index', [
            'posts' => PostResource::collection($posts)->resolve($request),
            'collections' => $collections,
            'activeCollectionId' => $collectionId ? (int) $collectionId : null,
        ]);
    }

    public function storeCollection(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        $collection = $request->user()->bookmarkCollections()->create($validated);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['collection' => $collection], 201);
        }

        return back()->with('success', 'Bookmark collection created.');
    }

    public function destroyCollection(Request $request, BookmarksCollection $collection): RedirectResponse
    {
        abort_unless($collection->user_id === $request->user()->id, 403);
        $collection->delete();

        return redirect()->route('bookmarks.index')->with('success', 'Collection deleted.');
    }

    public function toggleCollectionPost(Request $request, BookmarksCollection $collection, Post $post): JsonResponse
    {
        abort_unless($collection->user_id === $request->user()->id, 403);

        if (! $request->user()->bookmarks()->where('post_id', $post->id)->exists()) {
            $request->user()->bookmarks()->attach($post->id);
            $post->increment('bookmarks_count');
        }

        if ($collection->posts()->where('post_id', $post->id)->exists()) {
            $collection->posts()->detach($post->id);
            $added = false;
        } else {
            $collection->posts()->attach($post->id);
            $added = true;
        }

        return response()->json(['added' => $added]);
    }
}
