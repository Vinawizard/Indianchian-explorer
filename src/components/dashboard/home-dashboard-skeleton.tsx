export function HomeDashboardSkeleton() {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-28 bg-white/5 border border-white/10 animate-pulse"
                    />
                ))}
            </div>
            <div className="h-64 bg-white/5 border border-white/10 animate-pulse mb-12" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 bg-white/5 border border-white/10 animate-pulse" />
                <div className="h-72 bg-white/5 border border-white/10 animate-pulse" />
            </div>
        </>
    );
}
