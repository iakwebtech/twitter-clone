import { Head, Link, useForm } from '@inertiajs/react';
import PulseLogo from '../../Components/PulseLogo';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <Head title="Forgot Password" />
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    <PulseLogo className="w-10 h-10" />
                    <h1 className="text-xl font-extrabold">Reset your password</h1>
                    <p className="text-sm text-zinc-500">Enter your email and we&apos;ll send a reset link.</p>
                </div>

                {status && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm">{status}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                            required
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 rounded-full bg-sky-500 text-white font-bold"
                    >
                        {processing ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <Link href="/login" className="block text-center text-sm text-sky-500 hover:underline">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
