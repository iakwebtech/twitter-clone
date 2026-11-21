import { Head, useForm } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import AdminNav from './AdminNav';
import { useToast } from '../../Components/ToastContext';

export default function Settings({ settings }) {
    const { toast } = useToast();
    const form = useForm({
        site_name: settings.site_name || 'Pulse',
        site_description: settings.site_description || '',
        max_post_length: settings.max_post_length || 280,
        registration_enabled: Boolean(settings.registration_enabled),
        maintenance_mode: Boolean(settings.maintenance_mode),
    });

    const submit = (e) => {
        e.preventDefault();
        form.post('/admin/settings', {
            onSuccess: () => toast('Platform settings saved'),
        });
    };

    return (
        <AppLayout>
            <Head title="Admin - Platform Settings" />
            <AdminNav />

            <form onSubmit={submit} className="p-4 sm:p-6 space-y-4 max-w-lg">
                <div>
                    <label className="block text-xs font-bold mb-1">Platform Name</label>
                    <input
                        type="text"
                        value={form.data.site_name}
                        onChange={(e) => form.setData('site_name', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold mb-1">Platform Description</label>
                    <textarea
                        value={form.data.site_description}
                        onChange={(e) => form.setData('site_description', e.target.value)}
                        rows={2}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold mb-1">Max Post Character Limit</label>
                    <input
                        type="number"
                        min={100}
                        max={2000}
                        value={form.data.max_post_length}
                        onChange={(e) => form.setData('max_post_length', Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm"
                        required
                    />
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-sm font-medium">Allow New User Registrations</span>
                    <input
                        type="checkbox"
                        checked={form.data.registration_enabled}
                        onChange={(e) => form.setData('registration_enabled', e.target.checked)}
                        className="w-4 h-4 accent-sky-500"
                    />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="text-sm font-medium">Maintenance Mode</span>
                    <input
                        type="checkbox"
                        checked={form.data.maintenance_mode}
                        onChange={(e) => form.setData('maintenance_mode', e.target.checked)}
                        className="w-4 h-4 accent-sky-500"
                    />
                </label>

                <button type="submit" disabled={form.processing} className="px-6 py-2 rounded-full bg-sky-500 text-white font-bold text-sm">
                    Save Platform Settings
                </button>
            </form>
        </AppLayout>
    );
}
