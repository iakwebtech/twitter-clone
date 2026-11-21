<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\FollowRequest;
use App\Models\Post;
use App\Models\User;
use App\Services\FollowService;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private PostService $postService,
        private FollowService $followService,
    ) {}

    public function show(Request $request, string $username): Response
    {
        $user = User::with('profile')->where('username', strtolower($username))->firstOrFail();
        Gate::authorize('viewProfile', $user);

        $viewer = $request->user();
        $tab = $request->query('tab', 'posts');
        $canViewPosts = Gate::allows('viewPosts', $user);

        $posts = [];
        if ($canViewPosts) {
            $viewerId = $viewer?->id;
            $relations = $this->postService->defaultRelations($viewerId);

            $query = match ($tab) {
                'replies' => Post::with($relations)->where('user_id', $user->id)->whereNotNull('parent_id')->latest(),
                'media' => Post::with($relations)->where('user_id', $user->id)->whereHas('media')->latest(),
                'likes' => $user->likes()->with($relations)->latest('post_likes.created_at'),
                default => Post::with($relations)->where('user_id', $user->id)->whereNull('parent_id')->orderByDesc('is_pinned')->latest(),
            };

            $posts = PostResource::collection($query->limit(25)->get())->resolve($request);
        }

        $mutualFollowers = [];
        if ($viewer && $viewer->id !== $user->id) {
            $viewerFollowingIds = $viewer->following()->pluck('users.id');
            $mutualFollowers = $user->followers()
                ->with('profile')
                ->whereIn('users.id', $viewerFollowingIds)
                ->limit(3)
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'avatar_url' => $u->profile?->avatar_url,
                ]);
        }

        return Inertia::render('Profile/Show', [
            'profileUser' => (new UserResource($user))->resolve($request),
            'tab' => $tab,
            'posts' => $posts,
            'canViewPosts' => $canViewPosts,
            'mutualFollowers' => $mutualFollowers,
            'isOwnProfile' => $viewer?->id === $user->id,
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->profile()->firstOrCreate([]);

        $user->update([
            'name' => $request->name,
            'username' => strtolower($request->username),
        ]);

        $profileData = $request->only(['bio', 'location', 'website', 'birth_date']);

        if ($request->hasFile('avatar')) {
            if ($profile->avatar && ! str_starts_with($profile->avatar, 'http')) {
                Storage::disk('public')->delete($profile->avatar);
            }
            $profileData['avatar'] = $request->file('avatar')->store('avatars/'.$user->id, 'public');
        }

        if ($request->hasFile('cover_image')) {
            if ($profile->cover_image && ! str_starts_with($profile->cover_image, 'http')) {
                Storage::disk('public')->delete($profile->cover_image);
            }
            $profileData['cover_image'] = $request->file('cover_image')->store('covers/'.$user->id, 'public');
        }

        $profile->update($profileData);

        return redirect()->route('profile.show', $user->username)->with('success', 'Profile updated.');
    }

    public function followers(Request $request, string $username): Response
    {
        $user = User::with('profile')->where('username', strtolower($username))->firstOrFail();
        Gate::authorize('viewProfile', $user);

        $followers = $user->followers()->with('profile')->paginate(25);

        return Inertia::render('Profile/Connections', [
            'profileUser' => (new UserResource($user))->resolve($request),
            'mode' => 'followers',
            'users' => UserResource::collection($followers->items())->resolve($request),
        ]);
    }

    public function following(Request $request, string $username): Response
    {
        $user = User::with('profile')->where('username', strtolower($username))->firstOrFail();
        Gate::authorize('viewProfile', $user);

        $following = $user->following()->with('profile')->paginate(25);

        return Inertia::render('Profile/Connections', [
            'profileUser' => (new UserResource($user))->resolve($request),
            'mode' => 'following',
            'users' => UserResource::collection($following->items())->resolve($request),
        ]);
    }

    public function toggleFollow(Request $request, User $user): JsonResponse
    {
        return response()->json($this->followService->toggleFollow($request->user(), $user));
    }

    public function respondFollowRequest(Request $request, FollowRequest $followRequest): JsonResponse
    {
        abort_unless($followRequest->receiver_id === $request->user()->id, 403);
        $request->validate(['accept' => ['required', 'boolean']]);

        $this->followService->respondToFollowRequest($request->user(), $followRequest, $request->boolean('accept'));

        return response()->json(['status' => $request->boolean('accept') ? 'accepted' : 'rejected']);
    }

    public function removeFollower(Request $request, User $user): JsonResponse
    {
        $this->followService->removeFollower($request->user(), $user);

        return response()->json(['removed' => true]);
    }

    public function toggleBlock(Request $request, User $user): JsonResponse
    {
        $blocked = $this->followService->toggleBlock($request->user(), $user);

        return response()->json(['blocked' => $blocked]);
    }

    public function toggleMute(Request $request, User $user): JsonResponse
    {
        $muted = $this->followService->toggleMute($request->user(), $user);

        return response()->json(['muted' => $muted]);
    }
}
