import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Shield, Lock, Key, Monitor, Ban, VolumeX, AlertTriangle } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import Avatar from '../../Components/Avatar';
import { useToast } from '../../Components/ToastContext';

export default function Index({ settings, isPrivate, loginActivities = [], blockedUsers = [], mutedUsers = [] }) {
    const { toast } = useToast();
    const [tab, setTab] = useState('privacy');

    const privacyForm = useForm({
        is_private: isPrivate,
        who_can_reply: settings?.who_can_reply || 'everyone',
        who_can_mention: settings?.who_can_mention || 'everyone',
        who_can_message: settings?.who_can_message || 'everyone',
        email_notifications: settings?.email_notifications ?? true,
        push_notifications: settings?.push_notifications ?? true,
        two_factor_enabled: settings?.two_factor_enabled ?? false,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const dangerForm = useForm({ password: '' });

    const savePrivacy = (e) => {
        e.preventDefault();
        privacyForm.patch('/settings', {
            onSuccess: () => toast('Privacy & notification settings saved'),
        });
    };

    const savePassword = (e) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            onSuccess: () => {
                passwordForm.reset();
                toast('Password updated');
            },
        });
    };

    const unblock = async (id) => {
        await window.axios.post(`/users/${id}/block`);
        router.reload();
    };

    const unmute = async (id) => {
        await window.axios.post(`/users/${id}/mute`);
        router.reload();
    };

    const tabs = [
        { key: 'privacy', label: 'Privacy & Safety', icon: Shield },
        { key: 'security', label: 'Password & Sessions', icon: Key },
        { key: 'blocked', label: 'Blocked & Muted', icon: Ban },
        { key: 'account', label: 'Account', icon: AlertTriangle },
    ];

    return (
        <AppLayout>
            <Head title="Settings" />
            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
                <h1 className="text-lg font-extrabold">Settings</h1>
            </header>

            <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold shrink-0 border-b-2 transition cursor-pointer ${
                                tab === t.key ? 'border-sky-500 text-sky-500' : 'border-transparent text-zinc-500'
                            }`}
                        >
                            <Icon className="w-4 h-4" /> {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 sm:p-6">
                {tab === 'privacy' && (
                    <form onSubmit={savePrivacy} className="space-y-5 max-w-lg">
                        <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                            <div>
                                <div className="font-bold text-sm flex items-center gap-1.5"><Lock className="w-4 h-4" /> Private Account</div>
                                <div className="text-xs text-zinc-500">Only approved followers can see your posts.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={privacyForm.data.is_private}
                                onChange={(e) => privacyForm.setData('is_private', e.target.checked)}
                                className="w-4 h-4 accent-sky-500"
                            />
                        </label>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold mb-1">Who can reply to your posts</label>
                                <select
                                    value={privacyForm.data.who_can_reply}
                                    onChange={(e) => privacyForm.setData('who_can_reply', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="following">People you follow</option>
                                    <option value="mentioned">Only mentioned users</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Who can @mention you</label>
                                <select
                                    value={privacyForm.data.who_can_mention}
                                    onChange={(e) => privacyForm.setData('who_can_mention', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="following">People you follow</option>
                                    <option value="nobody">Nobody</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Who can send you Direct Messages</label>
                                <select
                                    value={privacyForm.data.who_can_message}
                                    onChange={(e) => privacyForm.setData('who_can_message', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="following">People you follow</option>
                                    <option value="nobody">No one</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <span className="text-sm font-medium">Two-Factor Authentication (2FA)</span>
                            <input
                                type="checkbox"
                                checked={privacyForm.data.two_factor_enabled}
                                onChange={(e) => privacyForm.setData('two_factor_enabled', e.target.checked)}
                                className="w-4 h-4 accent-sky-500"
                            />
                        </label>

                        <button type="submit" disabled={privacyForm.processing} className="px-6 py-2 rounded-full bg-sky-500 text-white font-bold text-sm">
                            Save Settings
                        </button>
                    </form>
                )}

                {tab === 'security' && (
                    <div className="space-y-8 max-w-lg">
                        <form onSubmit={savePassword} className="space-y-3">
                            <h3 className="font-bold text-base">Change Password</h3>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                placeholder="Current password"
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                placeholder="New password"
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                                required
                            />
                            {passwordForm.errors.current_password && <p className="text-xs text-red-500">{passwordForm.errors.current_password}</p>}
                            <button type="submit" className="px-5 py-2 rounded-full bg-sky-500 text-white text-sm font-bold">
                                Update Password
                            </button>
                        </form>

                        <div className="space-y-3">
                            <h3 className="font-bold text-base flex items-center gap-2"><Monitor className="w-4 h-4" /> Login Activity</h3>
                            <div className="space-y-2">
                                {loginActivities.map((act) => (
                                    <div key={act.id} className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                                        <div>
                                            <div className="font-bold">{act.device || 'Web Browser'} {act.is_current && <span className="text-emerald-500">(Current)</span>}</div>
                                            <div className="text-zinc-500">IP: {act.ip_address}</div>
                                        </div>
                                        <span className="text-zinc-500">{new Date(act.logged_in_at).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'blocked' && (
                    <div className="space-y-6 max-w-lg">
                        <div>
                            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Ban className="w-4 h-4 text-red-500" /> Blocked Users ({blockedUsers.length})</h3>
                            {blockedUsers.length === 0 ? (
                                <p className="text-xs text-zinc-500">You haven&apos;t blocked anyone.</p>
                            ) : (
                                blockedUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={u.avatar_url} name={u.name} size="xs" />
                                            <span className="text-sm font-medium">@{u.username}</span>
                                        </div>
                                        <button onClick={() => unblock(u.id)} className="text-xs text-sky-500 font-bold">Unblock</button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><VolumeX className="w-4 h-4 text-zinc-500" /> Muted Users ({mutedUsers.length})</h3>
                            {mutedUsers.length === 0 ? (
                                <p className="text-xs text-zinc-500">You haven&apos;t muted anyone.</p>
                            ) : (
                                mutedUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={u.avatar_url} name={u.name} size="xs" />
                                            <span className="text-sm font-medium">@{u.username}</span>
                                        </div>
                                        <button onClick={() => unmute(u.id)} className="text-xs text-sky-500 font-bold">Unmute</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'account' && (
                    <div className="space-y-4 max-w-lg">
                        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                            <h3 className="font-bold text-sm">Deactivate or Delete Account</h3>
                            <p className="text-xs text-zinc-500">Confirm your password to deactivate (reversible) or permanently delete your account.</p>
                            <input
                                type="password"
                                value={dangerForm.data.password}
                                onChange={(e) => dangerForm.setData('password', e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => dangerForm.post('/settings/deactivate')}
                                    className="px-4 py-2 rounded-full border border-amber-500 text-amber-600 text-xs font-bold"
                                >
                                    Deactivate Account
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Permanently delete your account? This cannot be undone.')) {
                                            dangerForm.delete('/settings/account');
                                        }
                                    }}
                                    className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold"
                                >
                                    Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
