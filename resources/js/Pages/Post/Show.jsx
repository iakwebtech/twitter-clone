import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import PostCard from '../../Components/PostCard';
import PostComposer from '../../Components/PostComposer';

export default function Show({ post, ancestors = [], replies = [] }) {
    const { auth } = usePage().props;

    return (
        <AppLayout>
            <Head title={`Post by ${post.user?.name}`} />

            <header className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-extrabold">Post</h1>
            </header>

            {/* Ancestor Thread */}
            {ancestors.map((ancestor) => (
                <PostCard key={ancestor.id} post={ancestor} />
            ))}

            {/* Main Post */}
            <div className="bg-zinc-50/40 dark:bg-zinc-900/20">
                <PostCard post={post} />
            </div>

            {/* Reply Composer */}
            {auth?.user && (
                <PostComposer parentId={post.id} placeholder="Post your reply" compact />
            )}

            {/* Replies */}
            <div>
                <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    Replies ({replies.length})
                </div>
                {replies.length === 0 ? (
                    <div className="py-12 text-center text-sm text-zinc-500">No replies yet. Start the conversation!</div>
                ) : (
                    replies.map((reply) => <PostCard key={reply.id} post={reply} />)
                )}
            </div>
        </AppLayout>
    );
}
