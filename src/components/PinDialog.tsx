import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface PinDialogProps {
    open: boolean;
    onClose: () => void;
    folderId: string;
    onSuccess: () => void;
}

export const PinDialog = ({ open, onClose, folderId, onSuccess }: PinDialogProps) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{4}$/.test(pin)) {
            toast({
                title: 'Error',
                description: 'Please enter a 4-digit PIN',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/folders/${folderId}/verify-pin`,
                { pin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.valid) {
                toast({
                    title: 'Success',
                    description: 'Access granted',
                });
                onSuccess();
                onClose();
                setPin('');
            } else {
                toast({
                    title: 'Error',
                    description: 'Incorrect PIN',
                    variant: 'destructive',
                });
                setPin('');
            }
        } catch (error) {
            console.error('Error verifying PIN:', error);
            toast({
                title: 'Error',
                description: 'Failed to verify PIN',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Lock className="h-6 w-6 text-purple-600" />
                        Enter PIN
                    </DialogTitle>
                    <DialogDescription>
                        This folder is protected. Please enter the 4-digit PIN to access it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            value={pin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setPin(value);
                            }}
                            placeholder="••••"
                            maxLength={4}
                            className="text-center text-3xl tracking-[1em] font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onClose();
                                setPin('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || pin.length !== 4}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        >
                            {loading ? 'Verifying...' : 'Unlock'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
