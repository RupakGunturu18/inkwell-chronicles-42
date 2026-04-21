import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { postService } from "@/services/postService";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { Camera, Loader2, Check, X, Edit, Trash2, Eye, EyeOff, FileText, Settings, LayoutGrid, MoreHorizontal, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SkeletonPost, ProfileSkeleton } from "@/components/SkeletonPost";
import { compressImage } from "@/lib/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myDrafts, setMyDrafts] = useState<any[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [fetchingDrafts, setFetchingDrafts] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    profileImage: user?.profileImage || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Password visibility states
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(null);

  useEffect(() => {
    // Moved fetch calls to separate tab-aware functions
  }, [user]);

  const fetchUserPosts = async () => {
    setFetchingPosts(true);
    try {
      const posts = await postService.getMyPosts();
      setMyPosts(posts);
    } catch (error: any) {
      console.error("Error fetching my posts:", error);
      if (error.code === 'ECONNABORTED') {
        setTimeout(fetchUserPosts, 3000); // Retry after 3s
      }
    } finally {
      setFetchingPosts(false);
    }
  };

  const fetchUserDrafts = async () => {
    setFetchingDrafts(true);
    try {
      const drafts = await postService.getUserDrafts();
      setMyDrafts(drafts);
    } catch (error: any) {
      console.error("Error fetching drafts:", error);
      if (error.code === 'ECONNABORTED') {
        setTimeout(fetchUserDrafts, 3000); // Retry after 3s
      }
    } finally {
      setFetchingDrafts(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        username: user.username,
        bio: user.bio || "",
        profileImage: user.profileImage || "",
      });
      fetchUserPosts(); // Only fetch posts by default
    }
  }, [user]);

  const handleDeletePost = async (id: string) => {
    setPendingDeletePostId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeletePost = async () => {
    if (!pendingDeletePostId) {
      return;
    }

    try {
      await postService.deletePost(pendingDeletePostId);
      toast.success("Post deleted");
      fetchUserPosts(); // Refresh active view
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setShowDeleteDialog(false);
      setPendingDeletePostId(null);
    }
  };

  // Check username availability when it changes
  useEffect(() => {
    if (profileData.username === user?.username || profileData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const available = await authService.checkUsername(profileData.username);
        setUsernameAvailable(available);
      } catch (error) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [profileData.username, user?.username]);

  const handleProfileUpdate = async () => {
    if (profileData.username !== user?.username && !usernameAvailable) {
      toast.error("Please choose an available username");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.user);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.info("Your new password cannot be the same as your current password");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const PostGrid = ({ items, type }: { items: any[], type: 'post' | 'draft' }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {items.map((item) => (
        <Card key={item._id} className="overflow-hidden group border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98] duration-200 rounded-2xl relative">
          <div
            className="relative aspect-[3/2] overflow-hidden cursor-pointer"
            onClick={() => navigate(`/post/${item._id}`)}
          >
            <img
              src={item.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=333&fit=crop"}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: `50% ${item.coverImagePosition || 50}%` }}
            />
          </div>
          <CardHeader className="p-4 bg-white relative">
            <div className="flex justify-between items-start">
              <CardTitle
                className="text-lg font-bold line-clamp-2 text-slate-900 pr-8 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigate(`/post/${item._id}`)}
              >
                {item.title}
              </CardTitle>
              <div className="absolute top-4 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    {type === 'post' && (
                      <DropdownMenuItem onClick={() => navigate(`/post/${item._id}`)} className="cursor-pointer">
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate(`/edit/${item._id}`)} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeletePost(item._id)} className="cursor-pointer text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                {formatDate(item.createdAt)} • {item.tags?.[0] || (type === 'draft' ? 'Draft' : 'Article')}
              </p>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  const avatarSeeds = ["Felix", "Aria", "Leo", "Luna", "Milo", "Maya"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const compressed = await compressImage(e.target?.result as string, 400, 0.5);
        setProfileData({ ...profileData, profileImage: compressed });
        setIsUploading(false);
        toast.success("Image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAvatar = (seed: string) => {
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setProfileData({ ...profileData, profileImage: url });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingDeletePostId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDeletePost}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1">
        {/* Profile Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
              <div className="relative group">
                <Avatar className="h-32 w-32 md:h-44 md:w-44 border-4 md:border-8 border-slate-50 shadow-2xl transition-transform group-hover:scale-105 duration-300 aspect-square overflow-hidden rounded-full">
                  <AvatarImage src={profileData.profileImage} alt={user?.name} className="object-cover w-full h-full" />
                  <AvatarFallback className="rounded-full bg-slate-100 text-slate-600">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 h-10 w-10 md:h-12 md:w-12 border-4 border-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{user?.name}</h1>
                  <p className="text-xl text-blue-600 font-bold tracking-tight">@{user?.username}</p>
                  {user?.bio && <p className="text-slate-600 mt-6 max-w-2xl text-lg leading-relaxed font-medium">{user.bio}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="posts" className="w-full" onValueChange={(val) => {
            if (val === 'posts' && myPosts.length === 0) fetchUserPosts();
            if (val === 'drafts' && myDrafts.length === 0) fetchUserDrafts();
          }}>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-hide">
              <TabsList className="flex w-max md:w-full max-w-2xl lg:max-w-2xl bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 mb-8 md:mb-12">
                <TabsTrigger value="posts" className="flex-1 whitespace-nowrap rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all py-3 px-6 sm:px-10">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  My Posts ({myPosts.length})
                </TabsTrigger>
                <TabsTrigger value="drafts" className="flex-1 whitespace-nowrap rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all py-3 px-6 sm:px-10">
                  <FileText className="w-4 h-4 mr-2" />
                  Drafts ({myDrafts.length})
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 whitespace-nowrap rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all py-3 px-6 sm:px-10">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="posts" className="animate-fade-in outline-none">
              {fetchingPosts ? (
                <ProfileSkeleton />
              ) : fetchError ? (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-red-50 border-dashed">
                  <p className="text-red-400 text-xl font-medium mb-4">Failed to load posts.</p>
                  <Button variant="outline" onClick={fetchUserPosts} className="rounded-xl">Try Again</Button>
                </div>
              ) : myPosts.length > 0 ? (
                <PostGrid items={myPosts} type="post" />
              ) : (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-xl font-medium">No published stories yet.</p>
                  <Button variant="link" onClick={() => navigate('/write')} className="text-blue-600 font-black text-lg mt-2 p-0 h-auto">Write your first story</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="animate-fade-in outline-none">
              {fetchingDrafts ? (
                <ProfileSkeleton />
              ) : myDrafts.length > 0 ? (
                <PostGrid items={myDrafts} type="draft" />
              ) : (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-xl font-medium">Your drafts folder is empty.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Profile Information */}
                <Card className="shadow-lg border-none rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Profile Settings</CardTitle>
                    <p className="text-slate-500 font-medium">Change how you appear on Inkwell</p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Profile Image</Label>
                        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl">
                          {avatarSeeds.map((seed) => (
                            <button
                              key={seed}
                              onClick={() => selectAvatar(seed)}
                              className={`h-12 w-12 rounded-full border-2 transition-all hover:scale-110 ${profileData.profileImage.includes(seed) ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'
                                }`}
                            >
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} className="rounded-full" />
                            </button>
                          ))}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 w-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-600 transition-all text-slate-400"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="perf-name" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Full Name</Label>
                        <Input
                          id="perf-name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="h-14 rounded-xl border-slate-200 focus:ring-blue-500 text-lg font-medium"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="perf-username" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Username</Label>
                        <div className="relative">
                          <Input
                            id="perf-username"
                            value={profileData.username}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                            className="h-14 rounded-xl border-slate-200 focus:ring-blue-500 text-lg font-medium pr-12"
                          />
                          {profileData.username !== user?.username && profileData.username.length >= 3 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {checkingUsername ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                              ) : usernameAvailable ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <X className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="perf-bio" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Bio</Label>
                        <Textarea
                          id="perf-bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={4}
                          className="resize-none rounded-xl border-slate-200 focus:ring-blue-500 text-lg"
                          placeholder="Tell us your story..."
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleProfileUpdate}
                      disabled={loading || (profileData.username !== user?.username && !usernameAvailable)}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-all"
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="shadow-lg border-none rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                    <CardTitle className="text-2xl font-black text-slate-900">Security Settings</CardTitle>
                    <p className="text-slate-500 font-medium">Protect your account with a strong password</p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="current-pass" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-pass"
                          type={showCurrentPass ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="h-14 rounded-xl border-slate-200 focus:ring-blue-500 pr-12"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="new-pass" className="text-sm font-bold text-slate-700 uppercase tracking-widest">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-pass"
                          type={showNewPass ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="h-14 rounded-xl border-slate-200 focus:ring-blue-500 pr-12"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="confirm-pass" className="text-sm font-bold text-slate-700 uppercase tracking-widest">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-pass"
                          type={showConfirmPass ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="h-14 rounded-xl border-slate-200 focus:ring-blue-500 pr-12"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                      className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-lg font-bold transition-all mt-4"
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
