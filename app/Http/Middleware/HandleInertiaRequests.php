<?php

namespace App\Http\Middleware;

use App\Models\Hashtag;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $unreadNotificationsCount = 0;
        $unreadMessagesCount = 0;
        $suggestedUsers = [];

        if ($user) {
            $user->loadMissing(['profile', 'settings']);
            $unreadNotificationsCount = $user->unreadNotifications()->count();
            $unreadMessagesCount = DB::table('conversation_participants as cp')
                ->join('messages as m', 'm.conversation_id', '=', 'cp.conversation_id')
                ->where('cp.user_id', $user->id)
                ->where('m.sender_id', '!=', $user->id)
                ->whereNull('m.deleted_at')
                ->where(function ($q) {
                    $q->whereNull('cp.last_read_at')
                        ->orWhereColumn('m.created_at', '>', 'cp.last_read_at');
                })
                ->count();

            $followingIds = $user->following()->pluck('users.id')->toArray();
            $blockedIds = $user->blockedUsers()->pluck('users.id')->toArray();
            $excludeIds = array_unique(array_merge([$user->id], $followingIds, $blockedIds));

            $suggestedUsers = User::query()
                ->with('profile')
                ->whereNotIn('id', $excludeIds)
                ->where('is_suspended', false)
                ->where('is_deactivated', false)
                ->orderByDesc('is_verified')
                ->limit(4)
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'is_verified' => $u->is_verified,
                    'is_private' => $u->is_private,
                    'avatar_url' => $u->profile?->avatar_url,
                    'bio' => $u->profile?->bio,
                ]);
        }

        $trendingHashtags = Cache::remember('sidebar_trending_hashtags', 60, function () {
            return Hashtag::query()
                ->where('is_restricted', false)
                ->orderByDesc('posts_count')
                ->limit(5)
                ->get(['id', 'name', 'slug', 'posts_count']);
        });

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'role' => $user->role,
                    'is_verified' => $user->is_verified,
                    'is_private' => $user->is_private,
                    'is_deactivated' => $user->is_deactivated,
                    'avatar_url' => $user->profile?->avatar_url,
                    'cover_url' => $user->profile?->cover_url,
                    'bio' => $user->profile?->bio,
                    'followers_count' => $user->profile?->followers_count ?? 0,
                    'following_count' => $user->profile?->following_count ?? 0,
                    'posts_count' => $user->profile?->posts_count ?? 0,
                    'settings' => $user->settings,
                ] : null,
            ],
            'counts' => [
                'notifications' => $unreadNotificationsCount,
                'messages' => $unreadMessagesCount,
            ],
            'sidebar' => [
                'trending' => $trendingHashtags,
                'suggestedUsers' => $suggestedUsers,
            ],
            'platform' => [
                'name' => PlatformSetting::getValue('site_name', config('pulse.name', 'Pulse')),
                'max_post_length' => (int) PlatformSetting::getValue('max_post_length', config('pulse.max_post_length', 280)),
                'max_media_per_post' => (int) config('pulse.max_media_per_post', 4),
                'registration_enabled' => (bool) PlatformSetting::getValue('registration_enabled', true),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
