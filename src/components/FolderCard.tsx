import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Folder as FolderIcon,
    Lock,
    Globe,
    Edit,
    Trash2,
    ChevronRight,
    Image as ImageIcon,
    FolderOpen
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Folder {
    _id: string;
    name: string;
    description: string;
    isPublic: boolean;
    coverImage?: string;
    parentFolder?: string | null;
    createdAt: string;
}

interface FolderCardProps {
    folder: Folder;
    onEdit: (folder: Folder) => void;
    onDelete: (folderId: string) => void;
    onClick: (folder: Folder) => void;
    templateCount?: number;
    subfolderCount?: number;
}

export const FolderCard = ({
    folder,
    onEdit,
    onDelete,
    onClick,
    templateCount = 0,
    subfolderCount = 0
}: FolderCardProps) => {
    const [showActions, setShowActions] = useState(false);
    const { toast } = useToast();

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${folder.name}"? This will also delete all templates and subfolders inside it.`)) {
            return;
        }

        onDelete(folder._id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(folder);
    };

    return (
        <div
            onClick={() => onClick(folder)}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-slate-200 cursor-pointer overflow-hidden"
        >
            {/* Cover Image or Gradient Background */}
            {folder.coverImage ? (
                <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{
                        backgroundImage: `url(${folder.coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50 group-hover:opacity-70 transition-opacity" />
            )}

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${folder.isPublic
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                                : 'bg-gradient-to-br from-purple-600 to-pink-600'
                            }`}>
                            {folder.isPublic ? (
                                <FolderOpen className="h-6 w-6 text-white" />
                            ) : (
                                <Lock className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 text-lg truncate">
                                {folder.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {folder.isPublic ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        Public
                                    </span>
                                ) : (
                                    <span className="text-xs text-purple-600 flex items-center gap-1">
                                        <Lock className="h-3 w-3" />
                                        Private
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">
                                    {templateCount} template{templateCount !== 1 ? 's' : ''}
                                </span>
                                {subfolderCount > 0 && (
                                    <>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-500">
                                            {subfolderCount} folder{subfolderCount !== 1 ? 's' : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                </div>

                {/* Description */}
                {folder.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {folder.description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                        {new Date(folder.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-600 rounded-2xl transition-all pointer-events-none" />
        </div>
    );
};
