import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Calendar,
    Link as LinkIcon,
    Lock,
    Mail,
    MapPin,
    MoreHorizontal,
    Ban,
    VolumeX,
    Flag,
    X,
} from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Avatar from '../../Components/Avatar';
import PostCard from '../../Components/PostCard';
import { useToast } from '../../Components/ToastContext';

export default function Show({
    profileUser,
    tab = 'posts',
    posts = [],
    canViewPosts = true,
    mutualFollowers = [],
    isOwnProfile = false,
}) {
    const { toast } = useToast();
    const [isFollowing, setIsFollowing] = useState(profileUser.is_following);
    const [hasPending, setHasPending] = useState(profileUser.has_pending_request);
    const [followersCount, setFollowersCount] = useState(profileUser.followers_count || 0);
    const [isBlocked, setIsBlocked] = useState(profileUser.is_blocked);
    const [isMuted, setIsMuted] = useState(profileUser.is_muted);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const editForm = useForm({
        name: profileUser.name || '',
        username: profileUser.username || '',
        bio: profileUser.bio || '',
        location: profileUser.location || '',
        website: profileUser.website || '',
        avatar: null,
        cover_image: null,
    });

    const handleFollow = async () => {
        try {
            const res = await window.axios.post(`/users/${profileUser.id}/follow`);
            setIsFollowing(res.data.following);
            setHasPending(res.data.requested);
            if (res.data.status === 'followed') setFollowersCount((c) => c + 1);
            if (res.data.status === 'unfollowed') setFollowersCount((c) => Math.max(0, c - 1));
        } catch {
            router.visit('/login');
        }
    };

    const handleBlock = async () => {
        setShowMoreMenu(false);
        const res = await window.axios.post(`/users/${profileUser.id}/block`);
        setIsBlocked(res.data.blocked);
        toast(res.data.blocked ? `Blocked @${profileUser.username}` : `Unblocked @${profileUser.username}`);
    };

    const handleMute = async () => {
        setShowMoreMenu(false);
        const res = await window.axios.post(`/users/${profileUser.id}/mute`);
        setIsMuted(res.data.muted);
        toast(res.data.muted ? `Muted @${profileUser.username}` : `Unmuted @${profileUser.username}`);
    };

    const submitProfile = (e) => {
        e.preventDefault();
        editForm.post('/profile', {
            forceFormData: true,
            onSuccess: () => {
                setShowEditModal(false);
                toast('Profile updated');
            },
        });
    };

    const tabs = [
        { key: 'posts', label: 'Posts' },
        { key: 'replies', label: 'Replies' },
        { key: 'media', label: 'Media' },
        { key: 'likes', label: 'Likes' },
    ];

    return (
        <AppLayout>
            <Head title={`${profileUser.name} (@${profileUser.username})`} />

            {/* Sticky Top Bar */}
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="font-extrabold text-base flex items-center gap-1">
                        {profileUser.name}
                        {profileUser.is_verified && <BadgeCheck className="w-4 h-4 text-sky-500" />}
                    </h1>
                    <p className="text-xs text-zinc-500">{profileUser.posts_count || 0} posts</p>
                </div>
            </header>

            {/* Cover Banner */}
            <div className="h-44 sm:h-52 bg-gradient-to-r from-sky-500/30 via-indigo-500/20 to-purple-500/30 relative">
                {profileUser.cover_url && (
                    <img src={profileUser.cover_url} alt="Cover" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Profile Header */}
            <div className="px-4 pb-4">
                <div className="flex items-end justify-between -mt-14 mb-3">
                    <div className="p-1 rounded-full bg-white dark:bg-black">
                        <Avatar src={profileUser.avatar_url} name={profileUser.name} size="xl" isOnline={profileUser.is_online} />
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwnProfile ? (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
                            >
                                Edit profile
                            </button>
                        ) : (
                            <>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                                        className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {showMoreMenu && (
                                        <div className="absolute right-0 top-11 z-30 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 text-sm">
                                            <button onClick={handleMute} className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                <VolumeX className="w-4 h-4" /> {isMuted ? 'Unmute' : 'Mute'} @{profileUser.username}
                                            </button>
                                            <button onClick={handleBlock} className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-500 hover:bg-red-500/10">
                                                <Ban className="w-4 h-4" /> {isBlocked ? 'Unblock' : 'Block'} @{profileUser.username}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    router.post('/reports', { type: 'user', id: profileUser.id, reason: 'Abuse or spam' });
                                                }}
                                                className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                                            >
                                                <Flag className="w-4 h-4" /> Report user
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => router.post(`/messages/direct/${profileUser.id}`)}
                                    title="Send message"
                                    className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={handleFollow}
                                    className={`px-5 py-2 rounded-full font-bold text-sm transition cursor-pointer ${
                                        isFollowing || hasPending
                                            ? 'border border-zinc-300 dark:border-zinc-700 hover:border-red-500 hover:text-red-500'
                                            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90'
                                    }`}
                                >
                                    {isFollowing ? 'Following' : hasPending ? 'Requested' : 'Follow'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <h2 className="text-xl font-extrabold flex items-center gap-1.5">
                            {profileUser.name}
                            {profileUser.is_verified && <BadgeCheck className="w-5 h-5 text-sky-500" />}
                            {profileUser.is_private && <Lock className="w-4 h-4 text-zinc-500" />}
                        </h2>
                        <p className="text-sm text-zinc-500">@{profileUser.username}</p>
                    </div>

                    {profileUser.bio && <p className="text-sm leading-relaxed">{profileUser.bio}</p>}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 pt-1">
                        {profileUser.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {profileUser.location}
                            </span>
                        )}
                        {profileUser.website && (
                            <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:underline">
                                <LinkIcon className="w-3.5 h-3.5" /> {profileUser.website.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Joined {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="flex items-center gap-5 text-sm pt-1">
                        <Link href={`/@${profileUser.username}/following`} className="hover:underline">
                            <span className="font-bold">{profileUser.following_count || 0}</span>{' '}
                            <span className="text-zinc-500">Following</span>
                        </Link>
                        <Link href={`/@${profileUser.username}/followers`} className="hover:underline">
                            <span className="font-bold">{followersCount}</span>{' '}
                            <span className="text-zinc-500">Followers</span>
                        </Link>
                    </div>

                    {mutualFollowers.length > 0 && (
                        <p className="text-xs text-zinc-500">
                            Followed by {mutualFollowers.map((m) => m.name).join(', ')}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map((t) => (
                    <Link
                        key={t.key}
                        href={`/@${profileUser.username}?tab=${t.key}`}
                        className={`relative py-3 text-center text-sm font-semibold hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 ${
                            tab === t.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                        }`}
                    >
                        {t.label}
                        {tab === t.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-sky-500" />}
                    </Link>
                ))}
            </div>

            {/* Posts */}
            {!canViewPosts ? (
                <div className="py-16 px-6 text-center space-y-2">
                    <Lock className="w-10 h-10 mx-auto text-zinc-400" />
                    <h3 className="font-bold text-lg">This account is private</h3>
                    <p className="text-sm text-zinc-500">Follow @{profileUser.username} to see their posts.</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="py-14 text-center text-sm text-zinc-500">No posts in this tab yet.</div>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowEditModal(false)}>
                    <form
                        onSubmit={submitProfile}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-lg">Edit Profile</h3>
                            <button type="button" onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1">Profile Picture</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => editForm.setData('avatar', e.target.files[0])}
                                    className="text-xs w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => editForm.setData('cover_image', e.target.files[0])}
                                    className="text-xs w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={editForm.data.username}
                                onChange={(e) => editForm.setData('username', e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Bio</label>
                            <textarea
                                value={editForm.data.bio}
                                onChange={(e) => editForm.setData('bio', e.target.value)}
                                rows={3}
                                maxLength={200}
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1">Location</label>
                                <input
                                    type="text"
                                    value={editForm.data.location}
                                    onChange={(e) => editForm.setData('location', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Website</label>
                                <input
                                    type="url"
                                    value={editForm.data.website}
                                    onChange={(e) => editForm.setData('website', e.target.value)}
                                    placeholder="https://"
                                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={editForm.processing} className="px-5 py-2 rounded-full bg-sky-500 text-white text-sm font-bold">
                                {editForm.processing ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
