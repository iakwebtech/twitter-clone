<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\Post;
use App\Models\User;
use App\Models\UserList;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ListController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(Request $request): Response
    {
        $lists = $request->user()->lists()->withCount('members')->latest()->get();

        return Inertia::render('Lists/Index', [
            'lists' => $lists,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:200'],
            'is_private' => ['boolean'],
        ]);

        $list = $request->user()->lists()->create($validated);

        return redirect()->route('lists.show', $list->id)->with('success', 'List created.');
    }

    public function show(Request $request, UserList $list): Response
    {
        $viewer = $request->user();
        if ($list->is_private && $list->user_id !== $viewer->id) {
            abort(403);
        }

        $memberIds = $list->members()->pluck('users.id');
        $posts = Post::with($this->postService->defaultRelations($viewer->id))
            ->whereIn('user_id', $memberIds)
            ->published()
            ->topLevel()
            ->where('visibility', 'public')
            ->latest()
            ->limit(30)
            ->get();

        return Inertia::render('Lists/Show', [
            'list' => $list->load('owner.profile'),
            'members' => UserResource::collection($list->members()->with('profile')->get())->resolve($request),
            'posts' => PostResource::collection($posts)->resolve($request),
            'isOwner' => $list->user_id === $viewer->id,
        ]);
    }

    public function destroy(Request $request, UserList $list): RedirectResponse
    {
        abort_unless($list->user_id === $request->user()->id, 403);
        $list->delete();

        return redirect()->route('lists.index')->with('success', 'List deleted.');
    }

    public function toggleMember(Request $request, UserList $list): JsonResponse
    {
        abort_unless($list->user_id === $request->user()->id, 403);
        $request->validate(['username' => ['required', 'string']]);

        $member = User::where('username', strtolower($request->username))->firstOrFail();

        if ($list->members()->where('member_id', $member->id)->exists()) {
            $list->members()->detach($member->id);
            $added = false;
        } else {
            $list->members()->attach($member->id);
            $added = true;
        }

        return response()->json(['added' => $added]);
    }
}
