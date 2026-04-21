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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import {
  Camera, Loader2, Check, X, Edit, Trash2,
  Eye, EyeOff, FileText, Settings, LayoutGrid,
  MoreHorizontal, User, BookOpen, PenLine
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SkeletonPost, ProfileSkeleton } from "@/components/SkeletonPost";
import { compressImage } from "@/lib/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    profileImage: user?.profileImage || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{ _id: string; name: string; isPublic: boolean }>>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [postToMove, setPostToMove] = useState<any | null>(null);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [isMovingPost, setIsMovingPost] = useState(false);

  const fetchUserPosts = async () => {
    setFetchingPosts(true);
    try {
      const posts = await postService.getMyPosts();
      setMyPosts(posts);
    } catch (error: any) {
      console.error("Error fetching my posts:", error);
      if (error.code === "ECONNABORTED") setTimeout(fetchUserPosts, 3000);
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
      if (error.code === "ECONNABORTED") setTimeout(fetchUserDrafts, 3000);
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
      fetchUserPosts();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/folders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setFolders(data);
      }
    } catch (error) {
      console.error("Error fetching folders in profile:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const handleDeletePost = (id: string) => {
    setPendingDeletePostId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeletePost = async () => {
    if (!pendingDeletePostId) return;
    try {
      await postService.deletePost(pendingDeletePostId);
      toast.success("Post deleted");
      fetchUserPosts();
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setShowDeleteDialog(false);
      setPendingDeletePostId(null);
    }
  };

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
      } catch {
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
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.info("New password must differ from current password");
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
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const compressed = await compressImage(e.target?.result as string, 400, 0.5);
          const response = await authService.updateProfile({ profileImage: compressed });
          if (response?.user) {
            updateUser(response.user);
            setProfileData((prev) => ({ ...prev, profileImage: response.user.profileImage || compressed }));
          } else {
            setProfileData((prev) => ({ ...prev, profileImage: compressed }));
          }
          toast.success("Profile image updated!");
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to update profile image");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openMovePostDialog = (item: any) => {
    setPostToMove(item);
    const currentFolderId = typeof item.folder === "object" ? item.folder?._id : item.folder;
    setTargetFolderId(currentFolderId || "");
    setShowMoveDialog(true);
  };

  const handleMovePostToFolder = async () => {
    if (!postToMove?._id) return;

    setIsMovingPost(true);
    try {
      await postService.updatePost(postToMove._id, { folder: targetFolderId || null });
      toast.success("Post moved successfully");
      setShowMoveDialog(false);
      setPostToMove(null);
      setTargetFolderId("");
      fetchUserPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move post");
    } finally {
      setIsMovingPost(false);
    }
  };

  const avatarSeeds = ["Felix", "Aria", "Leo", "Luna", "Milo", "Maya"];
  const selectAvatar = (seed: string) => {
    setProfileData({ ...profileData, profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` });
  };

  /* ─── Post Card ─────────────────────────────────────────────── */
  const PostCard = ({ item, type }: { item: any; type: "post" | "draft" }) => (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      {/* Cover */}
      <div
        className="relative h-44 overflow-hidden cursor-pointer bg-gray-50"
        onClick={() => navigate(`/post/${item._id}`)}
      >
        <img
          src={item.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop"}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          style={{ objectPosition: `50% ${item.coverImagePosition || 50}%` }}
        />
        {type === "draft" && (
          <span className="absolute top-3 left-3 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full">
            Draft
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
            onClick={() => navigate(`/post/${item._id}`)}
          >
            {item.title}
          </h3>

          {/* Dropdown — clean & minimal */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-0.5">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-36 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 bg-white p-1"
            >
              {type === "post" && (
                <DropdownMenuItem
                  onClick={() => navigate(`/post/${item._id}`)}
                  className="flex items-center gap-2 text-[13px] font-medium text-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-400" /> View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => navigate(`/edit/${item._id}`)}
                className="flex items-center gap-2 text-[13px] font-medium text-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
              >
                <Edit className="w-3.5 h-3.5 text-gray-400" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openMovePostDialog(item)}
                className="flex items-center gap-2 text-[13px] font-medium text-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400" /> Send to folder
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              <DropdownMenuItem
                onClick={() => handleDeletePost(item._id)}
                className="flex items-center gap-2 text-[13px] font-medium text-red-500 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-50 focus:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px] text-gray-400 font-medium">{formatDate(item.createdAt)}</span>
          {item.tags?.[0] && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-blue-500 font-medium capitalize">{item.tags[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  /* ─── Input field helper ─────────────────────────────────────── */
  const FieldInput = ({
    id, label, type = "text", value, onChange, placeholder, showToggle, onToggle, show,
  }: any) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type === "password" ? (show ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-10"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Empty State ─────────────────────────────────────────────── */
  const EmptyState = ({ icon: Icon, text, action }: any) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400 font-medium mb-1">{text}</p>
      {action}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fb]">
      <Navbar />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900">Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => setPendingDeletePostId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
              onClick={confirmDeletePost}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Post To Folder</DialogTitle>
            <DialogDescription>
              Choose where this post should appear.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={targetFolderId || "root"} onValueChange={(value) => setTargetFolderId(value === "root" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Unsorted (Root)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder._id} value={folder._id}>
                    {folder.name}{folder.isPublic ? "" : " · private"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancel</Button>
            <Button onClick={handleMovePostToFolder} disabled={isMovingPost}>
              {isMovingPost ? "Moving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 pt-10">

        {/* ── Profile Hero ──────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">

              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white shadow-xl rounded-2xl">
                  <AvatarImage src={profileData.profileImage} alt={user?.name} className="object-cover rounded-2xl" />
                  <AvatarFallback className="rounded-2xl bg-gray-100 text-gray-400">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-colors"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-1 pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{user?.name}</h1>
                <p className="text-sm text-blue-500 font-semibold">@{user?.username}</p>
                {user?.bio && <p className="text-sm text-gray-500 max-w-xl leading-relaxed mt-2">{user.bio}</p>}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 sm:gap-8 pb-1">
                {[
                  { label: "Posts", value: myPosts.length },
                  { label: "Drafts", value: myDrafts.length },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs Section ──────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Tabs
            defaultValue="posts"
            onValueChange={(val) => {
              if (val === "posts" && myPosts.length === 0) fetchUserPosts();
              if (val === "drafts" && myDrafts.length === 0) fetchUserDrafts();
            }}
          >
            {/* Tab Bar */}
            <TabsList className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm mb-8 w-fit gap-0.5">
              {[
                { value: "posts", icon: LayoutGrid, label: "Posts" },
                { value: "drafts", icon: FileText, label: "Drafts" },
                { value: "settings", icon: Settings, label: "Settings" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 rounded-lg px-5 py-2 transition-all
                    data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Posts */}
            <TabsContent value="posts" className="outline-none">
              {fetchingPosts ? (
                <ProfileSkeleton />
              ) : fetchError ? (
                <EmptyState
                  icon={BookOpen}
                  text="Failed to load posts"
                  action={
                    <button onClick={fetchUserPosts} className="mt-2 text-xs text-blue-500 font-semibold hover:underline">
                      Try again
                    </button>
                  }
                />
              ) : myPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myPosts.map((item) => <PostCard key={item._id} item={item} type="post" />)}
                </div>
              ) : (
                <EmptyState
                  icon={PenLine}
                  text="No published stories yet"
                  action={
                    <button onClick={() => navigate("/write")} className="mt-2 text-xs text-blue-500 font-semibold hover:underline">
                      Write your first story →
                    </button>
                  }
                />
              )}
            </TabsContent>

            {/* Drafts */}
            <TabsContent value="drafts" className="outline-none">
              {fetchingDrafts ? (
                <ProfileSkeleton />
              ) : myDrafts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myDrafts.map((item) => <PostCard key={item._id} item={item} type="draft" />)}
                </div>
              ) : (
                <EmptyState icon={FileText} text="Your drafts folder is empty" />
              )}
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Profile Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-7 py-6 border-b border-gray-50">
                    <h2 className="text-base font-bold text-gray-900">Profile Settings</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Manage your public information</p>
                  </div>

                  <div className="px-7 py-6 space-y-5">
                    {/* Avatar picker */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avatar</Label>
                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
                        {avatarSeeds.map((seed) => (
                          <button
                            key={seed}
                            onClick={() => selectAvatar(seed)}
                            className={`h-10 w-10 rounded-xl border-2 transition-all hover:scale-105 ${
                              profileData.profileImage.includes(seed)
                                ? "border-blue-500 shadow-md shadow-blue-100 scale-105"
                                : "border-transparent hover:border-gray-200"
                            }`}
                          >
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} className="rounded-xl" />
                          </button>
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 w-10 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-blue-400 text-gray-300 hover:text-blue-400 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <FieldInput
                      id="name"
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e: any) => setProfileData({ ...profileData, name: e.target.value })}
                    />

                    {/* Username with availability indicator */}
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Username
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) =>
                            setProfileData({ ...profileData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
                          }
                          className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-10"
                        />
                        {profileData.username !== user?.username && profileData.username.length >= 3 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {checkingUsername ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                            ) : usernameAvailable ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={3}
                        placeholder="Tell us your story..."
                        className="resize-none rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>

                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading || (profileData.username !== user?.username && !usernameAvailable)}
                      className="w-full h-11 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-7 py-6 border-b border-gray-50">
                    <h2 className="text-base font-bold text-gray-900">Security</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Update your account password</p>
                  </div>

                  <div className="px-7 py-6 space-y-5">
                    <FieldInput
                      id="current-pass"
                      label="Current Password"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e: any) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      showToggle
                      show={showCurrentPass}
                      onToggle={() => setShowCurrentPass(!showCurrentPass)}
                    />
                    <FieldInput
                      id="new-pass"
                      label="New Password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e: any) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      showToggle
                      show={showNewPass}
                      onToggle={() => setShowNewPass(!showNewPass)}
                    />
                    <FieldInput
                      id="confirm-pass"
                      label="Confirm New Password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e: any) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      showToggle
                      show={showConfirmPass}
                      onToggle={() => setShowConfirmPass(!showConfirmPass)}
                    />

                    {/* Password match indicator */}
                    {passwordData.newPassword && passwordData.confirmPassword && (
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${
                        passwordData.newPassword === passwordData.confirmPassword ? "text-emerald-500" : "text-red-400"
                      }`}>
                        {passwordData.newPassword === passwordData.confirmPassword
                          ? <><Check className="w-3.5 h-3.5" /> Passwords match</>
                          : <><X className="w-3.5 h-3.5" /> Passwords don't match</>
                        }
                      </div>
                    )}

                    <button
                      onClick={handlePasswordChange}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                      className="w-full h-11 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                    </button>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;