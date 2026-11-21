import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trash2, UserPlus } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import PostCard from '../../Components/PostCard';
import Avatar from '../../Components/Avatar';
import { useToast } from '../../Components/ToastContext';

export default function Show({ list, members: initialMembers = [], posts = [], isOwner = false }) {
    const { toast } = useToast();
    const [members, setMembers] = useState(initialMembers);
    const [username, setUsername] = useState('');

    const addMember = async (e) => {
        e.preventDefault();
        try {
            await window.axios.post(`/lists/${list.id}/members`, { username });
            setUsername('');
            toast('List membership updated');
            router.reload();
        } catch {
            toast('User not found', 'error');
        }
    };

    return (
        <AppLayout>
            <Head title={list.name} />
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/lists" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-extrabold text-base">{list.name}</h1>
                        <p className="text-xs text-zinc-500">{members.length} members</p>
                    </div>
                </div>
                {isOwner && (
                    <button
                        onClick={() => router.delete(`/lists/${list.id}`)}
                        className="p-2 rounded-full text-red-500 hover:bg-red-500/10"
                        title="Delete list"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </header>

            {isOwner && (
                <form onSubmit={addMember} className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Add/remove @username..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        required
                    />
                    <button type="submit" className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold">
                        <UserPlus className="w-3.5 h-3.5" /> Toggle Member
                    </button>
                </form>
            )}

            {members.length > 0 && (
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
                    {members.map((m) => (
                        <Link key={m.id} href={`/@${m.username}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs font-medium shrink-0">
                            <Avatar src={m.avatar_url} name={m.name} size="xs" />
                            @{m.username}
                        </Link>
                    ))}
                </div>
            )}

            {posts.length === 0 ? (
                <div className="py-14 text-center text-sm text-zinc-500">No posts from list members yet.</div>
            ) : (
                posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
        </AppLayout>
    );
}
