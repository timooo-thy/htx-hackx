export default function Footer() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-20 border-t h-16">
      <p className="text-xs text-gray-500">
        © 2024 HTX Sentinel. All rights reserved.
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6 pb-4 md:pb-0">
        <a className="text-xs hover:underline underline-offset-4" href="#">
          Terms of Service
        </a>
        <a className="text-xs hover:underline underline-offset-4" href="#">
          Privacy
        </a>
      </nav>
    </footer>
  );
}
