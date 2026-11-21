import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { BadgeCheck, Ban, Trash2 } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import AdminNav from './AdminNav';
import Avatar from '../../Components/Avatar';

export default function Users({ users, filters }) {
    const [q, setQ] = useState(filters?.q || '');

    const search = (e) => {
        e.preventDefault();
        router.get('/admin/users', { q, status: filters?.status || 'all' });
    };

    return (
        <AppLayout>
            <Head title="Admin - Users" />
            <AdminNav />

            <div className="p-4 space-y-4">
                <form onSubmit={search} className="flex gap-2">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name, @username, email..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                    />
                    <button type="submit" className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold">
                        Search
                    </button>
                </form>

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {users.data.map((u) => (
                        <div key={u.id} className="p-3.5 flex items-center justify-between gap-3 text-sm">
                            <Link href={`/@${u.username}`} className="flex items-center gap-2.5 min-w-0">
                                <Avatar src={u.profile?.avatar_url} name={u.name} size="sm" />
                                <div className="min-w-0">
                                    <div className="font-bold truncate flex items-center gap-1">
                                        {u.name}
                                        {u.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500" />}
                                        {u.is_suspended && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">Suspended</span>}
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate">@{u.username} · {u.email}</div>
                                </div>
                            </Link>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={() => router.post(`/admin/users/${u.id}/verify`)}
                                    className="px-2.5 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:border-sky-500"
                                >
                                    {u.is_verified ? 'Unverify' : 'Verify'}
                                </button>
                                {u.role !== 'admin' && (
                                    <>
                                        <button
                                            onClick={() => router.post(`/admin/users/${u.id}/suspend`)}
                                            className="p-1.5 rounded-full text-amber-500 hover:bg-amber-500/10"
                                            title={u.is_suspended ? 'Activate' : 'Suspend'}
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete @${u.username}?`)) router.delete(`/admin/users/${u.id}`);
                                            }}
                                            className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10"
                                            title="Delete user"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
