import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import AppLayout from '../Layouts/AppLayout';
import PostComposer from '../Components/PostComposer';
import PostCard from '../Components/PostCard';

const TABS = [
    { key: 'for_you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'latest', label: 'Latest' },
    { key: 'trending', label: 'Trending' },
];

export default function Home({ tab = 'for_you', posts: initialPosts = [], nextCursor: initialCursor = null }) {
    const { auth } = usePage().props;
    const [posts, setPosts] = useState(initialPosts);
    const [nextCursor, setNextCursor] = useState(initialCursor);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setPosts(initialPosts);
        setNextCursor(initialCursor);
    }, [initialPosts, initialCursor, tab]);

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await window.axios.get('/', { params: { tab, cursor: nextCursor } });
            setPosts((prev) => [...prev, ...(res.data.posts || [])]);
            setNextCursor(res.data.next_cursor || null);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleTabChange = (nextTab) => {
        router.get('/', { tab: nextTab }, { preserveState: false });
    };

    return (
        <AppLayout>
            <Head title="Home" />

            {/* Sticky Header & Tabs */}
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-lg font-extrabold tracking-tight">Home</h1>
                    <button
                        onClick={() => router.reload({ only: ['posts', 'nextCursor'] })}
                        title="Refresh feed"
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-4">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
                            className={`relative py-3 text-sm font-semibold transition hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 cursor-pointer ${
                                tab === t.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                            }`}
                        >
                            {t.label}
                            {tab === t.key && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-sky-500" />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {auth?.user && <PostComposer />}

            {posts.length === 0 ? (
                <div className="py-16 px-6 text-center space-y-2">
                    <h3 className="text-lg font-bold">Your timeline is quiet</h3>
                    <p className="text-sm text-zinc-500">
                        {tab === 'following'
                            ? 'Follow people in Explore to see their posts here.'
                            : 'Be the first to share what is happening right now.'}
                    </p>
                </div>
            ) : (
                <div>
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                        />
                    ))}
                </div>
            )}

            {nextCursor && (
                <div className="p-4 text-center">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                    >
                        {loadingMore ? 'Loading more posts...' : 'Load more posts'}
                    </button>
                </div>
            )}
        </AppLayout>
    );
}
