import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import PulseLogo from '../../Components/PulseLogo';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [usernameStatus, setUsernameStatus] = useState(null);

    useEffect(() => {
        if (!data.username || data.username.length < 3) {
            setUsernameStatus(null);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await window.axios.get('/check-username', { params: { username: data.username } });
                setUsernameStatus(res.data);
            } catch {
                setUsernameStatus(null);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [data.username]);

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8">
            <Head title="Create account" />
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    <PulseLogo className="w-11 h-11" />
                    <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
                    <p className="text-sm text-zinc-500">Join Pulse in seconds</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-zinc-400">@</span>
                            <input
                                type="text"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                                required
                            />
                            {usernameStatus && (
                                <span className="absolute right-3 top-3">
                                    {usernameStatus.available ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                </span>
                            )}
                        </div>
                        {usernameStatus && !usernameStatus.available && (
                            <p className="text-xs text-red-500 mt-1">
                                {usernameStatus.valid ? 'Username is already taken.' : '3-30 characters, letters/numbers/underscores only.'}
                            </p>
                        )}
                        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-sky-500 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
