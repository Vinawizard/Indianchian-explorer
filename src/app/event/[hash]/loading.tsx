export default function EventLoading() {
    /*test*/
    return (
        <div className="min-h-screen bg-black relative py-8 w-full overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
            <div className="max-w-[1280px] w-[90%] mx-auto pb-24 relative z-10">
                <div className="flex gap-3 mb-12">
                    <div className="h-4 w-20 bg-white/10 animate-pulse" />
                    <div className="h-4 w-24 bg-white/10 animate-pulse" />
                    <div className="h-4 w-32 bg-accent/20 animate-pulse" />
                </div>
                <div className="h-6 w-48 bg-white/10 animate-pulse mb-6" />
                <div className="card-premium divide-y divide-white/5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="px-8 py-5 flex gap-8">
                            <div className="h-3 w-32 bg-white/10 animate-pulse" />
                            <div className="h-4 flex-1 max-w-md bg-white/5 animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="mt-16 h-48 bg-white/5 border border-white/10 animate-pulse" />
            </div>
        </div>
    );
}
