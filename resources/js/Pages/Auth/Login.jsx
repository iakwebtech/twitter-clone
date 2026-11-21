import { Head, Link, useForm } from '@inertiajs/react';
import PulseLogo from '../../Components/PulseLogo';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <Head title="Sign in" />
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    <PulseLogo className="w-11 h-11" />
                    <h1 className="text-2xl font-extrabold tracking-tight">Sign in to Pulse</h1>
                    <p className="text-sm text-zinc-500">Join the real-time conversation</p>
                </div>

                {status && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Email or Username</label>
                        <input
                            type="text"
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                            placeholder="admin@pulse.local or admin"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                        {errors.login && <p className="text-xs text-red-500 mt-1">{errors.login}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium">Password</label>
                            <Link href="/forgot-password" className="text-xs text-sky-500 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:border-sky-500"
                            required
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-zinc-300 text-sky-500 focus:ring-sky-500"
                        />
                        Remember me
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 space-y-1">
                    <div className="font-semibold text-zinc-700 dark:text-zinc-300">Demo Credentials:</div>
                    <div>Admin: <code className="text-sky-500">admin@pulse.local</code> / <code className="text-sky-500">password</code></div>
                    <div>User: <code className="text-sky-500">maya@pulse.local</code> / <code className="text-sky-500">password</code></div>
                </div>

                <p className="text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-sky-500 font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
