import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Bookmark, FolderPlus, Trash2 } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import PostCard from '../../Components/PostCard';

export default function Index({ posts = [], collections = [], activeCollectionId = null }) {
    const [showNew, setShowNew] = useState(false);
    const form = useForm({ name: '', description: '' });

    const createCollection = (e) => {
        e.preventDefault();
        form.post('/bookmarks/collections', {
            onSuccess: () => {
                form.reset();
                setShowNew(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Bookmarks" />
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-extrabold">Bookmarks</h1>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold"
                >
                    <FolderPlus className="w-4 h-4" /> New Collection
                </button>
            </header>

            {showNew && (
                <form onSubmit={createCollection} className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Collection name..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        required
                    />
                    <button type="submit" className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold">
                        Create
                    </button>
                </form>
            )}

            {/* Collections Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
                <Link
                    href="/bookmarks"
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        !activeCollectionId ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600'
                    }`}
                >
                    All Bookmarks
                </Link>
                {collections.map((c) => (
                    <div key={c.id} className="flex items-center gap-1 shrink-0">
                        <Link
                            href={`/bookmarks?collection=${c.id}`}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                activeCollectionId === c.id ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600'
                            }`}
                        >
                            {c.name} ({c.posts_count})
                        </Link>
                        {activeCollectionId === c.id && (
                            <button
                                onClick={() => router.delete(`/bookmarks/collections/${c.id}`)}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"
                                title="Delete collection"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {posts.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                    <Bookmark className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                    <h3 className="font-bold">Save posts for later</h3>
                    <p className="text-sm text-zinc-500">Bookmark posts to easily find them again anytime.</p>
                </div>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </AppLayout>
    );
}
