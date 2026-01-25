import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Save, Send, Tag, FileText, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { toast } from "react-toastify";
import { compressImage } from "@/lib/utils";

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

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

const Write = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imagePosition, setImagePosition] = useState(50);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load post if editing
  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          const post = await postService.getPostById(id);
          setTitle(post.title);
          setContent(post.content);
          setTags(post.tags || []);
          setCoverImage(post.coverImage || "");
          setImagePosition(post.coverImagePosition || 50);
        } catch (error) {
          console.error("Error fetching post for edit:", error);
          toast.error("Failed to load post for editing");
          navigate("/write");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, navigate]);

  // Track unsaved changes
  useEffect(() => {
    const hasContent = title.trim() || content.trim() || tags.length > 0 || coverImage;
    setHasUnsavedChanges(!!hasContent);
  }, [title, content, tags, coverImage]);

  // Warn before browser closed
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    // Auto-add pending tag
    let currentTags = [...tags];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      currentTags.push(tagInput.trim());
      setTags(currentTags);
      setTagInput("");
    }

    if (!title.trim() && status === 'published') {
      toast.error("Please provide a title");
      return;
    }

    setIsSubmitting(true);
    const postData = {
      title: title.trim() || "Untitled Draft",
      content: content.trim(),
      tags: currentTags,
      coverImage,
      coverImagePosition: imagePosition,
      status
    };

    try {
      if (id) {
        await postService.updatePost(id, postData);
        toast.success(status === 'published' ? "Post updated!" : "Draft updated!");
      } else {
        await postService.createPost(postData);
        toast.success(status === 'published' ? "Post published!" : "Draft saved!");
      }
      setHasUnsavedChanges(false);
      navigate(status === 'published' ? "/" : "/profile");
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full hover:bg-slate-100"
              >
                <ArrowLeft className="h-6 w-6 text-slate-600" />
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                BlogPress
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={isSubmitting}
                className="border-slate-300 hover:bg-slate-50 px-2 sm:px-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">Save Draft</span>
              </Button>
              <Button
                onClick={() => handleSave('published')}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md px-2 sm:px-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{id ? "Update Post" : "Publish"}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Exit Confirmation Modal */}
      <AlertDialog open={showExitModal} onOpenChange={setShowExitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save as draft before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/")}>Discard & Leave</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSave('draft')}>Save Draft & Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Cover Image Section */}
          <div className="border-b border-slate-200 bg-slate-50">
            {coverImage ? (
              <div className="relative h-60 sm:h-80 group">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover transition-all"
                  style={{ objectPosition: `50% ${imagePosition}%` }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                  <div className="bg-white/90 p-4 rounded-lg shadow-xl w-64 space-y-2">
                    <Label className="text-xs font-semibold flex items-center gap-2">
                      <Upload className="w-3 h-3 text-slate-500" />
                      Adjust View (Crop)
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={imagePosition}
                      onChange={(e) => setImagePosition(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCoverImage("")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="h-80 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-700">Add a cover image</p>
                    <p className="text-sm text-slate-500 mt-1">Recommended size: 1600 x 840</p>
                  </div>
                  <Button variant="outline" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        const compressed = await compressImage(e.target?.result as string);
                        setCoverImage(compressed);
                        setIsUploading(false);
                        toast.success("Cover image uploaded!");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">Post Title</Label>
              <Textarea
                id="title"
                placeholder="Write your post title here..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-3xl md:text-4xl font-bold border-none shadow-none px-0 py-4 focus-visible:ring-0 bg-transparent placeholder:text-xl placeholder:text-muted-foreground/50 resize-none overflow-hidden min-h-0"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <div className="h-px bg-border"></div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag (Press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 h-10"
                />
                <Button onClick={addTag} variant="outline" className="h-10">Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 text-sm"
                    >
                      {tag}
                      <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Content</Label>
              <Textarea
                id="content"
                placeholder="Tell your story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] text-lg leading-relaxed resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
                <div className="flex items-center space-x-4">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readTime} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-20"></div>
      </main>
    </div>
  );
};

export default Write;