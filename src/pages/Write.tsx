import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Save, Send, Tag, FileText } from "lucide-react";

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Write = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const fileInputRef = useRef(null);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      showNotification("Please fill in title and content", "error");
      return;
    }

    const newPost = {
      title: title.trim(),
      content: content.trim(),
      author: "Current User",
      tags,
      coverImage,
    };

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        setTitle("");
        setContent("");
        setTags([]);
        setTagInput("");
        setCoverImage("");
        showNotification("Post published successfully!");
        navigate("/");
      } else {
        showNotification("Failed to publish post", "error");
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      showNotification("Error publishing post", "error");
    }
  };

  const handleSaveDraft = () => {
    showNotification("Draft saved!");
  };

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
                variant="outline"
                onClick={() => navigate("/")}
                className="border-slate-300 hover:bg-slate-50"
              >
                Back
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                BlogPress
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="border-slate-300 hover:bg-slate-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
              >
                <Send className="w-4 h-4 mr-2" />
                Publish Post
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "error" 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Cover Image Section */}
          <div className="border-b border-slate-200 bg-slate-50">
            {coverImage ? (
              <div className="relative h-80 group">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCoverImage("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                    <p className="text-sm text-slate-500 mt-1">
                      Recommended size: 1600 x 840
                    </p>
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
                      reader.onload = (e) => {
                        setCoverImage(e.target?.result as string);
                        setIsUploading(false);
                        showNotification("Cover image uploaded successfully!");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-3 text-sm text-slate-600">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Editor Section */}
          <div className="p-8 space-y-6">
            {/* Title Input */}
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

            {/* Tags Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 text-sm"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Content</Label>
              <Textarea
                id="content"
                placeholder="Tell your story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] text-lg leading-relaxed resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              
              {/* Stats Bar */}
              <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
                <div className="flex items-center space-x-4">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readTime} min read</span>
                </div>
                <div className="text-xs text-slate-400">
                  Auto-saved • Just now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-20"></div>
      </main>
    </div>
  );
};

export default Write;