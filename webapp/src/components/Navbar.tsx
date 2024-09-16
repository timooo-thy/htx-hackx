"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import Link from "next/link";
import { Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "./ModeToggle";

export default function Navbar() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="flex justify-center items-center h-20 sticky top-0 z-50 w-5/6 m-auto border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              HTX Sentinel
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/models">Models</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {showSearch ? (
              <Input
                type="search"
                placeholder="Search..."
                className="md:w-[300px]"
              />
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowSearch(true)}
                className="ml-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            )}
          </div>
          <div className="flex gap-x-4">
            <ModeToggle />
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
            <Authenticated>
              <UserButton />
            </Authenticated>
          </div>
        </div>
      </div>
    </header>
  );
}
