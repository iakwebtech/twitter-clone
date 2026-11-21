import { useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Image,
    Smile,
    BarChart2,
    MapPin,
    Calendar,
    Globe,
    Users,
    Lock,
    X,
    Plus,
    FileText,
    Sparkles,
} from 'lucide-react';
import Avatar from './Avatar';
import { useToast } from './ToastContext';

const EMOJIS = ['🔥', '🚀', '✨', '❤️', '😂', '👏', '🙌', '💡', '🎉', '👀', '💯', '☕', '⚡', '🎯', '💻', '🌍'];

export default function PostComposer({
    parentId = null,
    repostOf = null,
    placeholder = "What's happening?",
    onSuccess = null,
    compact = false,
}) {
    const { auth, platform } = usePage().props;
    const { toast } = useToast();
    const maxLen = platform?.max_post_length || 280;
    const fileInputRef = useRef(null);

    const [content, setContent] = useState('');
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [visibility, setVisibility] = useState('public');
    const [location, setLocation] = useState('');
    const [showLocation, setShowLocation] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showPoll, setShowPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [pollHours, setPollHours] = useState(24);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledFor, setScheduledFor] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [showDrafts, setShowDrafts] = useState(false);

    if (!auth?.user) return null;

    const remaining = maxLen - content.length;
    const progress = Math.min(100, (content.length / maxLen) * 100);
    const canSubmit =
        !submitting &&
        remaining >= 0 &&
        (content.trim().length > 0 || files.length > 0 || (showPoll && pollOptions.filter((o) => o.trim()).length >= 2));

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files || []);
        const combined = [...files, ...selected].slice(0, 4);
        setFiles(combined);
        setPreviews(
            combined.map((f) => ({
                url: URL.createObjectURL(f),
                type: f.type.startsWith('video/') ? 'video' : 'image',
                name: f.name,
            }))
        );
    };

    const removeFile = (idx) => {
        const nextFiles = files.filter((_, i) => i !== idx);
        const nextPreviews = previews.filter((_, i) => i !== idx);
        setFiles(nextFiles);
        setPreviews(nextPreviews);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        const formData = new FormData();
        if (content.trim()) formData.append('content', content);
        if (parentId) formData.append('parent_id', parentId);
        if (repostOf?.id) formData.append('repost_of_id', repostOf.id);
        formData.append('visibility', visibility);
        if (location.trim()) formData.append('location', location.trim());
        if (scheduledFor) formData.append('scheduled_for', scheduledFor);

        files.forEach((f) => formData.append('media[]', f));

        if (showPoll) {
            const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
            if (validOpts.length >= 2) {
                validOpts.forEach((opt, i) => formData.append(`poll[options][${i}]`, opt));
                formData.append('poll[duration_hours]', pollHours);
            }
        }

        router.post('/posts', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setContent('');
                setFiles([]);
                setPreviews([]);
                setLocation('');
                setShowLocation(false);
                setShowPoll(false);
                setPollOptions(['', '']);
                setShowSchedule(false);
                setScheduledFor('');
                toast(scheduledFor ? 'Post scheduled!' : 'Post published!');
                if (onSuccess) onSuccess();
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast(firstErr || 'Could not publish post.', 'error');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleSaveDraft = async () => {
        if (!content.trim()) return;
        try {
            await window.axios.post('/drafts', { content, visibility, location });
            toast('Saved to drafts');
        } catch {
            toast('Failed to save draft', 'error');
        }
    };

    const loadDrafts = async () => {
        if (!showDrafts) {
            const res = await window.axios.get('/drafts');
            setDrafts(res.data.drafts || []);
        }
        setShowDrafts(!showDrafts);
    };

    const visibilityIcons = {
        public: <Globe className="w-3.5 h-3.5" />,
        followers: <Users className="w-3.5 h-3.5" />,
        private: <Lock className="w-3.5 h-3.5" />,
    };

    return (
        <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? 'p-3' : 'p-4'} border-b border-zinc-200 dark:border-zinc-800`}>
            <Avatar src={auth.user.avatar_url} name={auth.user.name} size={compact ? 'sm' : 'md'} />

            <div className="flex-1 min-w-0">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    rows={compact ? 2 : 3}
                    className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 text-base md:text-lg resize-none focus:outline-none"
                />

                {/* Quoted Post Preview */}
                {repostOf && (
                    <div className="mt-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                            <span>{repostOf.user?.name}</span>
                            <span className="text-zinc-500 font-normal">@{repostOf.user?.username}</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{repostOf.content}</p>
                    </div>
                )}

                {/* Media Previews */}
                {previews.length > 0 && (
                    <div className={`grid gap-2 mt-2 ${previews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {previews.map((item, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black">
                                {item.type === 'video' ? (
                                    <video src={item.url} controls className="w-full max-h-64 object-contain" />
                                ) : (
                                    <img src={item.url} alt="" className="w-full max-h-64 object-cover" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Poll Builder */}
                {showPoll && (
                    <div className="mt-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            <span>Create Poll</span>
                            <button type="button" onClick={() => setShowPoll(false)} className="text-red-500 hover:underline">
                                Remove
                            </button>
                        </div>
                        {pollOptions.map((opt, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={opt}
                                    maxLength={80}
                                    onChange={(e) => {
                                        const next = [...pollOptions];
                                        next[idx] = e.target.value;
                                        setPollOptions(next);
                                    }}
                                    placeholder={`Choice ${idx + 1}`}
                                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                                />
                                {pollOptions.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                        className="p-2 text-zinc-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center justify-between pt-1">
                            {pollOptions.length < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setPollOptions([...pollOptions, ''])}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-500 hover:underline"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add choice
                                </button>
                            ) : <span />}
                            <select
                                value={pollHours}
                                onChange={(e) => setPollHours(Number(e.target.value))}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                <option value={1}>1 hour</option>
                                <option value={6}>6 hours</option>
                                <option value={24}>1 day</option>
                                <option value={72}>3 days</option>
                                <option value={168}>7 days</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Location & Schedule Inputs */}
                {showLocation && (
                    <div className="mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-500" />
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Add location (e.g., San Francisco, CA)"
                            className="flex-1 text-sm bg-transparent border-b border-zinc-200 dark:border-zinc-800 py-1 focus:outline-none focus:border-sky-500"
                        />
                    </div>
                )}

                {showSchedule && (
                    <div className="mt-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <input
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            className="text-sm bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500"
                        />
                    </div>
                )}

                {/* Drafts Drawer */}
                {showDrafts && (
                    <div className="mt-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
                        <div className="text-xs font-semibold text-zinc-500">Saved Drafts</div>
                        {drafts.length === 0 ? (
                            <p className="text-xs text-zinc-500">No drafts saved yet.</p>
                        ) : (
                            drafts.map((d) => (
                                <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setContent(d.content || '');
                                            setShowDrafts(false);
                                        }}
                                        className="text-left truncate flex-1 hover:text-sky-500"
                                    >
                                        {d.content}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await window.axios.delete(`/drafts/${d.id}`);
                                            setDrafts(drafts.filter((item) => item.id !== d.id));
                                        }}
                                        className="text-xs text-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-1 relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Add media"
                            className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                        >
                            <Image className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            title="Add emoji"
                            className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        {!parentId && (
                            <button
                                type="button"
                                onClick={() => setShowPoll(!showPoll)}
                                title="Create poll"
                                className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                            >
                                <BarChart2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowLocation(!showLocation)}
                            title="Tag location"
                            className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
                        {!parentId && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowSchedule(!showSchedule)}
                                    title="Schedule post"
                                    className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                                >
                                    <Calendar className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={loadDrafts}
                                    title="Drafts"
                                    className="p-2 rounded-full text-sky-500 hover:bg-sky-500/10 transition"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* Visibility Selector */}
                        <div className="hidden sm:flex items-center gap-1 ml-1 px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-medium">
                            {visibilityIcons[visibility]}
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="bg-transparent focus:outline-none cursor-pointer"
                            >
                                <option value="public" className="text-zinc-900">Everyone</option>
                                <option value="followers" className="text-zinc-900">Followers</option>
                                <option value="private" className="text-zinc-900">Only me</option>
                            </select>
                        </div>

                        {/* Emoji Popover */}
                        {showEmoji && (
                            <div className="absolute top-10 left-0 z-30 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl grid grid-cols-8 gap-1">
                                {EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                            setContent((c) => c + emoji);
                                            setShowEmoji(false);
                                        }}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-lg"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {content.length > 0 && (
                            <div className="flex items-center gap-2">
                                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-200 dark:text-zinc-800" />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeDasharray={56.5}
                                        strokeDashoffset={56.5 - (56.5 * progress) / 100}
                                        className={remaining < 0 ? 'text-red-500' : remaining <= 20 ? 'text-amber-500' : 'text-sky-500'}
                                    />
                                </svg>
                                {remaining <= 20 && (
                                    <span className={`text-xs font-semibold ${remaining < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                        {remaining}
                                    </span>
                                )}
                            </div>
                        )}

                        {content.trim() && !parentId && (
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="hidden sm:inline-flex text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                Save draft
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition cursor-pointer"
                        >
                            {submitting ? 'Posting...' : parentId ? 'Reply' : scheduledFor ? 'Schedule' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
