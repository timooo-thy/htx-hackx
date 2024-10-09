import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Bell, Camera, Cog, Map, Shield } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import Link from "next/link";
import ShineBorder from "@/components/magicui/shine-border";
import AnimatedGridPattern from "@/components/magicui/animated-grid-pattern";
import AnimmatedCircularProgressBarDemo from "@/components/animated-progress-bar";
import { cn } from "@/lib/utils";
import FlickeringGrid from "@/components/magicui/flickering-grid";
import IntegrationChart from "@/components/integration-chart";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex justify-center flex-col relative">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gray-900 rounded-2xl shadow-xl border">
        <div className="container px-4 md:px-6 m-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2 relative w-auto p-8 rounded-2xl">
              <BorderBeam duration={10} />
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                HTX Sentinel: AI-Powered Policing
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                An all-in-one platform for real-time threat detection,
                intelligent analysis, and AI model management for HTX and SPF.
              </p>
            </div>
            <Button className="bg-white text-black hover:bg-gray-200">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="relative overflow-hidden flex justify-center flex-col">
        <AnimatedGridPattern
          numSquares={40}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
            "inset-x-0 h-[150%] skew-y-12 inset-y-[-200px]"
          )}
        />
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 rounded-2xl shadow-xl border dark:bg-black">
          <div className="container px-4 md:px-6 m-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              Key Features
            </h2>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <ShineBorder
                className="flex flex-col items-center space-y-4 text-center p-6 dark:bg-white"
                color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              >
                <Camera className="h-12 w-12 text-blue-500" />
                <h3 className="text-2xl font-bold dark:text-background">
                  Advanced Object Detection
                </h3>
                <p className="text-gray-500">
                  Fine-tuned model capable of real-time detection via
                  officers&apos; body cameras + Retrieval Augmented Generation
                  to enhance context awareness
                </p>
              </ShineBorder>
              <ShineBorder
                className="flex flex-col items-center space-y-4 text-center p-6 dark:bg-white"
                color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              >
                <Bell className="h-12 w-12 text-blue-500" />
                <h3 className="text-2xl font-bold dark:text-background">
                  Real-Time Notifications
                </h3>
                <p className="text-gray-500">
                  Receive context-aware alerts on your devices in real-time when
                  suspicious objects are detected and verified by our advanced
                  vision models.
                </p>
              </ShineBorder>
              <ShineBorder
                className="flex flex-col items-center space-y-4 text-center p-6 dark:bg-white"
                color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              >
                <Map className="h-12 w-12 text-blue-500" />
                <h3 className="text-2xl font-bold dark:text-background">
                  Automated Training Pipeline
                </h3>
                <p className="text-gray-500">
                  Automated segmenting of objects from video, labelling of data,
                  training of models and deployment
                </p>
              </ShineBorder>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 rounded-2xl shadow-xl border">
          <div className="container px-4 md:px-6 m-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Cutting-Edge AI Integration
                </h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  HTX Sentinel leverages state-of-the-art AI models for
                  unparalleled accuracy in object detection, image segmentation,
                  and contextual analysis.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <ShineBorder
                  className="flex items-center space-x-4 p-4 w-full h-28 dark:bg-white"
                  color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                >
                  <Badge className="bg-yellow-500 w-32 flex justify-center items-center">
                    YOLO v8
                  </Badge>
                  <div className="space-y-1">
                    <h3 className="font-bold dark:text-background">
                      Real-time Object Detection
                    </h3>
                    <p className="text-sm text-gray-500">
                      Fast and accurate detection of suspicious objects
                    </p>
                  </div>
                </ShineBorder>
                <ShineBorder
                  className="flex items-center space-x-4 p-4 w-full h-28 dark:bg-white"
                  color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                >
                  <Badge className="bg-green-500 w-32 flex justify-center items-center">
                    GPT-4o-mini
                  </Badge>
                  <div className="space-y-1">
                    <h3 className="font-bold dark:text-background">
                      Contextual Analysis
                    </h3>
                    <p className="text-sm text-gray-500">
                      Advanced image understanding for accurate threat
                      assessment
                    </p>
                  </div>
                </ShineBorder>
                <ShineBorder
                  className="flex items-center space-x-4 p-4 w-full h-28 dark:bg-white"
                  color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                >
                  <Badge className="bg-blue-500 w-32 flex justify-center items-center">
                    Florence & SAM2
                  </Badge>
                  <div className="space-y-1">
                    <h3 className="font-bold dark:text-background">
                      Image Segmentation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Precise segmentation for detailed analysis and training
                    </p>
                  </div>
                </ShineBorder>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 relative rounded-2xl shadow-xl border">
        <FlickeringGrid
          className="z-0 absolute inset-0"
          squareSize={4}
          gridGap={6}
          maxOpacity={0.05}
          flickerChance={0.1}
        />
        <div className="container px-4 md:px-6 m-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 dark:text-black">
            Comprehensive Admin Capabilities
          </h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AnimmatedCircularProgressBarDemo />
              <h3 className="text-2xl font-bold dark:text-black">
                AI Model Training
              </h3>
              <p className="text-gray-500">
                Train custom YOLO v8 models using segmented images from your
                department&apos;s data
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Cog className="h-12 w-12 text-blue-500" />
              <h3 className="text-2xl font-bold dark:text-black">
                Model Deployment
              </h3>
              <p className="text-gray-500">
                Easily deploy trained models across your entire police force
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <BarChart2 className="h-12 w-12 text-blue-500" />
              <h3 className="text-2xl font-bold dark:text-black">
                Analytics Dashboard
              </h3>
              <p className="text-gray-500">
                Comprehensive analytics and reporting for data-driven decision
                making
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 rounded-2xl shadow-xl border dark:bg-gray-950">
        <div className="container px-4 md:px-6 m-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                All-in-One Solution
              </h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                HTX Sentinel provides a complete ecosystem for law enforcement
                agencies, from real-time detection to AI model management, all
                in one integrated platform.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  <span>
                    Seamless integration of detection, analysis, and response
                  </span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  <span>Centralised dashboard for all policing activities</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  <span>
                    Streamlined workflow from data collection to model
                    deployment
                  </span>
                </li>
              </ul>
            </div>
            <IntegrationChart />
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 rounded-2xl shadow-xl border">
        <div className="container px-4 md:px-6 m-auto">
          <div className="flex flex-col items-center gap-y-10 text-center">
            <div className="flex flex-col gap-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Revolutionise SPF with HTX Sentinel
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-400 md:text-xl">
                Experience the future of law enforcement with our AI-powered,
                all-in-one platform. Request a demo today.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-4">
              <form className="flex space-x-2">
                <Input
                  className="max-w-lg flex-1 bg-white text-black"
                  placeholder="Enter your email"
                  type="email"
                />
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  type="submit"
                >
                  Request Demo
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
