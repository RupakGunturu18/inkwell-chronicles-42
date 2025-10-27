import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlogCard } from "@/components/BlogCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MapPin, Link as LinkIcon } from "lucide-react";

const Profile = () => {
  const user = {
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    bio: "Full-stack developer passionate about creating elegant solutions to complex problems. Love writing about web development, design, and technology.",
    location: "San Francisco, CA",
    website: "sarahchen.dev",
    joinedDate: "January 2024",
  };

  const userPosts = [
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
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-start gap-6 animate-fade-in">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                    <p className="text-muted-foreground max-w-2xl">{user.bio}</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a href="#" className="hover:text-primary transition-colors">
                      {user.website}
                    </a>
                  </div>
                  <div>Joined {user.joinedDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
              <TabsTrigger value="posts">My Posts</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPosts.map((post) => (
                  <BlogCard key={post.id} {...post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="drafts" className="animate-fade-in">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No drafts yet</p>
              </div>
            </TabsContent>

            <TabsContent value="liked" className="animate-fade-in">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No liked posts yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
