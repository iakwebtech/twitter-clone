import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, CheckCheck, Heart, MessageCircle, Repeat2, UserPlus, AtSign, Mail, Trash2 } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Avatar from '../../Components/Avatar';
import { useToast } from '../../Components/ToastContext';

export default function Index({ notifications: initialNotifications = [], pendingRequests: initialRequests = [] }) {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [requests, setRequests] = useState(initialRequests);

    const iconForKind = (kind) => {
        switch (kind) {
            case 'like':
                return <Heart className="w-5 h-5 text-rose-500 fill-current" />;
            case 'repost':
            case 'quote':
                return <Repeat2 className="w-5 h-5 text-emerald-500" />;
            case 'reply':
                return <MessageCircle className="w-5 h-5 text-sky-500" />;
            case 'mention':
                return <AtSign className="w-5 h-5 text-indigo-500" />;
            case 'message':
                return <Mail className="w-5 h-5 text-sky-500" />;
            default:
                return <UserPlus className="w-5 h-5 text-sky-500" />;
        }
    };

    const markAllRead = async () => {
        await window.axios.post('/notifications/read-all');
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        toast('All notifications marked as read');
    };

    const markRead = async (id) => {
        await window.axios.post(`/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    };

    const deleteNotif = async (id) => {
        await window.axios.delete(`/notifications/${id}`);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const respondRequest = async (id, accept) => {
        await window.axios.post(`/follow-requests/${id}/respond`, { accept });
        setRequests((prev) => prev.filter((r) => r.id !== id));
        toast(accept ? 'Follow request accepted' : 'Follow request declined');
    };

    return (
        <AppLayout>
            <Head title="Notifications" />

            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-extrabold">Notifications</h1>
                <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:underline cursor-pointer"
                >
                    <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
            </header>

            {/* Pending Follow Requests */}
            {requests.length > 0 && (
                <div className="border-b border-zinc-200 dark:border-zinc-800 bg-sky-500/5 p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Follow Requests ({requests.length})
                    </div>
                    {requests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between gap-3">
                            <Link href={`/@${req.sender.username}`} className="flex items-center gap-2.5">
                                <Avatar src={req.sender.avatar_url} name={req.sender.name} size="sm" />
                                <div>
                                    <div className="text-sm font-bold">{req.sender.name}</div>
                                    <div className="text-xs text-zinc-500">@{req.sender.username}</div>
                                </div>
                            </Link>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => respondRequest(req.id, true)}
                                    className="px-3.5 py-1.5 rounded-full bg-sky-500 text-white text-xs font-bold"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => respondRequest(req.id, false)}
                                    className="px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                    <Bell className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                    <h3 className="font-bold">No notifications yet</h3>
                    <p className="text-sm text-zinc-500">Likes, replies, reposts, and new followers will appear here.</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {notifications.map((n) => {
                        const data = n.data || {};
                        const targetUrl = data.meta?.post_id
                            ? `/posts/${data.meta.post_id}`
                            : data.meta?.conversation_id
                            ? `/messages/${data.meta.conversation_id}`
                            : data.actor?.username
                            ? `/@${data.actor.username}`
                            : '/';

                        return (
                            <div
                                key={n.id}
                                onClick={() => {
                                    if (!n.read_at) markRead(n.id);
                                    router.visit(targetUrl);
                                }}
                                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition ${
                                    !n.read_at ? 'bg-sky-500/5' : ''
                                }`}
                            >
                                <div className="mt-1">{iconForKind(data.kind)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {data.actor && <Avatar src={data.actor.avatar_url} name={data.actor.name} size="xs" />}
                                        <span className="text-sm font-medium">{data.message}</span>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotif(n.id);
                                    }}
                                    className="p-1.5 rounded-full text-zinc-400 hover:text-red-500"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
