import Link from "next/link";

export default function Footer() {
  return (
    <div className="bg-white text-gray-900 border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-16">
          <Link href="/breaking" className="flex flex-col items-center hover:text-[#e53e3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[#e53e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm">속보</span>
          </Link>
          
          <Link href="/popular" className="flex flex-col items-center hover:text-[#e53e3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[#e53e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">인기뉴스</span>
          </Link>
          
          <Link href="/videos" className="flex flex-col items-center hover:text-[#e53e3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[#e53e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">영상뉴스</span>
          </Link>
          
          <Link href="/newsletter" className="flex flex-col items-center hover:text-[#e53e3e]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-[#e53e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">뉴스레터</span>
          </Link>
        </div>
      </div>
    </div>
  );
}