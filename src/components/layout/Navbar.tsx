import React from 'react';
import { NavLink } from 'react-router-dom';
import { ModeToggle } from '@/components/utils/mode-toggle';
import { Button } from '@/components/ui/button';
import { Home, Settings, RefreshCw } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <header className="hidden md:flex sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <NavLink to="/" className="mr-6 flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span className="font-bold">
              Glide Sync
            </span>
          </NavLink>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "text-foreground"
                  : "text-foreground/60 transition-colors hover:text-foreground"
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/sync"
              className={({ isActive }) =>
                isActive
                  ? "text-foreground"
                  : "text-foreground/60 transition-colors hover:text-foreground"
              }
            >
              Sync
            </NavLink>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
