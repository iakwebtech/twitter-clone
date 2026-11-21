import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Avatar from '../../Components/Avatar';

export default function Connections({ profileUser, mode, users: initialUsers = [] }) {
    const { auth } = usePage().props;
    const [users, setUsers] = useState(initialUsers);

    const toggleFollow = async (userId) => {
        const res = await window.axios.post(`/users/${userId}/follow`);
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, is_following: res.data.following, has_pending_request: res.data.requested } : u))
        );
    };

    const removeFollower = async (userId) => {
        await window.axios.delete(`/followers/${userId}`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    return (
        <AppLayout>
            <Head title={`${profileUser.name} - ${mode}`} />
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-4">
                <Link href={`/@${profileUser.username}`} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="font-extrabold text-base">{profileUser.name}</h1>
                    <p className="text-xs text-zinc-500 capitalize">{mode}</p>
                </div>
            </header>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.length === 0 ? (
                    <div className="py-14 text-center text-sm text-zinc-500">No {mode} yet.</div>
                ) : (
                    users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <Link href={`/@${u.username}`} className="flex items-center gap-3 min-w-0">
                                <Avatar src={u.avatar_url} name={u.name} />
                                <div className="min-w-0">
                                    <div className="font-bold text-sm truncate flex items-center gap-1">
                                        {u.name}
                                        {u.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500" />}
                                    </div>
                                    <div className="text-xs text-zinc-500">@{u.username}</div>
                                    {u.bio && <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">{u.bio}</p>}
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                                {auth?.user?.id === profileUser.id && mode === 'followers' && (
                                    <button
                                        onClick={() => removeFollower(u.id)}
                                        className="px-3 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:text-red-500"
                                    >
                                        Remove
                                    </button>
                                )}
                                {auth?.user && auth.user.id !== u.id && (
                                    <button
                                        onClick={() => toggleFollow(u.id)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                                            u.is_following
                                                ? 'border border-zinc-300 dark:border-zinc-700'
                                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                        }`}
                                    >
                                        {u.is_following ? 'Following' : u.has_pending_request ? 'Requested' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
