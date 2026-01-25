import { useState, useEffect } from 'react';
import { FolderDialog } from '@/components/FolderDialog';
import { PinDialog } from '@/components/PinDialog';
import { FolderCard } from '@/components/FolderCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, FileText, FolderOpen } from 'lucide-react';
import axios from 'axios';
import { Navbar } from '@/components/Navbar';

interface Template {
    _id: string;
    name: string;
    description: string;
    category: string;
    content: string;
    isPublic: boolean;
    folder?: string | null;
    author: {
        name: string;
        username: string;
    };
    createdAt: string;
}

interface Folder {
    _id: string;
    name: string;
    description: string;
    isPublic: boolean;
    pin?: string;
    coverImage?: string;
    parentFolder?: string | null;
    createdAt: string;
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

export default function Folders() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pendingFolder, setPendingFolder] = useState<Folder | null>(null);

    const { isAuthenticated } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (isAuthenticated) {
            fetchFolders();
            fetchTemplates();
        }
    }, [isAuthenticated, currentFolder]);

    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/folders', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Filter folders by current parent
            const filtered = response.data.filter((f: Folder) =>
                currentFolder ? f.parentFolder === currentFolder : !f.parentFolder
            );
            setFolders(filtered);
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast({
                title: 'Error',
                description: 'Failed to load folders. Please check if the server is running.',
                variant: 'destructive',
            });
        }
    };

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/templates/my-templates', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Filter templates by current folder
            const filtered = response.data.filter((t: Template) =>
                currentFolder ? t.folder === currentFolder : false
            );
            setTemplates(filtered);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleFolderClick = (folder: Folder) => {
        if (!folder.isPublic && folder.pin) {
            setPendingFolder(folder);
            setShowPinDialog(true);
        } else {
            navigateToFolder(folder);
        }
    };

    const navigateToFolder = (folder: Folder) => {
        setCurrentFolder(folder._id);
        setBreadcrumbs([...breadcrumbs, { id: folder._id, name: folder.name }]);
    };

    const handlePinSuccess = () => {
        if (pendingFolder) {
            navigateToFolder(pendingFolder);
            setPendingFolder(null);
        }
    };

    const handleBreadcrumbNavigate = (folderId: string | null) => {
        if (folderId === null) {
            setCurrentFolder(null);
            setBreadcrumbs([]);
        } else {
            const index = breadcrumbs.findIndex(b => b.id === folderId);
            if (index !== -1) {
                setCurrentFolder(folderId);
                setBreadcrumbs(breadcrumbs.slice(0, index + 1));
            }
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/folders/${folderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { moveContentsTo: null }
            });
            toast({
                title: 'Success',
                description: 'Folder deleted successfully',
            });
            fetchFolders();
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete folder',
                variant: 'destructive',
            });
        }
    };

    const getTemplateCount = (folderId: string) => {
        return templates.filter(t => t.folder === folderId).length;
    };

    const getSubfolderCount = (folderId: string) => {
        return folders.filter(f => f.parentFolder === folderId).length;
    };

    if (!isAuthenticated) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
                            <p className="text-slate-600">Please log in to access your folders</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <Breadcrumbs path={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                My Folders
                            </h1>
                            <p className="text-slate-600">
                                Organize your templates with folders and subfolders
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setSelectedFolder(null);
                                setShowFolderDialog(true);
                            }}
                            className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold shadow-lg"
                        >
                            <FolderPlus className="h-5 w-5 mr-2" />
                            New Folder
                        </Button>
                    </div>

                    {/* Folders Grid */}
                    {folders.length > 0 ? (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">
                                {currentFolder ? 'Subfolders' : 'All Folders'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {folders.map((folder) => (
                                    <FolderCard
                                        key={folder._id}
                                        folder={folder}
                                        onClick={handleFolderClick}
                                        onEdit={(f) => {
                                            setSelectedFolder(f);
                                            setShowFolderDialog(true);
                                        }}
                                        onDelete={handleDeleteFolder}
                                        templateCount={getTemplateCount(folder._id)}
                                        subfolderCount={getSubfolderCount(folder._id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {currentFolder ? 'No Subfolders' : 'No Folders Yet'}
                            </h3>
                            <p className="text-slate-600 mb-6">
                                {currentFolder
                                    ? 'Create a subfolder to organize your templates'
                                    : 'Create your first folder to start organizing templates'}
                            </p>
                            <Button
                                onClick={() => {
                                    setSelectedFolder(null);
                                    setShowFolderDialog(true);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            >
                                <FolderPlus className="h-5 w-5 mr-2" />
                                Create Folder
                            </Button>
                        </div>
                    )}

                    {/* Templates in Current Folder */}
                    {currentFolder && templates.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Templates in this Folder</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map((template) => (
                                    <div
                                        key={template._id}
                                        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{template.name}</h3>
                                                <p className="text-xs text-slate-500">{template.category}</p>
                                            </div>
                                        </div>
                                        {template.description && (
                                            <p className="text-sm text-slate-600 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Folder Dialog */}
            <FolderDialog
                open={showFolderDialog}
                onClose={() => {
                    setShowFolderDialog(false);
                    setSelectedFolder(null);
                }}
                onSuccess={() => {
                    fetchFolders();
                    setSelectedFolder(null);
                }}
                folder={selectedFolder}
                parentFolderId={currentFolder}
            />

            {/* PIN Dialog */}
            <PinDialog
                open={showPinDialog}
                onClose={() => {
                    setShowPinDialog(false);
                    setPendingFolder(null);
                }}
                folderId={pendingFolder?._id || ''}
                onSuccess={handlePinSuccess}
            />
        </>
    );
}
