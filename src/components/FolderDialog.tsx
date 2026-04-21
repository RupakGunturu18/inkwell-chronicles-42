import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FolderPlus, FolderEdit, Lock, Globe, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface FolderData {
    _id?: string;
    name: string;
    description: string;
    isPublic: boolean;
    parentFolder: string | null;
    coverImage?: string;
    pin?: string;
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
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const isEditMode = !!folder?._id;

    useEffect(() => {
        if (!open) return;
        setName(folder?.name || '');
        setDescription(folder?.description || '');
        setIsPublic(folder?.isPublic ?? true);
        setPin(folder?.pin || '');
    }, [folder, open]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setIsPublic(true);
        setPin('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({ title: 'Name required', description: 'Please enter a folder name.', variant: 'destructive' });
            return;
        }

        if (!isPublic && !pin && !isEditMode) {
            toast({ title: 'PIN required', description: 'Private folders need a 4-digit PIN.', variant: 'destructive' });
            return;
        }

        if (!isPublic && pin && !/^\d{4}$/.test(pin)) {
            toast({ title: 'Invalid PIN', description: 'PIN must be exactly 4 digits.', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const folderData = {
                name: name.trim(),
                description: description.trim(),
                isPublic,
                pin: !isPublic && pin ? pin : null,
                parentFolder: parentFolderId || 'root',
            };

            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/folders/${folder._id}`, folderData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast({ title: 'Folder updated' });
            } else {
                await axios.post('http://localhost:5000/api/folders', folderData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast({ title: 'Folder created' });
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving folder:', error);
            toast({ title: 'Something went wrong', description: 'Failed to save folder.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-[92vw] sm:max-w-md rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/60 p-0 gap-0 overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            {isEditMode
                                ? <FolderEdit className="w-4 h-4 text-gray-600" />
                                : <FolderPlus className="w-4 h-4 text-gray-600" />
                            }
                        </div>
                        <div>
                            <DialogTitle className="text-[15px] font-bold text-gray-900 leading-tight">
                                {isEditMode ? 'Edit Folder' : 'New Folder'}
                            </DialogTitle>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                                {isEditMode ? 'Update your folder details' : 'Organize your content into folders'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-5">

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="folder-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Folder Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="folder-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., My Blog Content"
                                className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="folder-description" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Description <span className="text-gray-300 font-normal normal-case tracking-normal">— optional</span>
                            </Label>
                            <Textarea
                                id="folder-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's in this folder?"
                                rows={3}
                                className="resize-none rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>

                        {/* Privacy Toggle */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</Label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(true)}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                        isPublic
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <Globe className={`w-3.5 h-3.5 ${isPublic ? 'text-blue-500' : 'text-gray-300'}`} />
                                    Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(false)}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                        !isPublic
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <Lock className={`w-3.5 h-3.5 ${!isPublic ? 'text-gray-600' : 'text-gray-300'}`} />
                                    Private
                                </button>
                            </div>
                        </div>

                        {/* PIN — only when private */}
                        {!isPublic && (
                            <div className="space-y-1.5">
                                <Label htmlFor="folder-pin" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {isEditMode ? 'PIN (leave blank to keep current)' : 'PIN *'}
                                </Label>
                                <Input
                                    id="folder-pin"
                                    type="text"
                                    inputMode="numeric"
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPin(val);
                                    }}
                                    placeholder="• • • •"
                                    maxLength={4}
                                    className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-center text-lg tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                />
                                {/* PIN dots indicator */}
                                <div className="flex items-center justify-center gap-2 pt-1">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-6 rounded-full transition-all duration-200 ${
                                                i < pin.length ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 text-center">
                                    Anyone viewing this folder will need this PIN
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => { onClose(); resetForm(); }}
                            className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : isEditMode ? 'Save Changes' : 'Create Folder'
                            }
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};