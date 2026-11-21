import { Head, router } from '@inertiajs/react';
import PulseLogo from '../../Components/PulseLogo';

export default function VerifyEmail({ status }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <Head title="Verify Email" />
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-5">
                <PulseLogo className="w-10 h-10 mx-auto" />
                <h1 className="text-xl font-extrabold">Verify your email address</h1>
                <p className="text-sm text-zinc-500">
                    Thanks for signing up! Please click the verification link we sent to your email address.
                </p>
                {status && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm">{status}</div>}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => router.post('/email/verification-notification')}
                        className="w-full py-2.5 rounded-full bg-sky-500 text-white font-bold"
                    >
                        Resend Verification Email
                    </button>
                    <button
                        onClick={() => router.post('/logout')}
                        className="text-sm text-zinc-500 hover:underline mt-2"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
}
