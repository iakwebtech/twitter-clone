import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Bookmark,
    Share,
    MoreHorizontal,
    BadgeCheck,
    Pin,
    Trash2,
    Edit3,
    Flag,
    BarChart3,
    MapPin,
    Check,
    Link2,
} from 'lucide-react';
import Avatar from './Avatar';
import RichText from './RichText';
import PostComposer from './PostComposer';
import { useToast } from './ToastContext';

export default function PostCard({ post, onDeleted = null }) {
    const { auth } = usePage().props;
    const { toast } = useToast();
    const isOwner = auth?.user?.id === post.user?.id;

    const [liked, setLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [reposted, setReposted] = useState(post.is_reposted);
    const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
    const [bookmarked, setBookmarked] = useState(post.is_bookmarked);
    const [poll, setPoll] = useState(post.poll);
    const [showMenu, setShowMenu] = useState(false);
    const [showRepostMenu, setShowRepostMenu] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editContent, setEditContent] = useState(post.content || '');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('Spam or misleading');
    const [reportDetails, setReportDetails] = useState('');

    const requireAuth = () => {
        if (!auth?.user) {
            router.visit('/login');
            return false;
        }
        return true;
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        const prev = liked;
        setLiked(!prev);
        setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
        try {
            const res = await window.axios.post(`/posts/${post.id}/like`);
            setLiked(res.data.liked);
            setLikesCount(res.data.likes_count);
        } catch {
            setLiked(prev);
        }
    };

    const handleRepost = async (e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        setShowRepostMenu(false);
        const prev = reposted;
        setReposted(!prev);
        setRepostsCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
        try {
            const res = await window.axios.post(`/posts/${post.id}/repost`);
            setReposted(res.data.reposted);
            setRepostsCount(res.data.reposts_count);
            toast(res.data.reposted ? 'Reposted to your timeline' : 'Removed repost');
        } catch {
            setReposted(prev);
        }
    };

    const handleBookmark = async (e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        const prev = bookmarked;
        setBookmarked(!prev);
        try {
            const res = await window.axios.post(`/posts/${post.id}/bookmark`);
            setBookmarked(res.data.bookmarked);
            toast(res.data.bookmarked ? 'Added to Bookmarks' : 'Removed from Bookmarks');
        } catch {
            setBookmarked(prev);
        }
    };

    const handleCopyLink = (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/posts/${post.id}`;
        navigator.clipboard.writeText(url);
        toast('Post link copied to clipboard');
    };

    const handleVote = async (e, optionId) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        try {
            const res = await window.axios.post(`/posts/${post.id}/vote`, { option_id: optionId });
            setPoll((p) => ({ ...p, ...res.data.poll }));
            toast('Vote recorded!');
        } catch (err) {
            toast(err.response?.data?.message || 'Could not vote', 'error');
        }
    };

    const handleDelete = () => {
        setShowMenu(false);
        if (!confirm('Delete this post permanently?')) return;
        router.delete(`/posts/${post.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast('Post deleted');
                if (onDeleted) onDeleted(post.id);
            },
        });
    };

    const handlePin = () => {
        setShowMenu(false);
        router.post(`/posts/${post.id}/pin`, {}, { preserveScroll: true });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        router.patch(
            `/posts/${post.id}`,
            { content: editContent },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowEditModal(false);
                    toast('Post updated');
                },
            }
        );
    };

    const handleReport = (e) => {
        e.preventDefault();
        router.post(
            '/reports',
            { type: 'post', id: post.id, reason: reportReason, details: reportDetails },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowReportModal(false);
                    toast('Report submitted. Thank you.');
                },
            }
        );
    };

    return (
        <>
            <article
                onClick={() => router.visit(`/posts/${post.id}`)}
                className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition cursor-pointer"
            >
                {post.is_pinned && (
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1.5 pl-8">
                        <Pin className="w-3.5 h-3.5" />
                        <span>Pinned post</span>
                    </div>
                )}

                <div className="flex gap-3">
                    <Link href={`/@${post.user?.username}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar src={post.user?.avatar_url} name={post.user?.name} />
                    </Link>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap text-sm min-w-0">
                                <Link
                                    href={`/@${post.user?.username}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline truncate flex items-center gap-1"
                                >
                                    {post.user?.name}
                                    {post.user?.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" />}
                                </Link>
                                <span className="text-zinc-500 truncate">@{post.user?.username}</span>
                                <span className="text-zinc-400">·</span>
                                <span className="text-zinc-500 text-xs">{post.created_human}</span>
                            </div>

                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 rounded-full text-zinc-400 hover:text-sky-500 hover:bg-sky-500/10 transition"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 text-sm">
                                        {isOwner && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <Edit3 className="w-4 h-4" /> Edit post
                                                </button>
                                                <button
                                                    onClick={handlePin}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <Pin className="w-4 h-4" /> {post.is_pinned ? 'Unpin' : 'Pin to profile'}
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                setShowMenu(false);
                                                handleCopyLink(e);
                                            }}
                                            className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <Link2 className="w-4 h-4" /> Copy link
                                        </button>
                                        {!isOwner && auth?.user && (
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowReportModal(true);
                                                }}
                                                className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-red-500 hover:bg-red-500/10"
                                            >
                                                <Flag className="w-4 h-4" /> Report post
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        {post.content && <RichText text={post.content} className="mt-1 text-[15px] text-zinc-900 dark:text-zinc-100" />}

                        {post.location && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-zinc-500">
                                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                                <span>{post.location}</span>
                            </div>
                        )}

                        {/* Media Grid */}
                        {post.media && post.media.length > 0 && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className={`mt-2.5 grid gap-1.5 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ${
                                    post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                                }`}
                            >
                                {post.media.map((m) => (
                                    <div key={m.id} className="bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                                        {m.type === 'video' ? (
                                            <video src={m.url} controls className="w-full max-h-96 object-contain bg-black" />
                                        ) : (
                                            <img src={m.url} alt={m.alt_text || ''} className="w-full max-h-96 object-cover" loading="lazy" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Poll */}
                        {poll && (
                            <div onClick={(e) => e.stopPropagation()} className="mt-3 space-y-2">
                                {poll.options?.map((opt) => {
                                    const hasVoted = Boolean(poll.user_voted_option_id) || poll.is_expired;
                                    const isUserChoice = poll.user_voted_option_id === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            disabled={hasVoted}
                                            onClick={(e) => handleVote(e, opt.id)}
                                            className={`relative w-full text-left px-3.5 py-2 rounded-xl border text-sm overflow-hidden transition ${
                                                isUserChoice
                                                    ? 'border-sky-500 font-semibold'
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-sky-400'
                                            }`}
                                        >
                                            {hasVoted && (
                                                <div
                                                    className={`absolute inset-y-0 left-0 ${
                                                        isUserChoice ? 'bg-sky-500/20' : 'bg-zinc-200/70 dark:bg-zinc-800/80'
                                                    }`}
                                                    style={{ width: `${opt.percentage}%` }}
                                                />
                                            )}
                                            <div className="relative flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    {opt.option_text}
                                                    {isUserChoice && <Check className="w-4 h-4 text-sky-500" />}
                                                </span>
                                                {hasVoted && <span className="font-semibold">{opt.percentage}%</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                                <div className="text-xs text-zinc-500">
                                    {poll.total_votes} votes · {poll.is_expired ? 'Final results' : 'Poll active'}
                                </div>
                            </div>
                        )}

                        {/* Quoted Post */}
                        {post.repost_of && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.visit(`/posts/${post.repost_of.id}`);
                                }}
                                className="mt-2.5 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition"
                            >
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Avatar src={post.repost_of.user?.avatar_url} name={post.repost_of.user?.name} size="xs" />
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{post.repost_of.user?.name}</span>
                                    <span className="text-zinc-500">@{post.repost_of.user?.username}</span>
                                </div>
                                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{post.repost_of.content}</p>
                            </div>
                        )}

                        {/* Engagement Action Bar */}
                        <div className="flex items-center justify-between mt-3 max-w-md text-zinc-500">
                            <Link
                                href={`/posts/${post.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="group flex items-center gap-1.5 hover:text-sky-500 transition text-xs"
                            >
                                <span className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                                    <MessageCircle className="w-4 h-4" />
                                </span>
                                <span>{post.replies_count || 0}</span>
                            </Link>

                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setShowRepostMenu(!showRepostMenu)}
                                    className={`group flex items-center gap-1.5 transition text-xs ${
                                        reposted ? 'text-emerald-500' : 'hover:text-emerald-500'
                                    }`}
                                >
                                    <span className="p-1.5 rounded-full group-hover:bg-emerald-500/10">
                                        <Repeat2 className="w-4 h-4" />
                                    </span>
                                    <span>{repostsCount}</span>
                                </button>
                                {showRepostMenu && (
                                    <div className="absolute left-0 bottom-8 z-30 w-40 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 text-sm text-zinc-800 dark:text-zinc-200">
                                        <button
                                            onClick={handleRepost}
                                            className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                                        >
                                            <Repeat2 className="w-4 h-4" /> {reposted ? 'Undo repost' : 'Repost'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowRepostMenu(false);
                                                if (requireAuth()) setShowQuoteModal(true);
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" /> Quote post
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleLike}
                                className={`group flex items-center gap-1.5 transition text-xs ${
                                    liked ? 'text-rose-500' : 'hover:text-rose-500'
                                }`}
                            >
                                <span className="p-1.5 rounded-full group-hover:bg-rose-500/10">
                                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                                </span>
                                <span>{likesCount}</span>
                            </button>

                            <span className="hidden sm:flex items-center gap-1 text-xs">
                                <BarChart3 className="w-4 h-4" />
                                <span>{post.views_count || 0}</span>
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleBookmark}
                                    className={`p-1.5 rounded-full transition ${
                                        bookmarked ? 'text-sky-500' : 'hover:text-sky-500 hover:bg-sky-500/10'
                                    }`}
                                    title="Bookmark"
                                >
                                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="p-1.5 rounded-full hover:text-sky-500 hover:bg-sky-500/10 transition"
                                    title="Share / Copy link"
                                >
                                    <Share className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowQuoteModal(false)}>
                    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-bold">
                            <span>Quote Post</span>
                            <button onClick={() => setShowQuoteModal(false)} className="text-zinc-500 hover:text-zinc-900">✕</button>
                        </div>
                        <PostComposer repostOf={post} placeholder="Add a comment..." onSuccess={() => setShowQuoteModal(false)} />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowEditModal(false)}>
                    <form onSubmit={handleUpdate} className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg">Edit Post</h3>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-sky-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-sm font-semibold">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowReportModal(false)}>
                    <form onSubmit={handleReport} className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg">Report Post</h3>
                        <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                        >
                            <option>Spam or misleading</option>
                            <option>Harassment or hate speech</option>
                            <option>Inappropriate or sensitive content</option>
                            <option>Impersonation</option>
                        </select>
                        <textarea
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            placeholder="Additional details (optional)..."
                            rows={3}
                            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-semibold">
                                Submit Report
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
