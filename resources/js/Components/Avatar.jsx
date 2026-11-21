export default function Avatar({ src, name = 'User', size = 'md', isOnline = false, className = '' }) {
    const sizes = {
        xs: 'w-7 h-7 text-xs',
        sm: 'w-9 h-9 text-xs',
        md: 'w-11 h-11 text-sm',
        lg: 'w-16 h-16 text-lg',
        xl: 'w-28 h-28 text-3xl',
    };

    const initials = (name || 'U')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className={`relative inline-flex shrink-0 ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={`${sizes[size] || sizes.md} rounded-full object-cover bg-zinc-200 dark:bg-zinc-800`}
                    loading="lazy"
                />
            ) : (
                <div
                    className={`${sizes[size] || sizes.md} rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-semibold flex items-center justify-center select-none`}
                >
                    {initials}
                </div>
            )}
            {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
            )}
        </div>
    );
}
