import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "@/services/postService";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, ArrowLeft, Edit } from "lucide-react";
import { toast } from "react-toastify";

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

const Post = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setAccessDenied(false);
      const data = await postService.getPostById(id!);
      const postAuthorId = typeof data.authorId === 'object' ? data.authorId?._id : data.authorId;
      const isCurrentUser = user && (user.id === postAuthorId);

      setPost({
        ...data,
        publishedAt: formatDate(data.createdAt),
        readTime: `${Math.ceil((data.content || '').split(' ').length / 200) || 1} min read`,
        authorData: {
          name: data.authorId?.name || data.author,
          avatar: (isCurrentUser && user.profileImage)
            ? user.profileImage
            : (data.authorId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${data.authorId?.name || data.author || 'User'}`),
          bio: data.authorId?.bio || "",
        }
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      const status = (error as any)?.response?.status;
      if (status === 403) {
        setAccessDenied(true);
        toast.error("Unlock this private folder to read the blog");
      } else {
        toast.error("Failed to load post");
      }
    } finally {
      setLoading(false);
    }
  };

  const isAuthor = user && post && user.id === post.authorId;

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Navbar />
      <p className="text-xl text-muted-foreground mt-20">
        {accessDenied ? "This post is inside a private folder and is locked." : "Post not found."}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 pt-6 flex justify-between items-center max-w-4xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-white hover:shadow-sm"
          >
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </Button>
          {isAuthor && (
            <Button
              variant="outline"
              className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
              onClick={() => navigate(`/edit/${id}`)}
            >
              <Edit className="h-4 w-4" />
              Edit My Post
            </Button>
          )}
        </div>

        <div className="w-full h-[300px] md:h-[500px] overflow-hidden mt-4 relative">
          <img
            src={post.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop"}
            alt={post.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: `50% ${post.coverImagePosition || 50}%` }}
          />
        </div>

        <article className="container mx-auto px-4 py-12 max-w-4xl bg-white shadow-sm mt-[-60px] relative z-10 rounded-2xl border border-slate-100 mb-20 animate-fade-in">
          <div className="flex gap-2 flex-wrap mb-6">
            {post.tags?.map((tag: string) => (
              <Badge key={tag} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3 py-1 text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 mb-8 text-sm text-slate-500 font-medium pb-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 shadow-sm border border-slate-100 aspect-square overflow-hidden rounded-full">
                <AvatarImage src={post.authorData.avatar} alt={post.authorData.name} className="object-cover w-full h-full" />
                <AvatarFallback className="rounded-full">{post.authorData.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-slate-900 text-base">{post.authorData.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>{post.publishedAt}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed font-serif whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-16" />

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex items-center gap-6">
            <Avatar className="h-16 w-16 shadow-md border border-white aspect-square overflow-hidden rounded-full">
              <AvatarImage src={post.authorData.avatar} alt={post.authorData.name} className="object-cover w-full h-full" />
              <AvatarFallback className="rounded-full">{post.authorData.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-slate-900">About the Author</h3>
              <p className="text-slate-600 font-medium">{post.authorData.name}</p>
              {post.authorData.bio && (
                <p className="text-slate-500 text-sm mt-2 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                  {post.authorData.bio}
                </p>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default Post;
