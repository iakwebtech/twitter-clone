import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Trash2, ShieldOff } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import AdminNav from './AdminNav';

export default function Content({ posts, hashtags = [], query = '' }) {
    const [q, setQ] = useState(query);
    const topicForm = useForm({ title: '', category: 'Technology', score: 90, period: '24h' });

    const search = (e) => {
        e.preventDefault();
        router.get('/admin/content', { q });
    };

    const addTopic = (e) => {
        e.preventDefault();
        topicForm.post('/admin/topics', { onSuccess: () => topicForm.reset('title') });
    };

    return (
        <AppLayout>
            <Head title="Admin - Content" />
            <AdminNav />

            <div className="p-4 space-y-6">
                {/* Hashtag Restriction */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <h3 className="font-bold text-sm">Manage Hashtags (Click to Restrict/Allow)</h3>
                    <div className="flex flex-wrap gap-2">
                        {hashtags.map((h) => (
                            <button
                                key={h.id}
                                onClick={() => router.post(`/admin/hashtags/${h.id}/restrict`)}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                                    h.is_restricted
                                        ? 'bg-red-500/15 text-red-500 line-through'
                                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                                }`}
                            >
                                <ShieldOff className="w-3 h-3" /> #{h.name} ({h.posts_count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Trending Topic */}
                <form onSubmit={addTopic} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <h3 className="font-bold text-sm">Add Trending Topic</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={topicForm.data.title}
                            onChange={(e) => topicForm.setData('title', e.target.value)}
                            placeholder="Topic title..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                            required
                        />
                        <input
                            type="text"
                            value={topicForm.data.category}
                            onChange={(e) => topicForm.setData('category', e.target.value)}
                            placeholder="Category"
                            className="w-32 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                            required
                        />
                        <button type="submit" className="px-4 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold">
                            Add
                        </button>
                    </div>
                </form>

                {/* Posts Moderation */}
                <form onSubmit={search} className="flex gap-2">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search posts..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold">
                        Filter
                    </button>
                </form>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    {posts.data.map((p) => (
                        <div key={p.id} className="p-3.5 flex items-start justify-between gap-3 text-sm">
                            <div className="min-w-0">
                                <div className="font-bold text-xs text-zinc-500">@{p.user?.username}</div>
                                <p className="mt-0.5 break-words">{p.content || '[Media/Poll Post]'}</p>
                            </div>
                            <button
                                onClick={() => router.delete(`/admin/posts/${p.id}`)}
                                className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 shrink-0"
                                title="Remove post"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
