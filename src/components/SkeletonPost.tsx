import { Card, CardHeader, CardContent } from "./ui/card";

export const SkeletonPost = () => {
    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm animate-pulse rounded-2xl">
            <div className="h-44 sm:h-48 bg-slate-200" />
            <CardHeader className="p-4 space-y-3">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="flex justify-between items-center">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4 sm:hidden" />
                </div>
            </CardHeader>
        </Card>
    );
};

export const ProfileSkeleton = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonPost key={i} />
            ))}
        </div>
    );
};
