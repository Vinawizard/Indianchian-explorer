import { Suspense } from "react";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { HomeDashboardSkeleton } from "@/components/dashboard/home-dashboard-skeleton";

export const revalidate = 30;

export default function Home() {
    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 relative">
            <div className="grid-pattern" />

            <section className="mb-12 relative pt-8">
                <div className="absolute -top-20 -left-20 w-96 h-96 glow-blue pointer-events-none opacity-50" />
                <div className="absolute top-10 right-0 w-80 h-80 glow-red pointer-events-none opacity-30" />

                <div className="relative">
                    <h1 className="text-6xl md:text-7xl text-heading mb-4 uppercase">
                        Indian<span className="text-white decoration-2">Chain </span>
                        EXPLORER
                    </h1>
                </div>
            </section>

            <Suspense fallback={<HomeDashboardSkeleton />}>
                <HomeDashboard />
            </Suspense>
        </div>
    );
}
//end;