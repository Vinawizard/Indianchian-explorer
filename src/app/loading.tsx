import { HomeDashboardSkeleton } from "@/components/dashboard/home-dashboard-skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 relative">
            <div className="grid-pattern" />
            <section className="mb-12 relative pt-8">
                <div className="relative">
                    <div className="h-16 w-2/3 max-w-xl bg-white/5 animate-pulse mb-4" />
                </div>
            </section>
            <HomeDashboardSkeleton />
        </div>
    );
}
