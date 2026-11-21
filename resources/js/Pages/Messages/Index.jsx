import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Send, Paperclip, Reply, Trash2, Search, Users, X, Smile, CheckCheck } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Avatar from '../../Components/Avatar';
import { useToast } from '../../Components/ToastContext';

export default function Index({ conversations = [], activeConversation = null, messages: initialMessages = [] }) {
    const { auth } = usePage().props;
    const { toast } = useToast();
    const [messages, setMessages] = useState(initialMessages);
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [typingUser, setTypingUser] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupMemberQuery, setGroupMemberQuery] = useState('');
    const [groupResults, setGroupResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const bottomRef = useRef(null);
    const fileRef = useRef(null);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages, activeConversation?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Real-time Echo listener for active conversation
    useEffect(() => {
        if (!activeConversation?.id || !window.Echo) return;
        const channel = window.Echo.private(`conversation.${activeConversation.id}`);

        channel.listen('MessageSent', (e) => {
            setMessages((prev) => (prev.some((m) => m.id === e.id) ? prev : [...prev, e]));
        });

        channel.listen('UserTyping', (e) => {
            if (e.user_id !== auth.user.id) {
                setTypingUser(e.is_typing ? e.username : null);
                setTimeout(() => setTypingUser(null), 2500);
            }
        });

        return () => {
            window.Echo.leave(`conversation.${activeConversation.id}`);
        };
    }, [activeConversation?.id]);

    const sendTyping = () => {
        if (!activeConversation?.id) return;
        window.axios.post(`/messages/${activeConversation.id}/typing`, { is_typing: true }).catch(() => {});
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!activeConversation || (!body.trim() && files.length === 0)) return;

        const formData = new FormData();
        if (body.trim()) formData.append('body', body.trim());
        if (replyTo) formData.append('reply_to_id', replyTo.id);
        files.forEach((f) => formData.append('attachments[]', f));

        try {
            const res = await window.axios.post(`/messages/${activeConversation.id}/send`, formData);
            setMessages((prev) => [...prev, res.data.message]);
            setBody('');
            setFiles([]);
            setReplyTo(null);
        } catch {
            toast('Failed to send message', 'error');
        }
    };

    const handleDeleteMessage = async (id) => {
        await window.axios.delete(`/messages/item/${id}`);
        setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    const handleSearchMessages = async (e) => {
        e.preventDefault();
        if (!activeConversation) return;
        const res = await window.axios.get(`/messages/${activeConversation.id}/search`, { params: { q: searchQ } });
        setMessages(res.data.messages || []);
    };

    const searchUsersForGroup = async (q) => {
        setGroupMemberQuery(q);
        if (!q.trim()) return setGroupResults([]);
        const res = await window.axios.get('/search/suggestions', { params: { q } });
        setGroupResults(res.data.users || []);
    };

    const createGroup = (e) => {
        e.preventDefault();
        router.post('/messages/group', {
            name: groupName,
            member_ids: selectedMembers.map((m) => m.id),
        });
        setShowGroupModal(false);
    };

    return (
        <AppLayout>
            <Head title="Messages" />

            <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
                <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <h1 className="text-lg font-extrabold">Messages</h1>
                    <button
                        onClick={() => setShowGroupModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-500/20"
                    >
                        <Users className="w-4 h-4" /> New Group
                    </button>
                </header>

                <div className="flex flex-1 min-h-0">
                    {/* Conversations List */}
                    <div className={`w-full sm:w-64 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto ${activeConversation ? 'hidden sm:block' : 'block'}`}>
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center text-xs text-zinc-500">
                                No conversations yet. Visit a user&apos;s profile to message them!
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className={`flex items-center gap-2.5 px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition ${
                                        activeConversation?.id === conv.id ? 'bg-sky-500/10' : ''
                                    }`}
                                >
                                    <Avatar src={conv.avatar_url} name={conv.name} size="sm" isOnline={conv.is_online} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm truncate">{conv.name}</span>
                                            {conv.unread_count > 0 && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">{conv.latest_message || 'No messages'}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Active Chat Area */}
                    <div className={`flex-1 flex flex-col min-w-0 ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                        {!activeConversation ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                                <h3 className="font-extrabold text-lg">Select a conversation</h3>
                                <p className="text-sm text-zinc-500">Choose an existing chat or start a new group conversation.</p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Link href="/messages" className="sm:hidden text-xs text-sky-500 font-semibold">
                                            ← Back
                                        </Link>
                                        <Avatar src={activeConversation.avatar_url} name={activeConversation.name} size="sm" isOnline={activeConversation.is_online} />
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate">{activeConversation.name}</div>
                                            <div className="text-[11px] text-zinc-500">
                                                {typingUser ? (
                                                    <span className="text-sky-500 font-medium">@{typingUser} is typing...</span>
                                                ) : activeConversation.is_online ? (
                                                    'Online'
                                                ) : activeConversation.type === 'group' ? (
                                                    `${activeConversation.participants?.length || 0} members`
                                                ) : (
                                                    'Offline'
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSearchMessages} className="relative hidden md:block">
                                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                                        <input
                                            type="text"
                                            value={searchQ}
                                            onChange={(e) => setSearchQ(e.target.value)}
                                            placeholder="Search chat..."
                                            className="pl-8 pr-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-xs focus:outline-none"
                                        />
                                    </form>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.map((m) => {
                                        const isMe = m.sender_id === auth.user.id;
                                        return (
                                            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {m.reply_to && (
                                                    <div className="text-[11px] text-zinc-500 mb-0.5 px-2 border-l-2 border-sky-500">
                                                        Replying to {m.reply_to.sender_name}: {m.reply_to.body}
                                                    </div>
                                                )}
                                                <div className={`group flex items-end gap-1.5 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    <div
                                                        className={`px-3.5 py-2 rounded-2xl text-sm space-y-1.5 ${
                                                            isMe
                                                                ? 'bg-sky-500 text-white rounded-br-sm'
                                                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'
                                                        }`}
                                                    >
                                                        {!isMe && activeConversation.type === 'group' && (
                                                            <div className="text-[10px] font-bold opacity-75">{m.sender?.name}</div>
                                                        )}
                                                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                                                        {m.attachments?.map((a) =>
                                                            a.type === 'image' ? (
                                                                <img key={a.id} src={a.url} alt="" className="rounded-xl max-h-56 object-cover" />
                                                            ) : (
                                                                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block underline text-xs">
                                                                    📎 {a.file_name}
                                                                </a>
                                                            )
                                                        )}
                                                    </div>

                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                                                        <button onClick={() => setReplyTo(m)} className="p-1 text-zinc-400 hover:text-sky-500" title="Reply">
                                                            <Reply className="w-3.5 h-3.5" />
                                                        </button>
                                                        {isMe && (
                                                            <button onClick={() => handleDeleteMessage(m.id)} className="p-1 text-zinc-400 hover:text-red-500" title="Delete">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5 px-1">
                                                    <span>{m.created_human}</span>
                                                    {isMe && <CheckCheck className="w-3 h-3 text-sky-500" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Reply Banner */}
                                {replyTo && (
                                    <div className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                                        <span className="truncate">Replying to {replyTo.sender?.name}: {replyTo.body}</span>
                                        <button onClick={() => setReplyTo(null)}><X className="w-4 h-4" /></button>
                                    </div>
                                )}

                                {/* Input */}
                                <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        multiple
                                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                        className="hidden"
                                    />
                                    <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <button type="button" onClick={() => setBody((b) => b + '😊')} className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={body}
                                        onChange={(e) => {
                                            setBody(e.target.value);
                                            sendTyping();
                                        }}
                                        placeholder={files.length > 0 ? `${files.length} file(s) attached...` : 'Start a new message'}
                                        className="flex-1 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-sm focus:outline-none"
                                    />
                                    <button type="submit" className="p-2.5 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* New Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowGroupModal(false)}>
                    <form onSubmit={createGroup} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
                        <h3 className="font-extrabold text-lg">Create Group Chat</h3>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group name"
                            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                            required
                        />
                        <input
                            type="text"
                            value={groupMemberQuery}
                            onChange={(e) => searchUsersForGroup(e.target.value)}
                            placeholder="Search users to add..."
                            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        />
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedMembers.map((m) => (
                                    <span key={m.id} className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-600 text-xs font-semibold flex items-center gap-1">
                                        @{m.username}
                                        <button type="button" onClick={() => setSelectedMembers(selectedMembers.filter((i) => i.id !== m.id))}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="max-h-36 overflow-y-auto space-y-1">
                            {groupResults.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                        if (!selectedMembers.some((m) => m.id === u.id)) setSelectedMembers([...selectedMembers, u]);
                                    }}
                                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm"
                                >
                                    {u.name} <span className="text-zinc-500">@{u.username}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm">Cancel</button>
                            <button type="submit" disabled={!groupName || selectedMembers.length === 0} className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-sm font-bold disabled:opacity-50">Create</button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
