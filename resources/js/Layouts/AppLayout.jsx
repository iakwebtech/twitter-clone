import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Home,
    Compass,
    Bell,
    Mail,
    Bookmark,
    List,
    User,
    Settings,
    ShieldAlert,
    Search,
    Feather,
    Sun,
    Moon,
    LogOut,
    BadgeCheck,
    X,
} from 'lucide-react';
import PulseLogo from '../Components/PulseLogo';
import Avatar from '../Components/Avatar';
import PostComposer from '../Components/PostComposer';
import { useToast } from '../Components/ToastContext';

export default function AppLayout({ children, rightSidebarExtra = null }) {
    const { auth, counts, sidebar, platform, flash } = usePage().props;
    const { toast } = useToast();
    const currentUrl = usePage().url;

    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState({ users: [], hashtags: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [notifCount, setNotifCount] = useState(counts?.notifications || 0);
    const [msgCount, setMsgCount] = useState(counts?.messages || 0);
    const [followedMap, setFollowedMap] = useState({});

    useEffect(() => {
        setNotifCount(counts?.notifications || 0);
        setMsgCount(counts?.messages || 0);
    }, [counts]);

    useEffect(() => {
        if (flash?.success) toast(flash.success, 'success');
        if (flash?.error) toast(flash.error, 'error');
    }, [flash]);

    // Real-time notifications via Laravel Reverb / Echo
    useEffect(() => {
        if (!auth?.user || !window.Echo) return;
        const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);
        channel.notification((notification) => {
            setNotifCount((c) => c + 1);
            if (notification?.data?.message) {
                toast(notification.data.message);
            }
        });
        return () => {
            window.Echo.leave(`App.Models.User.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('pulse_theme', next ? 'dark' : 'light');
    };

    const handleSearchInput = async (val) => {
        setSearchQuery(val);
        if (val.trim().length < 1) {
            setSuggestions({ users: [], hashtags: [] });
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await window.axios.get('/search/suggestions', { params: { q: val } });
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch {
            // ignore
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setShowSuggestions(false);
        router.get('/explore', { q: searchQuery.trim() });
    };

    const handleQuickFollow = async (userId) => {
        try {
            const res = await window.axios.post(`/users/${userId}/follow`);
            setFollowedMap((m) => ({ ...m, [userId]: res.data.following || res.data.requested }));
        } catch {
            toast('Could not follow user', 'error');
        }
    };

    const navItems = [
        { label: 'Home', href: '/', icon: Home, active: currentUrl === '/' || currentUrl.startsWith('/?tab=') },
        { label: 'Explore', href: '/explore', icon: Compass, active: currentUrl.startsWith('/explore') },
        ...(auth?.user
            ? [
                  { label: 'Notifications', href: '/notifications', icon: Bell, badge: notifCount, active: currentUrl.startsWith('/notifications') },
                  { label: 'Messages', href: '/messages', icon: Mail, badge: msgCount, active: currentUrl.startsWith('/messages') },
                  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark, active: currentUrl.startsWith('/bookmarks') },
                  { label: 'Lists', href: '/lists', icon: List, active: currentUrl.startsWith('/lists') },
                  { label: 'Profile', href: `/@${auth.user.username}`, icon: User, active: currentUrl.startsWith(`/@${auth.user.username}`) },
                  { label: 'Settings', href: '/settings', icon: Settings, active: currentUrl.startsWith('/settings') },
                  ...(auth.user.role === 'admin'
                      ? [{ label: 'Admin', href: '/admin', icon: ShieldAlert, active: currentUrl.startsWith('/admin') }]
                      : []),
              ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
            <div className="max-w-7xl mx-auto flex justify-center">
                {/* Left Sidebar */}
                <aside className="hidden md:flex flex-col justify-between w-20 xl:w-64 sticky top-0 h-screen px-2 xl:px-4 py-4 shrink-0">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-3 mb-4">
                            <Link href="/" className="flex items-center gap-2.5">
                                <PulseLogo className="w-9 h-9" />
                                <span className="hidden xl:inline text-xl font-extrabold tracking-tight">{platform?.name || 'Pulse'}</span>
                            </Link>
                            <button
                                onClick={toggleTheme}
                                title="Toggle theme"
                                className="hidden xl:flex p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                            >
                                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-4 px-3.5 py-2.5 rounded-full text-[15px] transition ${
                                            item.active
                                                ? 'font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white'
                                                : 'font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                        }`}
                                    >
                                        <div className="relative">
                                            <Icon className="w-6 h-6" />
                                            {item.badge > 0 && (
                                                <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {auth?.user ? (
                            <button
                                onClick={() => setShowComposeModal(true)}
                                className="mt-4 w-full py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <Feather className="w-5 h-5 xl:hidden" />
                                <span className="hidden xl:inline">Post</span>
                            </button>
                        ) : (
                            <div className="mt-6 space-y-2 hidden xl:block">
                                <Link href="/login" className="block w-full py-2.5 text-center rounded-full bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm">
                                    Sign in
                                </Link>
                                <Link href="/register" className="block w-full py-2.5 text-center rounded-full border border-zinc-300 dark:border-zinc-700 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                    Create account
                                </Link>
                            </div>
                        )}
                    </div>

                    {auth?.user && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                            <Link href={`/@${auth.user.username}`} className="flex items-center gap-2.5 min-w-0">
                                <Avatar src={auth.user.avatar_url} name={auth.user.name} size="sm" />
                                <div className="hidden xl:block min-w-0">
                                    <div className="text-sm font-bold truncate">{auth.user.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">@{auth.user.username}</div>
                                </div>
                            </Link>
                            <button
                                onClick={() => router.post('/logout')}
                                title="Log out"
                                className="hidden xl:flex p-2 rounded-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </aside>

                {/* Center Column */}
                <main className="w-full max-w-2xl border-x border-zinc-200 dark:border-zinc-800 min-h-screen pb-20 md:pb-8">
                    {children}
                </main>

                {/* Right Sidebar */}
                <aside className="hidden lg:block w-80 xl:w-96 sticky top-0 h-screen overflow-y-auto px-5 py-4 space-y-5 shrink-0">
                    {/* Search Box */}
                    <div className="relative">
                        <form onSubmit={handleSearchSubmit}>
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
                                placeholder="Search Pulse"
                                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </form>
                        {showSuggestions && (suggestions.users.length > 0 || suggestions.hashtags.length > 0) && (
                            <div className="absolute left-0 right-0 top-12 z-40 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                                {suggestions.hashtags.map((h) => (
                                    <Link
                                        key={h.id}
                                        href={`/explore?q=${encodeURIComponent('#' + h.name)}`}
                                        onClick={() => setShowSuggestions(false)}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                                    >
                                        <span className="font-semibold text-sky-500">#{h.name}</span>
                                        <span className="text-xs text-zinc-500">{h.posts_count} posts</span>
                                    </Link>
                                ))}
                                {suggestions.users.map((u) => (
                                    <Link
                                        key={u.id}
                                        href={`/@${u.username}`}
                                        onClick={() => setShowSuggestions(false)}
                                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        <Avatar src={u.avatar_url} name={u.name} size="xs" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate flex items-center gap-1">
                                                {u.name}
                                                {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />}
                                            </div>
                                            <div className="text-xs text-zinc-500">@{u.username}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {rightSidebarExtra}

                    {/* What's Happening */}
                    <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800 p-4 space-y-3">
                        <h3 className="font-extrabold text-base">What&apos;s happening</h3>
                        {sidebar?.trending?.length > 0 ? (
                            <div className="space-y-3">
                                {sidebar.trending.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/explore?q=${encodeURIComponent('#' + tag.name)}`}
                                        className="block group"
                                    >
                                        <div className="text-xs text-zinc-500">Trending</div>
                                        <div className="font-bold text-sm group-hover:text-sky-500 transition">#{tag.name}</div>
                                        <div className="text-xs text-zinc-500">{tag.posts_count} posts</div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500">No trending hashtags yet.</p>
                        )}
                        <Link href="/explore" className="block text-xs font-semibold text-sky-500 hover:underline pt-1">
                            Show more
                        </Link>
                    </div>

                    {/* Who to Follow */}
                    {auth?.user && sidebar?.suggestedUsers?.length > 0 && (
                        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800 p-4 space-y-3">
                            <h3 className="font-extrabold text-base">Who to follow</h3>
                            <div className="space-y-3">
                                {sidebar.suggestedUsers.map((u) => {
                                    const isFollowing = followedMap[u.id];
                                    return (
                                        <div key={u.id} className="flex items-center justify-between gap-2">
                                            <Link href={`/@${u.username}`} className="flex items-center gap-2.5 min-w-0">
                                                <Avatar src={u.avatar_url} name={u.name} size="sm" />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold truncate flex items-center gap-1">
                                                        {u.name}
                                                        {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 truncate">@{u.username}</div>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleQuickFollow(u.id)}
                                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                                                    isFollowing
                                                        ? 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                                                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                                                }`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around py-2">
                <Link href="/" className={`p-2 ${currentUrl === '/' ? 'text-sky-500' : 'text-zinc-500'}`}>
                    <Home className="w-6 h-6" />
                </Link>
                <Link href="/explore" className={`p-2 ${currentUrl.startsWith('/explore') ? 'text-sky-500' : 'text-zinc-500'}`}>
                    <Compass className="w-6 h-6" />
                </Link>
                {auth?.user && (
                    <>
                        <button
                            onClick={() => setShowComposeModal(true)}
                            className="p-2.5 rounded-full bg-sky-500 text-white shadow"
                        >
                            <Feather className="w-5 h-5" />
                        </button>
                        <Link href="/notifications" className={`relative p-2 ${currentUrl.startsWith('/notifications') ? 'text-sky-500' : 'text-zinc-500'}`}>
                            <Bell className="w-6 h-6" />
                            {notifCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500" />}
                        </Link>
                        <Link href="/messages" className={`relative p-2 ${currentUrl.startsWith('/messages') ? 'text-sky-500' : 'text-zinc-500'}`}>
                            <Mail className="w-6 h-6" />
                            {msgCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500" />}
                        </Link>
                    </>
                )}
            </nav>

            {/* Compose Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 p-4" onClick={() => setShowComposeModal(false)}>
                    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <span className="font-bold">New Post</span>
                            <button onClick={() => setShowComposeModal(false)} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <PostComposer onSuccess={() => setShowComposeModal(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
