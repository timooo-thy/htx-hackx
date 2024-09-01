"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import React from "react";
import { ModeToggle } from "./ModeToggle";

export default function Navbar() {
  return (
    <nav className="h-16 border rounded w-full flex justify-between items-center px-8">
      <div />
      <div>
        <h1 className="text-2xl font-bold">HTX HackX</h1>
      </div>
      <div className="flex gap-x-4">
        <Unauthenticated>
          <SignInButton />
        </Unauthenticated>
        <Authenticated>
          <UserButton />
        </Authenticated>
        <ModeToggle />
      </div>
    </nav>
  );
}
