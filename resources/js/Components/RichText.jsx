import { Link } from '@inertiajs/react';

export default function RichText({ text, className = '' }) {
    if (!text) return null;

    const tokenRegex = /(https?:\/\/[^\s]+|#[a-zA-Z0-9_]{2,50}|@[a-zA-Z0-9_]{2,30})/g;
    const parts = text.split(tokenRegex);

    return (
        <p className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
            {parts.map((part, idx) => {
                if (/^https?:\/\/[^\s]+$/.test(part)) {
                    return (
                        <a
                            key={idx}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-500 hover:underline"
                        >
                            {part.length > 42 ? part.slice(0, 42) + '…' : part}
                        </a>
                    );
                }

                if (/^#[a-zA-Z0-9_]{2,50}$/.test(part)) {
                    return (
                        <Link
                            key={idx}
                            href={`/explore?q=${encodeURIComponent(part)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-500 hover:underline font-medium"
                        >
                            {part}
                        </Link>
                    );
                }

                if (/^@[a-zA-Z0-9_]{2,30}$/.test(part)) {
                    const username = part.slice(1).toLowerCase();
                    return (
                        <Link
                            key={idx}
                            href={`/@${username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-500 hover:underline font-medium"
                        >
                            {part}
                        </Link>
                    );
                }

                return <span key={idx}>{part}</span>;
            })}
        </p>
    );
}
