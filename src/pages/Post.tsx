import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Bookmark, Calendar, Clock, ArrowLeft } from "lucide-react";

const Post = () => {
  const { id } = useParams();

  // Mock post data
  const post = {
    title: "Getting Started with Modern Web Development",
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      bio: "Full-stack developer passionate about creating elegant solutions to complex problems.",
    },
    publishedAt: "January 15, 2025",
    readTime: "5 min read",
    tags: ["Web Dev", "React", "TypeScript"],
    content: `
      <p>Web development has evolved dramatically over the past decade. What once required deep knowledge of multiple technologies and complex configurations can now be accomplished with elegant, modern tools and frameworks.</p>

      <h2>The Modern Web Stack</h2>
      <p>Today's web development landscape is built on several key technologies that work seamlessly together. React has revolutionized how we think about user interfaces, TypeScript has brought type safety to JavaScript, and tools like Vite have made development faster than ever.</p>

      <h3>Why React?</h3>
      <p>React's component-based architecture allows developers to build complex UIs from small, reusable pieces. This approach not only makes code more maintainable but also encourages better separation of concerns.</p>

      <blockquote>
        "The best code is no code at all. The second best is code that's so simple it doesn't need documentation."
      </blockquote>

      <h3>TypeScript Benefits</h3>
      <p>TypeScript adds static typing to JavaScript, catching errors at compile time rather than runtime. This leads to more robust code and better developer experience with improved autocomplete and refactoring tools.</p>

      <h2>Getting Started</h2>
      <p>Starting a new project is easier than ever. With tools like Vite, you can scaffold a new React + TypeScript project in seconds:</p>

      <pre><code>npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev</code></pre>

      <p>That's all it takes to get a modern development environment up and running. From there, you can add additional tools and libraries as your project needs grow.</p>

      <h2>Best Practices</h2>
      <ul>
        <li>Keep components small and focused</li>
        <li>Use TypeScript for type safety</li>
        <li>Implement proper error handling</li>
        <li>Write tests for critical functionality</li>
        <li>Optimize for performance early</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Modern web development is more accessible than ever before. With the right tools and understanding of core concepts, anyone can build professional-grade web applications. The key is to start simple, learn continuously, and gradually expand your knowledge.</p>
    `,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Back Button */}
        <div className="container mx-auto px-4 pt-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Cover Image */}
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden mt-4">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-6 animate-fade-in">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-slide-up">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground animate-slide-up">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.publishedAt}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
          </div>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border animate-slide-up">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{post.author.bio}</p>
              </div>
            </div>

            <Button variant="outline">Follow</Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-8 animate-slide-up">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              <span>245</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>32</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2 ml-auto">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none animate-fade-in"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-12" />

          {/* Author Card */}
          <div className="bg-secondary/30 rounded-xl p-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">About {post.author.name}</h3>
                <p className="text-muted-foreground mb-4">{post.author.bio}</p>
                <Button>Follow</Button>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default Post;
