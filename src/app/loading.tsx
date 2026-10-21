export default function Loading() {
    return (
        <div className="page" aria-busy="true" aria-label="Loading">
            <div className="mt-8 h-[260px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.02]" />
            <div className="mt-8 h-[170px] animate-pulse border border-white/10 bg-white/[0.02]" />
        </div>
    );
}
