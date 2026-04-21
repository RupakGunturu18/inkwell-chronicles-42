import { useState, useEffect } from 'react';
import { TemplateEditor } from '@/components/TemplateEditor';
import { FolderDialog } from '@/components/FolderDialog';
import { PinDialog } from '@/components/PinDialog';
import { FolderCard } from '@/components/FolderCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
    Plus,
    Save,
    FileText,
    Trash2,
    Eye,
    Lock,
    Globe,
    FolderPlus,
} from 'lucide-react';
import axios from 'axios';
import { Navbar } from '@/components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    coverImage?: string;
    parentFolder?: string | null;
    createdAt: string;
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

export default function Templates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [myTemplates, setMyTemplates] = useState<Template[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pendingFolder, setPendingFolder] = useState<Folder | null>(null);

    const [editorContent, setEditorContent] = useState('<p>Start writing your template...</p>');
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [templateCategory, setTemplateCategory] = useState('blog');
    const [isPublic, setIsPublic] = useState(false);

    const { isAuthenticated } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchTemplates();
        if (isAuthenticated) {
            fetchMyTemplates();
            fetchFolders();
        }
    }, [isAuthenticated, currentFolder]);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/templates`);
            setTemplates(response.data);
            console.log('Fetched templates:', response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchMyTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/templates/my-templates`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Filter templates by current folder
            const filtered = response.data.filter((t: Template) =>
                currentFolder ? t.folder === currentFolder : !t.folder
            );
            setMyTemplates(filtered);
        } catch (error) {
            console.error('Error fetching my templates:', error);
        }
    };

    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Filter folders by current parent
            const filtered = response.data.filter((f: Folder) =>
                currentFolder ? f.parentFolder === currentFolder : !f.parentFolder
            );
            setFolders(filtered);
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
    };

    const handleFolderClick = (folder: Folder) => {
        if (!folder.isPublic) {
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

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setIsEditing(true);
        setEditorContent('<p>Start writing your template...</p>');
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('blog');
        setIsPublic(false);
        setShowNewDialog(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a template name',
                variant: 'destructive',
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const templateData = {
                name: templateName,
                description: templateDescription,
                category: templateCategory,
                content: editorContent,
                isPublic,
                folder: currentFolder,
            };

            if (selectedTemplate) {
                await axios.put(
                    `${API_BASE_URL}/api/templates/${selectedTemplate._id}`,
                    templateData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast({
                    title: 'Success',
                    description: 'Template updated successfully',
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/templates`, templateData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast({
                    title: 'Success',
                    description: 'Template created successfully',
                });
            }

            setShowNewDialog(false);
            setIsEditing(false);
            fetchTemplates();
            fetchMyTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            toast({
                title: 'Error',
                description: 'Failed to save template',
                variant: 'destructive',
            });
        }
    };

    const handleEditTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setEditorContent(template.content);
        setTemplateName(template.name);
        setTemplateDescription(template.description);
        setTemplateCategory(template.category);
        setIsPublic(template.isPublic);
        setIsEditing(true);
        setShowNewDialog(true);
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/templates/${templateId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast({
                title: 'Success',
                description: 'Template deleted successfully',
            });
            fetchTemplates();
            fetchMyTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete template',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/folders/${folderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { moveContentsTo: null } // Delete all contents
            });
            toast({
                title: 'Success',
                description: 'Folder deleted successfully',
            });
            fetchFolders();
            fetchMyTemplates();
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete folder',
                variant: 'destructive',
            });
        }
    };

    const getTemplatePreviewText = (html: string) => {
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const getTemplatePreviewHtml = (html: string) => {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '');
    };

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
                                {currentFolder ? 'Folder Contents' : 'Templates'}
                            </h1>
                            <p className="text-slate-600">
                                {currentFolder
                                    ? 'Manage templates and subfolders'
                                    : 'Create and organize your writing templates'}
                            </p>
                        </div>
                        {isAuthenticated && (
                            <div className="flex gap-3">
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
                                <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                                    <DialogTrigger asChild>
                                        <Button
                                            onClick={handleCreateNew}
                                            className="rounded-full px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold shadow-lg"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            New Template
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold">
                                                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
                                            </DialogTitle>
                                            <DialogDescription>
                                                Design your template with rich formatting options
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-6 mt-4">
                                            {/* Template Details */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Template Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={templateName}
                                                        onChange={(e) => setTemplateName(e.target.value)}
                                                        placeholder="e.g., Blog Post Template"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="category">Category</Label>
                                                    <Select value={templateCategory} onValueChange={setTemplateCategory}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="blog">Blog</SelectItem>
                                                            <SelectItem value="article">Article</SelectItem>
                                                            <SelectItem value="newsletter">Newsletter</SelectItem>
                                                            <SelectItem value="report">Report</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description (Optional)</Label>
                                                <Input
                                                    id="description"
                                                    value={templateDescription}
                                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                                    placeholder="Brief description of this template"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="public"
                                                    checked={isPublic}
                                                    onChange={(e) => setIsPublic(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300"
                                                />
                                                <Label htmlFor="public" className="cursor-pointer">
                                                    Make this template public
                                                </Label>
                                            </div>

                                            {/* Editor */}
                                            <TemplateEditor content={editorContent} onChange={setEditorContent} />

                                            {/* Actions */}
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowNewDialog(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleSaveTemplate}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Template
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </div>

                    {/* Folders Grid */}
                    {isAuthenticated && folders.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Folders</h2>
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
                                        templateCount={myTemplates.filter(t => t.folder === folder._id).length}
                                        subfolderCount={0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* My Templates */}
                    {isAuthenticated && myTemplates.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">
                                {currentFolder ? 'Templates in this Folder' : 'My Templates'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myTemplates.map((template) => (
                                    <div
                                        key={template._id}
                                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 group overflow-hidden"
                                    >
                                        <div className="p-5 pb-4 border-b border-slate-100">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wide">{template.category}</p>
                                                    </div>
                                                </div>
                                                {template.isPublic ? (
                                                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px] font-medium">
                                                        <Globe className="h-3 w-3" /> Public
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-1 text-[11px] font-medium">
                                                        <Lock className="h-3 w-3" /> Private
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                            <div className="rounded-lg border border-slate-200 bg-white p-3 h-48 overflow-hidden">
                                                <div
                                                    className="prose prose-sm max-w-none text-slate-700 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_p]:text-xs [&_li]:text-xs"
                                                    dangerouslySetInnerHTML={{ __html: getTemplatePreviewHtml(template.content) }}
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                                                {getTemplatePreviewText(template.content)}
                                            </p>
                                        </div>

                                        <div className="p-4 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleEditTemplate(template)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteTemplate(template._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Public Templates */}
                    {!currentFolder && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Public Templates</h2>
                            {templates.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">No public templates available yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {templates.map((template) => (
                                        <div
                                            key={template._id}
                                            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 overflow-hidden"
                                        >
                                            <div className="p-5 pb-4 border-b border-slate-100">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {template.author?.name ? `${template.author.name} · ` : ''}@{template.author?.username || 'unknown'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1">{template.category}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                                <div className="rounded-lg border border-slate-200 bg-white p-3 h-48 overflow-hidden">
                                                    <div
                                                        className="prose prose-sm max-w-none text-slate-700 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_p]:text-xs [&_li]:text-xs"
                                                        dangerouslySetInnerHTML={{ __html: getTemplatePreviewHtml(template.content) }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                                                    {getTemplatePreviewText(template.content)}
                                                </p>
                                            </div>

                                            <div className="p-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => {
                                                    setEditorContent(template.content);
                                                    setTemplateName(`Copy of ${template.name}`);
                                                    setTemplateDescription(template.description);
                                                    setTemplateCategory(template.category);
                                                    setIsPublic(false);
                                                    setSelectedTemplate(null);
                                                    setShowNewDialog(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Use Template
                                            </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
