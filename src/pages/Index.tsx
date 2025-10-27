import { useState, useEffect } from "react";
import { Search, TrendingUp, Sparkles, ArrowRight, Clock, User, Calendar } from "lucide-react";

const Navbar = () => (
  <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BlogSpace
          </h1>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Explore</a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => window.location.href = '/write'}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
          >
            Write
          </button>
          <button onClick={() => window.location.href = '/signup'}
          className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const BlogCard = ({ post }) => (
  <article className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="relative overflow-hidden aspect-video">
      <img
        src={post.coverImage}
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-3 right-3">
        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
          {post.tags[0] || 'Article'}
        </span>
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{post.author.name}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {post.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
        {post.excerpt}
      </p>
      <button className="flex items-center text-blue-600 font-medium text-sm hover:gap-2 transition-all">
        Read More
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  </article>
);

const FilterTab = ({ active, children, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{children}</span>
  </button>
);

const Index = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/posts');
        if (response.ok) {
          const posts = await response.json();
          const formattedPosts = posts.map(post => ({
            id: post._id,
            title: post.title,
            excerpt: post.content.substring(0, 150) + '...',
            coverImage: post.coverImage || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
            author: {
              name: post.author,
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.author,
            },
            publishedAt: new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            readTime: `${Math.ceil(post.content.split(' ').length / 200)} min read`,
            tags: post.tags || ['Article'],
          }));
          setBlogPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Add sample posts if fetch fails
        setBlogPosts([
          {
            id: '1',
            title: 'Getting Started with Modern Web Development',
            excerpt: 'Learn the fundamentals of building modern web applications with the latest technologies and best practices...',
            coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
            author: {
              name: 'Sarah Johnson',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            },
            publishedAt: 'October 25, 2025',
            readTime: '5 min read',
            tags: ['Development'],
          },
          {
            id: '2',
            title: 'The Future of Artificial Intelligence',
            excerpt: 'Exploring how AI is transforming industries and shaping our digital future with groundbreaking innovations...',
            coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
            author: {
              name: 'Michael Chen',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
            },
            publishedAt: 'October 24, 2025',
            readTime: '7 min read',
            tags: ['AI'],
          },
          {
            id: '3',
            title: 'Designing Better User Experiences',
            excerpt: 'Discover the principles and practices that make digital products intuitive, accessible, and delightful to use...',
            coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
            author: {
              name: 'Emma Davis',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
            },
            publishedAt: 'October 23, 2025',
            readTime: '6 min read',
            tags: ['Design'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              life
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover stories, thinking, and expertise from writers on any topic that matters to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
              Start Reading
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

      {/* Filter Tabs */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-3">
          <FilterTab
            active={activeFilter === 'latest'}
            onClick={() => setActiveFilter('latest')}
            icon={Clock}
          >
            Latest
          </FilterTab>
          <FilterTab
            active={activeFilter === 'trending'}
            onClick={() => setActiveFilter('trending')}
            icon={TrendingUp}
          >
            Trending
          </FilterTab>
          <FilterTab
            active={activeFilter === 'following'}
            onClick={() => setActiveFilter('following')}
            icon={User}
          >
            Following
          </FilterTab>
        </div>
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
              {blogPosts.map((post, index) => (
                <div
                  key={post.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center mt-16">
              <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all border border-gray-200 hover:shadow-lg">
                Load More Posts
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
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
      </footer>

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