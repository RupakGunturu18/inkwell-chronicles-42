import { useState, useEffect } from "react";
import { Search, TrendingUp, Sparkles, ArrowRight, Clock, Calendar, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { postService } from "@/services/postService";

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

const BlogCard = ({ post }: { post: any }) => (
  <Link to={`/post/${post.id}`}>
    <article className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <div className="relative overflow-hidden aspect-video">
        <img
          src={post.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: `50% ${post.coverImagePosition || 50}%` }}
        />
        <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end">
          {post.tags?.slice(0, 3).map((tag: string, i: number) => (
            <span key={i} className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-medium text-gray-700 shadow-sm">
              {tag}
            </span>
          ))}
          {post.tags?.length > 3 && (
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-medium text-gray-700 shadow-sm">
              +{post.tags.length - 3}
            </span>
          )}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-9 w-9 border border-slate-100 shadow-sm aspect-square overflow-hidden rounded-full">
            <AvatarImage src={post.author.avatar} alt={post.author.name} className="object-cover w-full h-full" />
            <AvatarFallback className="rounded-full">{post.author.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{post.author.name}</p>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
              <span>{post.publishedAt}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="flex items-center text-blue-600 font-bold text-sm group-hover:gap-2 transition-all mt-auto group-hover:translate-x-1 duration-300">
          Read Story
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </article>
  </Link>
);

const Index = () => {
  const { user } = useAuth();
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const posts = await postService.getAllPosts();
        const formattedPosts = posts.map((post: any) => {
          const postAuthorId = typeof post.authorId === 'object' ? post.authorId?._id : post.authorId;
          const isCurrentUser = user && (user.id === postAuthorId);

          return {
            id: post._id,
            title: post.title,
            excerpt: post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No content available.'),
            coverImage: post.coverImage,
            coverImagePosition: post.coverImagePosition,
            author: {
              name: post.authorId?.name || post.author,
              avatar: (isCurrentUser && user.profileImage)
                ? user.profileImage
                : (post.authorId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorId?.name || post.author || 'User'}`),
            },
            publishedAt: formatDate(post.createdAt),
            readTime: `${Math.ceil((post.content || post.excerpt || '').split(' ').length / 200) || 1} min read`,
            tags: post.tags?.length > 0 ? post.tags : ['Story'],
          };
        });
        setBlogPosts(formattedPosts);
        setFilteredPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user) {
        try {
          const userPosts = await postService.getMyPosts();
          setMyPosts(userPosts.slice(0, 3));
        } catch (e) {
          console.error("Error fetching my posts:", e);
          // Auto-retry once after 2 seconds if it's a timeout
          if (e.code === 'ECONNABORTED') {
            setTimeout(fetchUserPosts, 2000);
          }
        }
      }
    };

    fetchUserPosts();
  }, [user]);

  // Handle search
  useEffect(() => {
    let filtered = [...blogPosts];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting filter
    if (activeFilter === 'latest') {
      // Already sorted by date (newest first)
    } else if (activeFilter === 'oldest') {
      filtered = [...filtered].reverse();
    }

    setFilteredPosts(filtered);
  }, [searchQuery, activeFilter, blogPosts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Discover amazing stories</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
            Where ideas come to{" "}
            <span className="relative inline-block group">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                life
              </span>
              <svg
                className="absolute -bottom-4 -left-3 w-[calc(100%+24px)] h-8 drop-shadow-[0_0_8px_rgba(147,51,234,0.3)]"
                viewBox="0 0 120 40"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="hero-curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
                <path
                  d="M5 25 C 20 35, 45 15, 60 25 S 100 15, 115 25"
                  stroke="url(#hero-curve-gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  className="animate-[draw_1.5s_ease-out_forwards]"
                  style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
                />
              </svg>
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover stories, thinking, and expertise from writers on any topic that matters to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
              Templates
            </button>
            <button
              onClick={() => window.location.href = '/write'}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Start Writing
            </button>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search posts by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Filter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveFilter('latest')}>
                <Clock className="mr-2 h-4 w-4" />
                <span>Latest</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('oldest')}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Oldest</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveFilter('trending')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>Trending</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {searchQuery && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
          </p>
        )}
        {/* My Posts Quick Access */}
        {user && myPosts.length > 0 && !searchQuery && (
          <div className="mt-16 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 bg-blue-600 h-6 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight text-left">My Recent Posts</h2>
              </div>
              <Link to="/profile" className="text-blue-600 font-bold hover:underline text-sm">View all my posts</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPosts.map((post) => (
                <Link key={post._id} to={`/post/${post._id}`} className="group block">
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg transition-all flex gap-4 h-32 items-center">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={post.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=200&fit=crop"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: `50% ${post.coverImagePosition || 50}%` }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight text-left">
                        {post.title}
                      </h3>
                      <p className="text-slate-400 text-[10px] mt-2 font-medium text-left">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="h-px bg-slate-100 w-full mt-12 mb-4"></div>
          </div>
        )}
      </section>

      {/* Blog Grid */}
      <main className="container mx-auto px-4 py-8 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg">No posts found matching your search.</p>
              </div>
            )}

            {/* Load More */}
            {filteredPosts.length > 0 && (
              <div className="flex justify-center mt-16">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all border border-gray-200 hover:shadow-lg">
                  Load More Posts
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Hidden as per requirements */}
      {/* <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BlogSpace
              </h3>
              <p className="text-gray-600 text-sm">
                Where ideas come to life. Share your stories with the world.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2025 BlogSpace. All rights reserved.</p>
          </div>
        </div>
      </footer> */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;