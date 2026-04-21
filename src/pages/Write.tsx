import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload, X, Save, Send, Tag, FileText,
  Loader2, ArrowLeft, Bold, Italic, Underline,
  Heading1, Heading2, List, Link2, Image, Quote, Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { toast } from "react-toastify";
import { compressImage } from "@/lib/utils";
import { TemplateEditor } from "@/components/TemplateEditor";
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

interface TemplateOption {
  _id: string;
  name: string;
  content: string;
  category: string;
  source: "public" | "mine";
}

interface TemplateApiItem {
  _id: string;
  name: string;
  content?: string;
  category?: string;
}

interface ApiErrorPayload {
  response?: { data?: { message?: string } };
  message?: string;
}

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

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [autoSaved, setAutoSaved] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError("");
      const token = localStorage.getItem("token");

      const normalize = (payload: unknown, source: "public" | "mine"): TemplateOption[] => {
        if (!Array.isArray(payload)) return [];
        return payload
          .filter((t): t is TemplateApiItem => {
            const m = t as Partial<TemplateApiItem>;
            return typeof m._id === "string" && typeof m.name === "string";
          })
          .map((t) => ({
            _id: t._id,
            name: t.name,
            content: t.content || "",
            category: t.category || "other",
            source,
          }));
      };

      try {
        const [publicRes, myRes] = await Promise.allSettled([
          fetch("http://localhost:5000/api/templates"),
          fetch("http://localhost:5000/api/templates/my-templates", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        const normalized: TemplateOption[] = [];
        if (publicRes.status === "fulfilled" && publicRes.value.ok)
          normalized.push(...normalize(await publicRes.value.json(), "public"));
        if (myRes.status === "fulfilled" && myRes.value.ok)
          normalized.push(...normalize(await myRes.value.json(), "mine"));

        const deduped = Array.from(
          normalized.reduce((map, t) => {
            const ex = map.get(t._id);
            if (!ex || (ex.source === "public" && t.source === "mine")) map.set(t._id, t);
            return map;
          }, new Map<string, TemplateOption>()).values()
        ).sort((a, b) => {
          if (a.source !== b.source) return a.source === "mine" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        setTemplates(deduped);
        if (!deduped.length) setTemplatesError("No templates available yet.");
      } catch {
        setTemplatesError("Could not load templates.");
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const plain = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    setHasUnsavedChanges(
      title.trim().length > 0 || plain.length > 0 || tags.length > 0 || !!coverImage
    );
    setAutoSaved(false);
  }, [title, content, tags, coverImage]);

  useEffect(() => {
    const handle = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [hasUnsavedChanges]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = async (status: "draft" | "published") => {
    const currentTags = [...tags];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      currentTags.push(tagInput.trim());
      setTags(currentTags);
      setTagInput("");
    }
    if (!title.trim() && status === "published") {
      toast.error("Please add a title before publishing");
      return;
    }
    setIsSubmitting(true);
    const postData = {
      title: title.trim() || "Untitled Draft",
      content: content.trim(),
      tags: currentTags,
      coverImage,
      coverImagePosition: imagePosition,
      status,
    };
    try {
      if (id) {
        await postService.updatePost(id, postData);
        toast.success(status === "published" ? "Post updated!" : "Draft updated!");
      } else {
        await postService.createPost(postData);
        toast.success(status === "published" ? "Post published!" : "Draft saved!");
      }
      setHasUnsavedChanges(false);
      setAutoSaved(true);
      navigate(status === "published" ? "/" : "/profile");
    } catch (error) {
      const apiError = error as ApiErrorPayload;
      toast.error(apiError.response?.data?.message || apiError.message || "Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackOrHome = () => navigate("/");
  const handleBack = () => {
    if (hasUnsavedChanges) { setShowExitModal(true); return; }
    goBackOrHome();
  };

  const getReadableDate = () =>
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const personalizeContent = (raw: string) => {
    const name = user?.name?.trim() || user?.username?.trim() || "Author";
    const bio = user?.bio?.trim() || "Add your short bio here.";
    return raw
      .replace(/\[Date\]/gi, getReadableDate())
      .replace(/\[Author Name\]/gi, name)
      .replace(/\[Your bio here\]/gi, bio)
      .replace(/\[Author\]/gi, name)
      .replace(/\[Reviewer Name\]/gi, name)
      .replace(/\[Interviewer\]/gi, name);
  };

  const handleTemplateApply = (templateId: string) => {
    const tpl = templates.find((t) => t._id === templateId);
    if (!tpl || id) return;
    if (content.trim().length > 0 && content.trim() !== tpl.content.trim()) {
      if (!window.confirm("This will replace your current content. Continue?")) return;
    }
    setContent(personalizeContent(tpl.content));
    if (!title.trim()) setTitle(tpl.name.replace(/\s+Template$/i, ""));
    setSelectedTemplateId(templateId);
    toast.success(`Applied: ${tpl.name}`);
  };

  const handleImageFile = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target?.result as string);
      setCoverImage(compressed);
      setIsUploading(false);
      toast.success("Cover image uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);
  const getTemplatePreviewHtml = (html: string) =>
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  const plain = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plain ? plain.split(" ").length : 0;
  const readTime = Math.ceil(wordCount / 200);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
      </div>
    );
  }

  const toolbarIcon = (icon: React.ReactNode, key: string | number) => (
    <button
      key={key}
      className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors flex-shrink-0"
    >
      {icon}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Nav ── */}
      <nav className="bg-white border-b border-zinc-200/80 sticky top-0 z-50 h-14 flex items-center px-4 sm:px-6 gap-3">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500" />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
        >
          <div className="w-7 h-7 bg-zinc-900 rounded-[7px] flex items-center justify-center flex-shrink-0">
            <FileText className="w-[14px] h-[14px] text-white" />
          </div>
          <span className="hidden sm:inline">BlogPress</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-1 hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {id ? "Editing" : "Draft"}
          </span>

          <button
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Save draft</span>
          </button>

          <button
            onClick={() => handleSave("published")}
            disabled={isSubmitting}
            className="h-8 px-3 sm:px-4 flex items-center gap-1.5 text-[13px] font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {id ? "Update" : "Publish"}
          </button>
        </div>
      </nav>

      {/* ── Exit Dialog ── */}
      <AlertDialog open={showExitModal} onOpenChange={setShowExitModal}>
        <AlertDialogContent className="border-zinc-200 rounded-2xl max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 font-semibold text-base">
              Unsaved changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 text-sm">
              Save your work as a draft before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={goBackOrHome}
              className="border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-lg text-sm font-medium"
            >
              Discard
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSave("draft")}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium"
            >
              Save &amp; leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">

          {/* Template bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-zinc-100 flex items-center gap-3">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex-shrink-0">
              Template
            </span>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateApply}
              disabled={templatesLoading || !!id || templates.length === 0}
            >
              <SelectTrigger className="h-8 text-[12px] border-zinc-200 bg-zinc-50 text-zinc-500 max-w-xs focus:ring-0 focus:ring-offset-0 rounded-lg flex-1">
                <SelectValue
                  placeholder={
                    templatesLoading
                      ? "Loading templates…"
                      : id
                      ? "Disabled while editing"
                      : "Start from a template…"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200">
                {templates.map((t) => (
                  <SelectItem key={t._id} value={t._id} className="text-[13px]">
                    {t.name}
                    <span className="ml-1.5 text-[10px] text-zinc-400">
                      {t.source === "mine" ? "· mine" : "· public"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!id && templates.length > 0 && (
              <span className="text-[11px] text-zinc-400 ml-auto flex-shrink-0 hidden md:block whitespace-nowrap">
                {templates.filter((t) => t.source === "mine").length} personal &nbsp;·&nbsp;{" "}
                {templates.filter((t) => t.source === "public").length} public
              </span>
            )}
          </div>

          {/* Template preview */}
          {selectedTemplate && !id && (
            <div className="px-4 sm:px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-medium text-zinc-700">{selectedTemplate.name}</span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-zinc-200 rounded text-zinc-500">
                  {selectedTemplate.source === "mine" ? "Mine" : "Public"}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">{selectedTemplate.category}</span>
              </div>
              <div className="border border-zinc-200 rounded-xl bg-white p-3 max-h-28 overflow-hidden">
                <div
                  className="prose prose-sm max-w-none text-zinc-500 [&_h1]:text-xs [&_h2]:text-xs [&_p]:text-xs [&_li]:text-xs"
                  dangerouslySetInnerHTML={{ __html: getTemplatePreviewHtml(selectedTemplate.content) }}
                />
              </div>
            </div>
          )}

          {templatesError && (
            <div className="px-4 sm:px-6 py-2 border-b border-zinc-100">
              <p className="text-[11px] text-amber-600">{templatesError}</p>
            </div>
          )}
          {id && (
            <div className="px-4 sm:px-6 py-2 border-b border-zinc-100">
              <p className="text-[11px] text-zinc-400">Template selection is disabled while editing an existing post.</p>
            </div>
          )}

          {/* Cover image */}
          {coverImage ? (
            <div className="border-b border-zinc-100">
              <div className="relative h-44 sm:h-64 overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `50% ${imagePosition}%` }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-2 text-[13px] text-zinc-700 bg-white border border-zinc-200 rounded-lg px-3 py-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 sm:px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Adjust crop
                  </span>
                  <input
                    type="range" min="0" max="100" step="1" value={imagePosition}
                    onChange={(e) => setImagePosition(parseInt(e.target.value, 10))}
                    className="w-full h-1 accent-zinc-800 cursor-pointer rounded-full"
                  />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => coverFileInputRef.current?.click()}
                    className="h-8 px-3 text-[12px] font-medium border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setCoverImage("")}
                    className="h-8 px-3 text-[12px] font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
              />
            </div>
          ) : (
            <div
              className="h-40 sm:h-52 flex flex-col items-center justify-center gap-3 cursor-pointer group border-b border-zinc-100 bg-zinc-50 hover:bg-zinc-100/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 border border-zinc-200 rounded-xl flex items-center justify-center bg-white group-hover:border-zinc-300 transition-colors shadow-sm">
                <Image className="w-4.5 h-4.5 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-zinc-600">Add a cover image</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Recommended 1600 × 840px</p>
              </div>
              <button className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium border border-zinc-200 text-zinc-500 rounded-lg bg-white hover:border-zinc-300 hover:text-zinc-700 transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? "Uploading…" : "Upload image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
              />
            </div>
          )}

          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 px-4 sm:px-5 py-2.5 border-b border-zinc-100 bg-zinc-50/60 overflow-x-auto">
            {toolbarIcon(<Bold className="w-3.5 h-3.5" />, "b")}
            {toolbarIcon(<Italic className="w-3.5 h-3.5" />, "i")}
            {toolbarIcon(<Underline className="w-3.5 h-3.5" />, "u")}
            <div className="w-px h-4 bg-zinc-200 mx-1.5 flex-shrink-0" />
            {toolbarIcon(<Heading1 className="w-3.5 h-3.5" />, "h1")}
            {toolbarIcon(<Heading2 className="w-3.5 h-3.5" />, "h2")}
            <div className="w-px h-4 bg-zinc-200 mx-1.5 flex-shrink-0" />
            {toolbarIcon(<List className="w-3.5 h-3.5" />, "list")}
            {toolbarIcon(<Quote className="w-3.5 h-3.5" />, "quote")}
            <div className="w-px h-4 bg-zinc-200 mx-1.5 flex-shrink-0" />
            {toolbarIcon(<Link2 className="w-3.5 h-3.5" />, "link")}
            {toolbarIcon(<Image className="w-3.5 h-3.5" />, "img")}
          </div>

          {/* Editor body */}
          <div className="px-5 sm:px-8 pt-6 pb-5 space-y-5">

            {/* Title */}
            <div>
              <Textarea
                placeholder="Write your post title here…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl sm:text-[28px] font-semibold border-none shadow-none px-0 py-0 focus-visible:ring-0 bg-transparent placeholder:text-zinc-300 resize-none overflow-hidden min-h-0 leading-snug tracking-tight text-zinc-900"
                rows={1}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                }}
              />
              <div className="mt-4 h-px bg-zinc-100" />
            </div>

            {/* Tags */}
            <div>
              <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Tag className="w-3 h-3" />
                Tags
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="h-9 text-[13px] border-zinc-200 bg-zinc-50 rounded-lg focus:bg-white focus-visible:ring-0 focus:border-zinc-300 transition-colors flex-1 placeholder:text-zinc-400"
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  className="h-9 px-4 text-[13px] border-zinc-200 text-zinc-600 rounded-lg font-medium hover:bg-zinc-50 flex-shrink-0"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="w-3.5 h-3.5 rounded-full bg-zinc-300 flex items-center justify-center hover:bg-zinc-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 text-zinc-700" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <Label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 block">
                Content
              </Label>
              <TemplateEditor content={content} onChange={setContent} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-8 py-3 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>{wordCount} words</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300 inline-block" />
              <span>{readTime} min read</span>
            </div>
            {autoSaved && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                Saved
              </span>
            )}
          </div>

        </div>

        {/* Mobile sticky bottom bar */}
        <div className="sm:hidden mt-4 flex gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={isSubmitting}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-[14px] font-medium text-zinc-700 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSubmitting}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-[14px] font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {id ? "Update" : "Publish"}
          </button>
        </div>

        <div className="h-10" />
      </main>
    </div>
  );
};

export default Write;