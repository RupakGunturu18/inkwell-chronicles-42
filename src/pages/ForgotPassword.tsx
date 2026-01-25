import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setEmailSent(true);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            BlogSpace
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
                    <p className="text-muted-foreground">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl p-8 shadow-card space-y-6">
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                                <p className="text-sm text-muted-foreground">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
