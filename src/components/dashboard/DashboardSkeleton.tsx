import React from 'react';

const DashboardSkeleton = React.memo(() => (
    <div className="space-y-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500">
        {/* Skeleton: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-[120px] w-full shadow-sm border border-slate-100 p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent z-10"></div>
                    <div className="flex justify-between items-start">
                        <div className="h-4 bg-slate-200 rounded-md w-1/2 animate-pulse"></div>
                        <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded-md w-2/3 animate-pulse mt-2"></div>
                </div>
            ))}
        </div>

        {/* Skeleton: Content Area (Charts & Map) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Rankings) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
                <div className="bg-white rounded-2xl h-[400px] w-full shadow-sm border border-slate-100 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent"></div>
                    <div className="h-6 bg-slate-200 rounded-md w-1/3 mb-6 animate-pulse"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse shrink-0"></div>
                                <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column (Map/Main Chart) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
                <div className="bg-white rounded-2xl h-[500px] w-full shadow-sm border border-slate-100 p-5 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-100/50 to-transparent"></div>
                    <div className="h-6 bg-slate-200 rounded-md w-1/4 mb-4 animate-pulse"></div>
                    <div className="flex-1 bg-slate-100 rounded-xl w-full animate-pulse"></div>
                </div>
            </div>
        </div>
    </div>
));

export default DashboardSkeleton;