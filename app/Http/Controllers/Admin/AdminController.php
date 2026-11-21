<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hashtag;
use App\Models\Message;
use App\Models\PlatformSetting;
use App\Models\Post;
use App\Models\Report;
use App\Models\TrendingTopic;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('last_seen_at', '>=', now()->subDays(7))->count(),
            'new_registrations_today' => User::whereDate('created_at', today())->count(),
            'total_posts' => Post::whereNull('parent_id')->count(),
            'total_comments' => Post::whereNotNull('parent_id')->count(),
            'total_likes' => DB::table('post_likes')->count(),
            'total_messages' => Message::count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
        ];

        $dailyRegistrations = User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $dailyPosts = Post::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $popularUsers = User::with('profile')
            ->orderByDesc(DB::raw('(SELECT followers_count FROM user_profiles WHERE user_profiles.user_id = users.id)'))
            ->limit(5)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'is_verified' => $u->is_verified,
                'followers_count' => $u->profile?->followers_count ?? 0,
                'avatar_url' => $u->profile?->avatar_url,
            ]);

        $popularPosts = Post::with('user.profile')
            ->orderByDesc('likes_count')
            ->limit(5)
            ->get()
            ->map(fn (Post $p) => [
                'id' => $p->id,
                'content' => $p->content,
                'likes_count' => $p->likes_count,
                'reposts_count' => $p->reposts_count,
                'replies_count' => $p->replies_count,
                'username' => $p->user->username,
            ]);

        $trendingHashtags = Hashtag::orderByDesc('posts_count')->limit(10)->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'dailyRegistrations' => $dailyRegistrations,
            'dailyPosts' => $dailyPosts,
            'popularUsers' => $popularUsers,
            'popularPosts' => $popularPosts,
            'trendingHashtags' => $trendingHashtags,
        ]);
    }

    public function users(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = $request->query('status', 'all');

        $users = User::with('profile')
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('username', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            }))
            ->when($status === 'suspended', fn ($query) => $query->where('is_suspended', true))
            ->when($status === 'verified', fn ($query) => $query->where('is_verified', true))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => ['q' => $q, 'status' => $status],
        ]);
    }

    public function toggleVerify(User $user): RedirectResponse
    {
        $user->update(['is_verified' => ! $user->is_verified]);

        return back()->with('success', $user->is_verified ? "@{$user->username} verified." : "@{$user->username} unverified.");
    }

    public function toggleSuspend(User $user): RedirectResponse
    {
        if ($user->isAdmin()) {
            return back()->with('error', 'Cannot suspend an administrator.');
        }

        $user->update(['is_suspended' => ! $user->is_suspended]);

        return back()->with('success', $user->is_suspended ? "@{$user->username} suspended." : "@{$user->username} activated.");
    }

    public function destroyUser(User $user): RedirectResponse
    {
        if ($user->isAdmin()) {
            return back()->with('error', 'Cannot delete an administrator.');
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function content(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $posts = Post::with('user.profile')
            ->when($q !== '', fn ($query) => $query->where('content', 'like', "%{$q}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $hashtags = Hashtag::orderByDesc('posts_count')->limit(30)->get();
        $topics = TrendingTopic::orderByDesc('score')->get();

        return Inertia::render('Admin/Content', [
            'posts' => $posts,
            'hashtags' => $hashtags,
            'topics' => $topics,
            'query' => $q,
        ]);
    }

    public function destroyPost(Post $post): RedirectResponse
    {
        $post->delete();

        return back()->with('success', 'Post removed by moderator.');
    }

    public function toggleRestrictHashtag(Hashtag $hashtag): RedirectResponse
    {
        $hashtag->update(['is_restricted' => ! $hashtag->is_restricted]);
        Cache::forget('sidebar_trending_hashtags');

        return back()->with('success', "#{$hashtag->name} restriction updated.");
    }

    public function storeTopic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', 'max:60'],
            'score' => ['nullable', 'numeric'],
            'period' => ['required', 'in:24h,7d,all'],
        ]);

        TrendingTopic::create($validated);

        return back()->with('success', 'Trending topic added.');
    }

    public function reports(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        $reports = Report::with(['reporter', 'reportable'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Reports', [
            'reports' => $reports,
            'status' => $status,
        ]);
    }

    public function updateReport(Request $request, Report $report): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,reviewed,resolved,dismissed'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $report->update([
            'status' => $validated['status'],
            'admin_notes' => $validated['admin_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Report updated.');
    }

    public function settings(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => [
                'site_name' => PlatformSetting::getValue('site_name', 'Pulse'),
                'site_description' => PlatformSetting::getValue('site_description', 'A modern real-time social conversation platform.'),
                'max_post_length' => PlatformSetting::getValue('max_post_length', 280),
                'registration_enabled' => PlatformSetting::getValue('registration_enabled', true),
                'maintenance_mode' => PlatformSetting::getValue('maintenance_mode', false),
            ],
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_name' => ['required', 'string', 'max:60'],
            'site_description' => ['nullable', 'string', 'max:255'],
            'max_post_length' => ['required', 'integer', 'min:100', 'max:2000'],
            'registration_enabled' => ['required', 'boolean'],
            'maintenance_mode' => ['required', 'boolean'],
        ]);

        PlatformSetting::setValue('site_name', $validated['site_name'], 'string', 'general');
        PlatformSetting::setValue('site_description', $validated['site_description'] ?? '', 'string', 'general');
        PlatformSetting::setValue('max_post_length', $validated['max_post_length'], 'integer', 'content');
        PlatformSetting::setValue('registration_enabled', $validated['registration_enabled'], 'boolean', 'security');
        PlatformSetting::setValue('maintenance_mode', $validated['maintenance_mode'], 'boolean', 'general');

        return back()->with('success', 'Platform settings updated.');
    }
}
