import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PenSquare, User, LogOut, LayoutGrid, FolderOpen } from "lucide-react";
// Next sprint: restore template entry in nav and dropdown.
// import { FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const rawName = user?.name?.trim() || "";
  const isGenericName = !rawName || rawName.toLowerCase() === "user";
  const displayName = isGenericName
    ? (user?.username || "Account")
    : rawName;

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
          ? "w-[95%] md:w-[75%] max-w-5xl h-14 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-slate-200"
          : "w-full h-16 bg-white/80 backdrop-blur-lg border-b border-slate-100"
          }`}
      >
        <Link to="/" className="flex items-center space-x-2 group ml-4 md:ml-6">
          <img
            src="/blog.avif"
            alt="BlogHub logo"
            className="h-9 w-9 rounded-lg object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
            BlogHub
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
          </Link>
          {/* Next sprint: show Templates nav again.
          <Link to="/templates" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Templates
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
          </Link>
          */}
          <Link to="/folders" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-all relative group">
            Folders
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/write" className="hidden sm:block">
                <Button className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors border-none">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Write
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user?.profileImage} alt={displayName} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1 rounded-2xl border border-slate-200 shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150 mt-2">
                  <div className="flex items-center gap-3 p-3 border-b border-slate-100">
                    <Avatar className="h-10 w-10 rounded-full border border-slate-200">
                      <AvatarImage src={user?.profileImage} alt={displayName} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">@{user?.username}</p>
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-slate-900">My Profile</span>
                        <span className="text-[11px] text-slate-500">Account settings</span>
                      </div>
                    </DropdownMenuItem>

                    {/* Next sprint: enable Templates shortcut in profile menu.
                    <DropdownMenuItem
                      onClick={() => navigate("/templates")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-slate-900">Templates</span>
                        <span className="text-[11px] text-slate-500">Open template library</span>
                      </div>
                    </DropdownMenuItem>
                    */}

                    <DropdownMenuItem
                      onClick={() => navigate("/folders")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-slate-900">Folders</span>
                        <span className="text-[11px] text-slate-500">Manage your folders</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="flex items-center gap-3 px-3 py-2.0 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900"
                    >
                    </DropdownMenuItem>

                    <div className="h-px bg-slate-100 my-1 mx-2" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-red-50 text-red-600 transition-colors group data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                    >
                      <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Sign Out</span>
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
                <Button className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold">
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
