import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import AdminNav from './AdminNav';

export default function Dashboard({
    stats,
    dailyRegistrations = [],
    dailyPosts = [],
    popularUsers = [],
    popularPosts = [],
    trendingHashtags = [],
}) {
    const cards = [
        { label: 'Total Users', value: stats.total_users },
        { label: 'Active (7d)', value: stats.active_users },
        { label: 'New Today', value: stats.new_registrations_today },
        { label: 'Total Posts', value: stats.total_posts },
        { label: 'Replies', value: stats.total_comments },
        { label: 'Likes', value: stats.total_likes },
        { label: 'Messages', value: stats.total_messages },
        { label: 'Pending Reports', value: stats.pending_reports, highlight: stats.pending_reports > 0 },
    ];

    return (
        <AppLayout>
            <Head title="Admin Dashboard" />
            <AdminNav />

            <div className="p-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {cards.map((c) => (
                        <div key={c.label} className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                            <div className="text-[11px] font-semibold text-zinc-500 uppercase">{c.label}</div>
                            <div className={`text-2xl font-extrabold mt-1 ${c.highlight ? 'text-red-500' : ''}`}>
                                {c.value?.toLocaleString() ?? 0}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Daily Activity Mini-Charts */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <h3 className="text-xs font-bold uppercase text-zinc-500">Daily Registrations (14d)</h3>
                        <div className="flex items-end gap-1.5 h-20">
                            {dailyRegistrations.map((d) => (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                                    <div className="w-full bg-sky-500 rounded-t" style={{ height: `${Math.min(100, d.count * 18)}%`, minHeight: '6px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <h3 className="text-xs font-bold uppercase text-zinc-500">Daily Posts (14d)</h3>
                        <div className="flex items-end gap-1.5 h-20">
                            {dailyPosts.map((d) => (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                                    <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${Math.min(100, d.count * 15)}%`, minHeight: '6px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Popular Users & Posts */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                        <h3 className="font-bold text-sm">Top Accounts</h3>
                        {popularUsers.map((u) => (
                            <Link key={u.id} href={`/@${u.username}`} className="flex items-center justify-between text-xs hover:text-sky-500">
                                <span className="font-semibold">@{u.username}</span>
                                <span className="text-zinc-500">{u.followers_count} followers</span>
                            </Link>
                        ))}
                    </div>

                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                        <h3 className="font-bold text-sm">Top Posts</h3>
                        {popularPosts.map((p) => (
                            <Link key={p.id} href={`/posts/${p.id}`} className="block text-xs hover:text-sky-500">
                                <div className="truncate font-medium">{p.content}</div>
                                <div className="text-zinc-500">@{p.username} · {p.likes_count} likes</div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Trending Hashtags */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h3 className="font-bold text-sm">Top Hashtags</h3>
                    <div className="flex flex-wrap gap-2">
                        {trendingHashtags.map((h) => (
                            <span key={h.id} className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold">
                                #{h.name} ({h.posts_count})
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
