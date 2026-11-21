import { Head, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import AdminNav from './AdminNav';

export default function Reports({ reports, status = 'pending' }) {
    const updateStatus = (id, nextStatus) => {
        router.patch(`/admin/reports/${id}`, { status: nextStatus });
    };

    return (
        <AppLayout>
            <Head title="Admin - Reports" />
            <AdminNav />

            <div className="p-4 space-y-4">
                <div className="flex gap-2">
                    {['pending', 'resolved', 'dismissed', 'all'].map((s) => (
                        <button
                            key={s}
                            onClick={() => router.get('/admin/reports', { status: s })}
                            className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                status === s ? 'bg-sky-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {reports.data.length === 0 ? (
                    <div className="py-12 text-center text-sm text-zinc-500">No reports in this queue.</div>
                ) : (
                    <div className="space-y-3">
                        {reports.data.map((r) => (
                            <div key={r.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-red-500">{r.reason}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 capitalize">{r.status}</span>
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Reported by @{r.reporter?.username} · Target: {r.reportable_type?.split('\\').pop()} #{r.reportable_id}
                                </div>
                                {r.details && <p className="text-xs text-zinc-600 dark:text-zinc-400">{r.details}</p>}
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => updateStatus(r.id, 'resolved')} className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                        Resolve
                                    </button>
                                    <button onClick={() => updateStatus(r.id, 'dismissed')} className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-bold">
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
