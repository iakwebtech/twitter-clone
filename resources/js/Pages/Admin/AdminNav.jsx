import { Link, usePage } from '@inertiajs/react';

export default function AdminNav() {
    const url = usePage().url;
    const links = [
        { label: 'Overview', href: '/admin', active: url === '/admin' },
        { label: 'Users', href: '/admin/users', active: url.startsWith('/admin/users') },
        { label: 'Content & Tags', href: '/admin/content', active: url.startsWith('/admin/content') },
        { label: 'Reports', href: '/admin/reports', active: url.startsWith('/admin/reports') },
        { label: 'Platform Settings', href: '/admin/settings', active: url.startsWith('/admin/settings') },
    ];

    return (
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-3">
                <h1 className="text-lg font-extrabold">Admin Control Center</h1>
            </div>
            <div className="flex overflow-x-auto px-2">
                {links.map((l) => (
                    <Link
                        key={l.href}
                        href={l.href}
                        className={`px-3.5 py-2.5 text-xs font-bold border-b-2 shrink-0 transition ${
                            l.active ? 'border-sky-500 text-sky-500' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        {l.label}
                    </Link>
                ))}
            </div>
        </header>
    );
}
