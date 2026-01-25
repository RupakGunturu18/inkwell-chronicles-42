import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PenSquare, Search, Moon, Sun, User, LogOut, ChevronDown, LayoutGrid, FileText, Settings, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export const Navbar = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Handle floating pill design (scrolled state)
      setIsScrolled(currentScrollY > 20);

      // Handle visibility (hide on scroll down, show on scroll up)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down and past threshold
      } else {
        setIsVisible(true); // Scrolling up or at the top
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out flex justify-center pt-1 md:pt-2 ${!isVisible ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        } ${isScrolled ? "pointer-events-none" : "bg-white/0 border-transparent shadow-none"}`}
    >
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-between px-6 pointer-events-auto ${isScrolled
          ? "w-[95%] md:w-[75%] max-w-5xl h-14 bg-white/90 backdrop-blur-xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200/50"
          : "w-full h-16 bg-white/80 backdrop-blur-lg border-b border-slate-100"
          }`}
      >
        <Link to="/" className="flex items-center space-x-2 group ml-4 md:ml-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-pink-600 group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20" />
          <span
            className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            BlogHub
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/templates" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Templates
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/folders" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Folders
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/write" className="hidden sm:block">
                <Button className="rounded-full px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 border-none">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Write
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-blue-500/50 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`} alt={user?.name} className="object-cover" />
                      <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden rounded-[24px] border-none shadow-2xl bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 mt-2">
                  {/* Premium Dropdown Header */}
                  <div className="relative p-6 bg-slate-900 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div className="relative flex flex-col items-center text-center space-y-3">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <Avatar className="h-20 w-20 border-2 border-slate-900 relative shadow-2xl rounded-full">
                          <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`} alt={user?.name} className="object-cover" />
                          <AvatarFallback className="bg-slate-800 text-white text-2xl">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-white font-black text-lg leading-none tracking-tight">{user?.name}</p>
                          <Sparkles className="w-3 h-3 text-blue-400" />
                        </div>
                        <p className="text-blue-400 text-sm font-bold">@{user?.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-white transition-all shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">My Profile</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Account & Settings</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:via-pink-600 group-hover:to-orange-500 group-hover:text-white transition-all shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">Dashboard</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manage Content</span>
                      </div>
                    </DropdownMenuItem>

                    <div className="h-px bg-slate-100 my-2 mx-4" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-red-50 text-red-600 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span className="font-bold">Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
              <Link to="/signup">
                <Button className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity text-white font-bold shadow-lg shadow-blue-500/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
