"use client";

import React, { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { Bell, Brain, Camera, Map, Shield } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function IntegrationChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-[350px] w-full items-center justify-center overflow-hidden rounded-lg border p-10 md:shadow-xl dark:bg-white"
      ref={containerRef}
    >
      <div className="flex size-full flex-col max-w-lg max-h-[200px] items-stretch justify-between">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} className="size-16 dark:border-none">
            <Camera className="text-blue-500" />
          </Circle>
          <Circle ref={div5Ref} className="size-16 dark:border-none">
            <Brain className="text-blue-500" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <div />
          <Circle ref={div4Ref} className="size-24 dark:border-none">
            <Shield className="text-blue-500 h-10 w-10" />
          </Circle>
          <div />
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref} className="size-16 dark:border-none">
            <Bell className="text-blue-500" />
          </Circle>
          <Circle ref={div7Ref} className="size-16 dark:border-none">
            <Map className="text-blue-500" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        duration={4}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        duration={4}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        duration={4}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        duration={4}
        reverse
      />
    </div>
  );
}
