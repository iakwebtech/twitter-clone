import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Flame, BadgeCheck, Trash2 } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import PostCard from '../../Components/PostCard';
import Avatar from '../../Components/Avatar';

export default function Explore({
    query = '',
    filter = 'popular',
    period = '24h',
    posts = [],
    users = [],
    trendingHashtags = [],
    trendingTopics = [],
    recentSearches = [],
}) {
    const [q, setQ] = useState(query);
    const [recent, setRecent] = useState(recentSearches);

    const submitSearch = (e) => {
        e.preventDefault();
        router.get('/explore', { q, filter, period });
    };

    const clearRecent = async () => {
        await window.axios.delete('/search/recent');
        setRecent([]);
    };

    const filters = [
        { key: 'popular', label: 'Popular' },
        { key: 'latest', label: 'Latest' },
        { key: 'users', label: 'People' },
        { key: 'media', label: 'Media' },
    ];

    return (
        <AppLayout>
            <Head title="Explore" />

            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                <form onSubmit={submitSearch} className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search posts, #hashtags, or @users..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </form>

                {q && (
                    <div className="flex items-center gap-2">
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => router.get('/explore', { q, filter: f.key, period })}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                                    filter === f.key
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* Recent Searches */}
            {!q && recent.length > 0 && (
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recent Searches</span>
                        <button onClick={clearRecent} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recent.map((r) => (
                            <Link
                                key={r.id}
                                href={`/explore?q=${encodeURIComponent(r.query)}`}
                                className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-medium hover:text-sky-500"
                            >
                                {r.query}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending Topics & Hashtags when no query */}
            {!q && (
                <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-extrabold text-base flex items-center gap-2">
                            <Flame className="w-5 h-5 text-sky-500" /> Trending Now
                        </h2>
                        <div className="flex gap-1 text-xs">
                            {['24h', '7d', 'all'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => router.get('/explore', { period: p })}
                                    className={`px-2.5 py-1 rounded-full font-semibold ${
                                        period === p ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                                    }`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        {trendingTopics.map((topic) => (
                            <Link
                                key={topic.id}
                                href={`/explore?q=${encodeURIComponent(topic.title.split(' ')[0])}`}
                                className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                            >
                                <div className="text-[11px] text-zinc-500 uppercase font-semibold">{topic.category}</div>
                                <div className="font-bold text-sm mt-0.5">{topic.title}</div>
                                <div className="text-xs text-zinc-500 mt-1">{topic.posts_count.toLocaleString()} posts</div>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        {trendingHashtags.map((tag) => (
                            <Link
                                key={tag.id}
                                href={`/explore?q=${encodeURIComponent('#' + tag.name)}`}
                                className="px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-500/20"
                            >
                                #{tag.name} <span className="opacity-70">({tag.posts_count})</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {filter === 'users' && q ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {users.length === 0 ? (
                        <div className="py-12 text-center text-sm text-zinc-500">No users found for &quot;{q}&quot;.</div>
                    ) : (
                        users.map((u) => (
                            <Link key={u.id} href={`/@${u.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                                <Avatar src={u.avatar_url} name={u.name} />
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-1">
                                        {u.name}
                                        {u.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500" />}
                                    </div>
                                    <div className="text-xs text-zinc-500">@{u.username}</div>
                                    {u.bio && <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{u.bio}</p>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            ) : posts.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">No posts found.</div>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </AppLayout>
    );
}
