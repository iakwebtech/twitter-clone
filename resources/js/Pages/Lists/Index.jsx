import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { List, Lock, Plus } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';

export default function Index({ lists = [] }) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({ name: '', description: '', is_private: false });

    const submit = (e) => {
        e.preventDefault();
        form.post('/lists', {
            onSuccess: () => {
                form.reset();
                setShowCreate(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Lists" />
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-extrabold">Lists</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold"
                >
                    <Plus className="w-4 h-4" /> Create List
                </button>
            </header>

            {showCreate && (
                <form onSubmit={submit} className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="List name"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        required
                    />
                    <input
                        type="text"
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                    />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={form.data.is_private}
                                onChange={(e) => form.setData('is_private', e.target.checked)}
                            />
                            Private list
                        </label>
                        <button type="submit" className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold">
                            Save List
                        </button>
                    </div>
                </form>
            )}

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {lists.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                        <List className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                        <h3 className="font-bold">No lists yet</h3>
                        <p className="text-sm text-zinc-500">Create curated lists to follow specific topics or groups of people.</p>
                    </div>
                ) : (
                    lists.map((l) => (
                        <Link key={l.id} href={`/lists/${l.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                            <div>
                                <div className="font-bold text-sm flex items-center gap-1.5">
                                    {l.name}
                                    {l.is_private && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                                </div>
                                {l.description && <p className="text-xs text-zinc-500">{l.description}</p>}
                            </div>
                            <span className="text-xs text-zinc-500">{l.members_count} members</span>
                        </Link>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
