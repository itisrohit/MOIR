import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-black p-6 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-tr from-black via-slate-950 to-blue-950 opacity-80"></div>
      
      {/* Minimal glowing accent */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
      
      {/* Simple content */}
      <div className="relative z-10 max-w-xl w-full text-center px-4">
        {/* Minimal logo indicator */}
        <div className="mb-12">
          <div className="h-px w-12 bg-white/30 mx-auto"></div>
        </div>
        
        <h1 className="text-5xl font-light tracking-tight text-white mb-8">
          Comming Soon
        </h1>
        
        <p className="text-lg font-light mb-12 leading-relaxed">
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
            Something is cooking.
          </span>
        </p>
        
        <Link 
          href="/" 
          className="group relative inline-flex items-center overflow-hidden rounded-full border border-white/30 px-8 py-3 text-white focus:outline-none"
        >
          <span className="absolute inset-x-0 bottom-0 h-full origin-bottom scale-y-0 transform bg-white transition duration-300 group-hover:scale-y-100"></span>
          <span className="relative flex items-center gap-2 font-light tracking-wide group-hover:text-black transition duration-300">
            Take a Tour
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </Link>
      </div>
      
      {/* Minimal footer */}
      <p className="absolute bottom-6 text-white/30 text-xs font-light tracking-wider">
        © 2025
      </p>
    </div>
  );
}