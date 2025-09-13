'use client'

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileDropdown from "@/components/UserProfileDropdown";

export default function Home() {
  const { isAuthenticated } = useAuth()
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center px-8 py-8">
        <div className="flex items-center gap-4">
          <Image
            src="/Logo.png"
            alt="GoPlanner Logo"
            width={180}
            height={60}
            className="object-contain brightness-125 contrast-125 drop-shadow-lg"
            style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
          />
        </div>
        
        <nav className="flex items-center gap-10">
          <a href="#" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">HOME</a>
          <Link href="/guidebook" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">ATTRACTIONS</Link>
          <Link href="/smart-planning" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">MY PLANS</Link>
        </nav>
        
        {isAuthenticated ? (
          <UserProfileDropdown variant="large" />
        ) : (
          <Link href="/login">
            <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:from-purple-800 active:to-purple-900 text-white px-8 py-3 rounded-full transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
              LOGIN
            </button>
          </Link>
        )}
      </header>

      <main className="relative">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-7xl font-bold leading-tight tracking-tight mb-6">
                The world is <span className="text-orange-500">beautiful</span>.
              </h1>
            </div>
            
            <div className="pl-8">
              <div className="text-orange-400 italic text-xl leading-relaxed mb-10 font-light tracking-wide">
                <p className="mb-2">Among the lights of Sydney's bay,</p>
                <p className="mb-2">And Melbourne streets where people stay,</p>
                <p className="mb-2">Beyond the road where oceans roar,</p>
                <p className="text-orange-500 font-medium">Adventure calls on every shore</p>
              </div>
              <Link 
                href="/trip-planner"
                className="inline-block bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-black font-semibold px-10 py-4 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
              >
                Start planning my trip!
              </Link>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="max-w-7xl mx-auto px-8 mb-20">
          <div className="flex justify-center items-center gap-0 relative py-12">
            {/* Melbourne University */}
            <div className="group relative">
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-110 relative z-10 ring-4 ring-white/10 hover:ring-white/20">
                <Image
                  src="/Melb.jpg"
                  alt="Melbourne Historic Architecture"
                  fill
                  className="object-cover group-hover:scale-125 transition-transform duration-1000 filter hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            {/* University Campus */}
            <div className="group relative -ml-20">
              <div className="w-72 h-72 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-110 relative z-20 ring-4 ring-white/10 hover:ring-white/20">
                <Image
                  src="/Uni.jpg"
                  alt="University Campus"
                  fill
                  className="object-cover group-hover:scale-125 transition-transform duration-1000 filter hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            {/* Uluru */}
            <div className="group relative -ml-24">
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-110 relative z-30 ring-4 ring-white/10 hover:ring-white/20">
                <Image
                  src="/Uluru.jpg"
                  alt="Uluru Ayers Rock"
                  fill
                  className="object-cover group-hover:scale-125 transition-transform duration-1000 filter hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            {/* Sydney Opera House */}
            <div className="group relative -ml-20">
              <div className="w-72 h-72 rounded-full overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-110 relative z-40 ring-4 ring-white/10 hover:ring-white/20">
                <Image
                  src="/Sydney-Opera.jpg"
                  alt="Sydney Opera House"
                  fill
                  className="object-cover group-hover:scale-125 transition-transform duration-1000 filter hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Destinations */}
        <section className="max-w-7xl mx-auto px-8 mb-24">
          <h2 className="text-5xl font-bold text-center mb-16 text-orange-400 tracking-wide" style={{fontFamily: 'Georgia, serif'}}>
            Popular Destinations
          </h2>
          
          <div className="grid grid-cols-4 gap-8">
            {/* Melbourne Card */}
            <Link href="/guidebook/melbourne">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-800/50 cursor-pointer">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/Melbourne.jpg"
                    alt="Melbourne City"
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-white">Melbourne, VIC</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Experience the city of culture and its iconic landmarks.</p>
                </div>
              </div>
            </Link>

            {/* Sydney Card */}
            <Link href="/guidebook/sydney">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-800/50 cursor-pointer">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/Syd.jpg"
                    alt="Sydney City"
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-white">Sydney, NSW</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Enjoy breathtaking views and beautiful sunsets.</p>
                </div>
              </div>
            </Link>

            {/* Brisbane Card */}
            <Link href="/guidebook/brisbane">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-800/50 cursor-pointer">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/Brisbane.jpg"
                    alt="Brisbane City"
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-white">Brisbane, QLD</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Discover the perfect blend of tradition and innovation.</p>
                </div>
              </div>
            </Link>

            {/* Perth Card */}
            <Link href="/guidebook/perth">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-800/50 cursor-pointer">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/Perth.jpg"
                    alt="Perth City"
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-white">Perth, WA</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Relax on beautiful beaches and explore lush landscapes.</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/Logo.png"
                alt="GoPlanner Logo"
                width={150}
                height={50}
                className="object-contain brightness-125 contrast-125 drop-shadow-lg"
                style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
              />
            </div>
            
            <div className="flex items-center gap-8">
              <span className="text-gray-400 font-medium">Share Trip Plan with Others</span>
              <div className="flex gap-3">
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <span className="text-lg font-semibold">f</span>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <span className="text-lg font-semibold">t</span>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12 text-gray-500 text-sm font-medium">
            © 2025 GoPlanner - by Group 34
          </div>
        </footer>
      </main>
    </div>
  );
}
