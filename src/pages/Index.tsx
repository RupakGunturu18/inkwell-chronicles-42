import { Navbar } from "@/components/Navbar";
import { BlogCard } from "@/components/BlogCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const blogPosts = [
  {
    id: "1",
    title: "Getting Started with Modern Web Development",
    excerpt: "Learn the fundamentals of building modern web applications with React, TypeScript, and cutting-edge tools.",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    publishedAt: "Jan 15, 2025",
    readTime: "5 min",
    tags: ["Web Dev", "React", "TypeScript"],
  },
  {
    id: "2",
    title: "The Art of Writing Clean Code",
    excerpt: "Discover best practices and principles that will transform your code from messy to maintainable.",
    coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop",
    author: {
      name: "Marcus Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    },
    publishedAt: "Jan 14, 2025",
    readTime: "8 min",
    tags: ["Programming", "Best Practices"],
  },
  {
    id: "3",
    title: "Building Scalable APIs with Node.js",
    excerpt: "A comprehensive guide to designing and implementing RESTful APIs that can handle millions of requests.",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
    author: {
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    publishedAt: "Jan 13, 2025",
    readTime: "12 min",
    tags: ["Backend", "Node.js", "API"],
  },
  {
    id: "4",
    title: "Mastering CSS Grid and Flexbox",
    excerpt: "Everything you need to know about modern CSS layout techniques to create stunning responsive designs.",
    coverImage: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
    author: {
      name: "Emma Watson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
    publishedAt: "Jan 12, 2025",
    readTime: "10 min",
    tags: ["CSS", "Design", "Frontend"],
  },
  {
    id: "5",
    title: "Understanding JavaScript Closures",
    excerpt: "Demystifying one of JavaScript's most powerful yet confusing concepts with practical examples.",
    coverImage: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&h=450&fit=crop",
    author: {
      name: "David Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    publishedAt: "Jan 11, 2025",
    readTime: "6 min",
    tags: ["JavaScript", "Programming"],
  },
  {
    id: "6",
    title: "Introduction to Machine Learning",
    excerpt: "Start your journey into AI and machine learning with this beginner-friendly introduction.",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    author: {
      name: "Lisa Park",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    },
    publishedAt: "Jan 10, 2025",
    readTime: "15 min",
    tags: ["AI", "Machine Learning", "Python"],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Where ideas come to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              life
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover stories, thinking, and expertise from writers on any topic.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="container mx-auto px-4 py-6 animate-slide-up">
        <Tabs defaultValue="latest" className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </section>

      {/* Blog Grid */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {blogPosts.map((post, index) => (
            <div
              key={post.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in"
            >
              <BlogCard {...post} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            Load More Posts
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
