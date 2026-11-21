export default function PulseLogo({ className = 'w-8 h-8' }) {
    return (
        <svg
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Pulse Logo"
        >
            <rect width="36" height="36" rx="10" className="fill-sky-500" />
            <path
                d="M7 19.5H11.5L14.5 11.5L18.5 25L22 15.5L24.5 19.5H29"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
