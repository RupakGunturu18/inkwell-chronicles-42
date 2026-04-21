import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Folder, Lock, Globe, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface FolderData {
    _id?: string;
    name: string;
    description: string;
    isPublic: boolean;
    parentFolder: string | null;
    coverImage?: string;
}

interface FolderDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    folder?: FolderData | null;
    parentFolderId?: string | null;
}

export const FolderDialog = ({ open, onClose, onSuccess, folder, parentFolderId }: FolderDialogProps) => {
    const [name, setName] = useState(folder?.name || '');
    const [description, setDescription] = useState(folder?.description || '');
    const [isPublic, setIsPublic] = useState(folder?.isPublic ?? true);
    const [pin, setPin] = useState(folder?.pin || '');
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a folder name',
                variant: 'destructive',
            });
            return;
        }

        const isCreateMode = !folder?._id;

        if (!isPublic && !pin && isCreateMode) {
            toast({
                title: 'Error',
                description: 'PIN is required for private folders',
                variant: 'destructive',
            });
            return;
        }

        if (!isPublic && pin && !/^\d{4}$/.test(pin)) {
            toast({
                title: 'Error',
                description: 'PIN must be exactly 4 digits',
                variant: 'destructive',
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const folderData = {
                name,
                description,
                isPublic,
                pin: !isPublic && pin ? pin : null,
                parentFolder: parentFolderId || 'root',
            };

            if (folder?._id) {
                // Update existing folder
                await axios.put(
                    `http://localhost:5000/api/folders/${folder._id}`,
                    folderData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast({
                    title: 'Success',
                    description: 'Folder updated successfully',
                });
            } else {
                // Create new folder
                await axios.post('http://localhost:5000/api/folders', folderData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast({
                    title: 'Success',
                    description: 'Folder created successfully',
                });
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving folder:', error);
            toast({
                title: 'Error',
                description: 'Failed to save folder',
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setIsPublic(true);
        setPin('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {folder ? 'Edit Folder' : 'Create New Folder'}
                    </DialogTitle>
                    <DialogDescription>
                        Organize your content with folders
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder Name *</Label>
                        <Input
                            id="folder-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My Blog Content"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="folder-description">Description (Optional)</Label>
                        <Textarea
                            id="folder-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this folder"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Privacy Settings</Label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all ${isPublic
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <Globe className={`h-5 w-5 mx-auto mb-1 ${isPublic ? 'text-blue-600' : 'text-slate-400'}`} />
                                <p className={`text-sm font-medium ${isPublic ? 'text-blue-600' : 'text-slate-600'}`}>
                                    Public
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all ${!isPublic
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <Lock className={`h-5 w-5 mx-auto mb-1 ${!isPublic ? 'text-purple-600' : 'text-slate-400'}`} />
                                <p className={`text-sm font-medium ${!isPublic ? 'text-purple-600' : 'text-slate-600'}`}>
                                    Private
                                </p>
                            </button>
                        </div>
                    </div>

                    {!isPublic && (
                        <div className="space-y-2 animate-fade-in">
                                <Label htmlFor="folder-pin">
                                    {folder ? '4-Digit PIN (Leave empty to keep current)' : '4-Digit PIN *'}
                                </Label>
                            <Input
                                id="folder-pin"
                                type="text"
                                value={pin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    setPin(value);
                                }}
                                placeholder="Enter 4-digit PIN"
                                maxLength={4}
                                className="text-center text-lg tracking-widest"
                            />
                            <p className="text-xs text-slate-500">
                                Set a PIN to protect this folder.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onClose();
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                            <Folder className="h-4 w-4 mr-2" />
                            {folder ? 'Update Folder' : 'Create Folder'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
