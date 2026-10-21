export default function Loading() {
    return (
        <div className="shell" aria-busy="true" aria-label="Loading">
            <div className="pt-8 pb-6"><div className="skeleton h-7 w-56" /><div className="skeleton mt-3 h-4 w-96 max-w-full" /></div>
            <div className="panel h-[120px]" />
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="panel h-[420px] xl:col-span-7" /><div className="panel h-[420px] xl:col-span-5" />
            </div>
        </div>
    );
}
