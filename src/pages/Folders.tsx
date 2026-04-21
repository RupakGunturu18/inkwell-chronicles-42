import { useState, useEffect } from 'react';
import { FolderDialog } from '@/components/FolderDialog';
import { PinDialog } from '@/components/PinDialog';
import { FolderCard } from '@/components/FolderCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, FolderOpen, FileText, CalendarDays, ChevronRight, Lock, ArrowRightLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '@/components/Navbar';

interface Folder {
    _id: string;
    name: string;
    description: string;
    isPublic: boolean;
    coverImage?: string;
    parentFolder: string | null;
    createdAt: string;
}

interface BlogPost {
    _id: string;
    title: string;
    createdAt: string;
    coverImage?: string;
    coverImagePosition?: number;
    tags?: string[];
    folder?: Folder | null;
}

interface Breadcrumb {
    id: string | null;
    name: string;
}

export default function Folders() {
    const location = useLocation();
    const navigate = useNavigate();
    const [allFolders, setAllFolders] = useState<Folder[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pendingFolder, setPendingFolder] = useState<Folder | null>(null);
    const [showMovePostDialog, setShowMovePostDialog] = useState(false);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [targetFolderId, setTargetFolderId] = useState('');
    const [movingPost, setMovingPost] = useState(false);

    const { isAuthenticated } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        const loadView = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!currentFolder) {
                    const [foldersResponse, postsResponse] = await Promise.all([
                        axios.get('http://localhost:5000/api/folders', {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                        axios.get('http://localhost:5000/api/posts/my-posts', {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                    ]);

                    if (cancelled) {
                        return;
                    }

                    setAllFolders(foldersResponse.data);
                    setFolders(foldersResponse.data.filter((f: Folder) => !f.parentFolder));
                    setPosts(
                        postsResponse.data.filter((post: BlogPost) => {
                            const folderId = typeof post.folder === 'object' ? post.folder?._id : post.folder;
                            return !folderId;
                        })
                    );
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/folders/${currentFolder}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (cancelled) {
                    return;
                }

                setPosts(response.data.posts || []);
                setFolders(response.data.subfolders || []);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error('Error fetching folder view:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load folder contents. Please check if the server is running.',
                    variant: 'destructive',
                });
                setPosts([]);
                setFolders([]);
            }
        };

        loadView();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, currentFolder]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const folderFromQuery = new URLSearchParams(location.search).get('folder');
        if (!folderFromQuery) {
            return;
        }

        const loadFolderFromQuery = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/folders', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const folderList = response.data as Folder[];
                setAllFolders(folderList);

                const targetFolder = folderList.find((folder) => folder._id === folderFromQuery);
                if (!targetFolder) {
                    return;
                }

                setBreadcrumbs([{ id: targetFolder._id, name: targetFolder.name }]);

                if (!targetFolder.isPublic) {
                    setPendingFolder(targetFolder);
                    setShowPinDialog(true);
                    return;
                }

                setCurrentFolder(targetFolder._id);
            } catch (error) {
                console.error('Error resolving folder from URL:', error);
            }
        };

        loadFolderFromQuery();
    }, [isAuthenticated, location.search]);

    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/folders', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllFolders(response.data);
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

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/posts/my-posts', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const filtered = response.data.filter((post: BlogPost) => {
                const folderId = typeof post.folder === 'object' ? post.folder?._id : post.folder;
                return currentFolder ? folderId === currentFolder : !folderId;
            });
            setPosts(filtered);
        } catch (error) {
            console.error('Error fetching posts:', error);
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
        setBreadcrumbs((prev) => {
            const existingIndex = prev.findIndex((crumb) => crumb.id === folder._id);
            if (existingIndex !== -1) {
                return prev.slice(0, existingIndex + 1);
            }

            return [...prev, { id: folder._id, name: folder.name }];
        });
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
            toast({ title: 'Success', description: 'Folder deleted successfully' });
            fetchFolders();
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast({ title: 'Error', description: 'Failed to delete folder', variant: 'destructive' });
        }
    };

    const openMovePostDialog = (post: BlogPost) => {
        setSelectedPost(post);
        const currentPostFolderId = typeof post.folder === 'object' ? post.folder?._id : post.folder;
        setTargetFolderId(currentPostFolderId || '');
        setShowMovePostDialog(true);
    };

    const handleMovePost = async () => {
        if (!selectedPost) {
            return;
        }

        try {
            setMovingPost(true);
            await axios.put(
                `http://localhost:5000/api/posts/${selectedPost._id}`,
                { folder: targetFolderId || null },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            toast({
                title: 'Success',
                description: 'Blog moved to the selected folder',
            });
            setShowMovePostDialog(false);
            setSelectedPost(null);
            setTargetFolderId('');
            fetchFolders();
            fetchPosts();
        } catch (error) {
            console.error('Error moving post:', error);
            toast({
                title: 'Error',
                description: 'Failed to move blog to folder',
                variant: 'destructive',
            });
        } finally {
            setMovingPost(false);
        }
    };

    const getSubfolderCount = (folderId: string) => {
        return folders.filter(f => f.parentFolder === folderId).length;
    };

    if (!isAuthenticated) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-white pt-20">
                    <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                            style={{ background: '#F3F4F6' }}
                        >
                            <FolderOpen className="h-8 w-8" style={{ color: '#9CA3AF' }} />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Authentication Required</h2>
                        <p className="text-gray-500 text-base">Please log in to access your workspace folders.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

                .folders-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #FFFFFF;
                    min-height: 100vh;
                }

                .page-header {
                    border-bottom: 1px solid #E5E7EB;
                    background: #FFFFFF;
                }

                .section-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #6B7280;
                    margin-bottom: 12px;
                }

                .folder-tile {
                    background: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
                    position: relative;
                    overflow: hidden;
                }

                .folder-tile:hover {
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    border-color: #D1D5DB;
                    transform: translateY(-1px);
                }

                .folder-tile-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 14px;
                    flex-shrink: 0;
                }

                .folder-tile-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #111827;
                    letter-spacing: -0.01em;
                    margin-bottom: 4px;
                    line-clamp: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .folder-tile-desc {
                    font-size: 13px;
                    color: #6B7280;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    min-height: 38px;
                }

                .folder-tile-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 14px;
                    padding-top: 14px;
                    border-top: 1px solid #F3F4F6;
                }

                .meta-badge {
                    font-size: 12px;
                    color: #9CA3AF;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 500;
                }

                .private-badge {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: #9CA3AF;
                    background: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    padding: 3px 8px;
                    border-radius: 6px;
                }

                .folder-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 6px;
                    color: #9CA3AF;
                    transition: background 0.15s, color 0.15s;
                    font-size: 12px;
                    font-weight: 500;
                }

                .folder-action-btn:hover {
                    background: #F3F4F6;
                    color: #374151;
                }

                .post-card {
                    background: #FFFFFF;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                }

                .post-card:hover {
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    border-color: #D1D5DB;
                    transform: translateY(-1px);
                }

                .post-card-img {
                    height: 160px;
                    background: #F9FAFB;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .post-card-body {
                    padding: 18px 20px 20px;
                    flex: 1;
                }

                .post-card-date {
                    font-size: 12px;
                    color: #9CA3AF;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .post-card-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #111827;
                    line-height: 1.45;
                    margin-bottom: 12px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    letter-spacing: -0.01em;
                }

                .tag-chip {
                    font-size: 11.5px;
                    font-weight: 500;
                    color: #374151;
                    background: #F3F4F6;
                    border: 1px solid #E5E7EB;
                    padding: 3px 10px;
                    border-radius: 20px;
                }

                .empty-state {
                    background: #FAFAFA;
                    border: 1px dashed #D1D5DB;
                    border-radius: 14px;
                    padding: 48px 24px;
                    text-align: center;
                }

                .new-folder-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #111827;
                    color: #FFFFFF;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    letter-spacing: -0.01em;
                    font-family: 'DM Sans', sans-serif;
                }

                .new-folder-btn:hover {
                    background: #1F2937;
                }

                .breadcrumb-bar {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 0 0;
                    flex-wrap: wrap;
                }

                .breadcrumb-item {
                    font-size: 13.5px;
                    font-weight: 500;
                    color: #6B7280;
                    cursor: pointer;
                    padding: 2px 6px;
                    border-radius: 4px;
                    transition: background 0.12s, color 0.12s;
                }

                .breadcrumb-item:hover {
                    background: #F3F4F6;
                    color: #111827;
                }

                .breadcrumb-item.active {
                    color: #111827;
                    font-weight: 600;
                    cursor: default;
                }

                .breadcrumb-item.active:hover {
                    background: none;
                }

                .divider {
                    border: none;
                    border-top: 1px solid #E5E7EB;
                    margin: 40px 0;
                }

                .folder-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                @media (max-width: 640px) {
                    .folder-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="folders-root pt-20">
                {/* Page Header */}
                <div className="page-header">
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 28px' }}>
                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <div className="breadcrumb-bar" style={{ marginBottom: 20 }}>
                                <span
                                    className="breadcrumb-item"
                                    onClick={() => handleBreadcrumbNavigate(null)}
                                >
                                    My Folders
                                </span>
                                {breadcrumbs.map((crumb, idx) => (
                                    <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ChevronRight size={14} color="#D1D5DB" />
                                        <span
                                            className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                                            onClick={() => idx < breadcrumbs.length - 1 ? handleBreadcrumbNavigate(crumb.id) : undefined}
                                        >
                                            {crumb.name}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                                <p className="section-label" style={{ marginBottom: 6 }}>Workspace</p>
                                <h1
                                    style={{
                                        fontFamily: "'Instrument Serif', serif",
                                        fontSize: 34,
                                        fontWeight: 400,
                                        color: '#0F172A',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1,
                                        margin: 0,
                                    }}
                                >
                                    {breadcrumbs.length > 0
                                        ? breadcrumbs[breadcrumbs.length - 1].name
                                        : 'My Folders'}
                                </h1>
                                <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6, fontWeight: 400 }}>
                                    {breadcrumbs.length > 0
                                        ? 'Viewing folder contents and subfolders'
                                        : `${folders.length} folder${folders.length !== 1 ? 's' : ''} · ${posts.length} post${posts.length !== 1 ? 's' : ''}`}
                                </p>
                            </div>

                            <button
                                className="new-folder-btn"
                                onClick={() => {
                                    setSelectedFolder(null);
                                    setShowFolderDialog(true);
                                }}
                            >
                                <FolderPlus size={16} />
                                New Folder
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

                    {/* Folders Section */}
                    <section>
                        <p className="section-label">
                            {currentFolder ? 'Subfolders' : 'Folders'}
                        </p>

                        {folders.length > 0 ? (
                            <div className="folder-grid">
                                {folders.map((folder) => (
                                    <div
                                        key={folder._id}
                                        className="folder-tile"
                                        onClick={() => handleFolderClick(folder)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div
                                                className="folder-tile-icon"
                                                style={{ background: folder.isPublic ? '#EFF6FF' : '#F9FAFB' }}
                                            >
                                                <FolderOpen
                                                    size={20}
                                                    color={folder.isPublic ? '#3B82F6' : '#6B7280'}
                                                    strokeWidth={1.8}
                                                />
                                            </div>

                                            {/* Action buttons */}
                                            <div
                                                style={{ display: 'flex', gap: 2 }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <button
                                                    className="folder-action-btn"
                                                    onClick={() => {
                                                        setSelectedFolder(folder);
                                                        setShowFolderDialog(true);
                                                    }}
                                                    title="Edit"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="folder-action-btn"
                                                    style={{ color: '#EF4444' }}
                                                    onClick={() => handleDeleteFolder(folder._id)}
                                                    title="Delete"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        <div className="folder-tile-name">{folder.name}</div>
                                        <div className="folder-tile-desc">
                                            {folder.description || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>No description</span>}
                                        </div>

                                        <div className="folder-tile-meta">
                                            <span className="meta-badge">
                                                <FolderOpen size={12} />
                                                {getSubfolderCount(folder._id)} subfolder{getSubfolderCount(folder._id) !== 1 ? 's' : ''}
                                            </span>
                                            <span className="meta-badge">
                                                <CalendarDays size={12} />
                                                {new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            {!folder.isPublic && (
                                                <span className="private-badge">
                                                    <Lock size={9} />
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: '#F3F4F6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px',
                                    }}
                                >
                                    <FolderOpen size={22} color="#9CA3AF" strokeWidth={1.6} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                    {currentFolder ? 'No subfolders' : 'No folders yet'}
                                </h3>
                                <p style={{ fontSize: 13.5, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.6 }}>
                                    {currentFolder
                                        ? 'Create a subfolder to further organise this section.'
                                        : 'Start organising your content by creating your first folder.'}
                                </p>
                                <button
                                    className="new-folder-btn"
                                    style={{ display: 'inline-flex', margin: '0 auto' }}
                                    onClick={() => {
                                        setSelectedFolder(null);
                                        setShowFolderDialog(true);
                                    }}
                                >
                                    <FolderPlus size={15} />
                                    Create Folder
                                </button>
                            </div>
                        )}
                    </section>

                    <hr className="divider" />

                    {/* Posts Section */}
                    <section>
                        <p className="section-label">
                            {currentFolder ? 'Posts in this folder' : 'Unsorted Posts'}
                        </p>

                        {posts.length > 0 ? (
                            <div className="folder-grid">
                                {posts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="post-card"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                    >
                                        <div className="post-card-img">
                                            {post.coverImage ? (
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        objectPosition: `50% ${post.coverImagePosition || 50}%`,
                                                        transition: 'transform 0.4s ease',
                                                    }}
                                                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                                                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: '#F9FAFB',
                                                    }}
                                                >
                                                    <FileText size={28} color="#D1D5DB" strokeWidth={1.4} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="post-card-body">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                                                <div className="post-card-date" style={{ marginBottom: 0 }}>
                                                    <CalendarDays size={12} />
                                                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                                <button
                                                    className="folder-action-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openMovePostDialog(post);
                                                    }}
                                                    title="Move to folder"
                                                >
                                                    <ArrowRightLeft size={13} />
                                                </button>
                                            </div>
                                            <div className="post-card-title">{post.title}</div>
                                            {post.tags && post.tags.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {post.tags.slice(0, 3).map((tag) => (
                                                        <span key={tag} className="tag-chip">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: '#F3F4F6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px',
                                    }}
                                >
                                    <FileText size={22} color="#9CA3AF" strokeWidth={1.6} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                    {currentFolder ? 'No posts in this folder' : 'No unsorted posts'}
                                </h3>
                                <p style={{ fontSize: 13.5, color: '#9CA3AF', lineHeight: 1.6 }}>
                                    {currentFolder
                                        ? 'Posts added to this folder will appear here.'
                                        : 'All your posts are neatly organised into folders.'}
                                </p>
                            </div>
                        )}
                    </section>

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

            <Dialog open={showMovePostDialog} onOpenChange={setShowMovePostDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Move blog to folder</DialogTitle>
                        <DialogDescription>
                            Choose a folder for this blog. Select root if you want to remove it from a folder.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <Select value={targetFolderId || 'root'} onValueChange={(value) => setTargetFolderId(value === 'root' ? '' : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">Root</SelectItem>
                                {allFolders.map((folder) => (
                                    <SelectItem key={folder._id} value={folder._id}>
                                        {folder.name}
                                        {!folder.isPublic ? ' · private' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMovePostDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMovePost} disabled={movingPost}>
                            {movingPost ? 'Moving...' : 'Move Blog'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}