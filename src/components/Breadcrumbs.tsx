import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
    id: string | null;
    name: string;
}

interface BreadcrumbsProps {
    path: Breadcrumb[];
    onNavigate: (folderId: string | null) => void;
}

export const Breadcrumbs = ({ path, onNavigate }: BreadcrumbsProps) => {
    return (
        <div className="flex items-center gap-2 text-sm mb-6">
            <button
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
            >
                <Home className="h-4 w-4" />
                <span className="font-medium">Folders</span>
            </button>

            {path.map((item, index) => (
                <div key={item.id || 'root'} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <button
                        onClick={() => onNavigate(item.id)}
                        className={`font-medium transition-colors ${index === path.length - 1
                                ? 'text-blue-600'
                                : 'text-slate-600 hover:text-blue-600'
                            }`}
                    >
                        {item.name}
                    </button>
                </div>
            ))}
        </div>
    );
};
