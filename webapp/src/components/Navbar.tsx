"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { ModeToggle } from "./ModeToggle";

export default function Navbar() {
  const { isSignedIn } = useUser();
  return (
    <header className="w-full px-10 md:px-0 flex justify-center items-center h-20 sticky top-0 z-50 m-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/30">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block md:flex">
              HTX Sentinel
            </span>
          </Link>
          {isSignedIn && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/models">Models</Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
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
