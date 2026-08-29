'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Menu, X, User, LogOut, ChevronDown, Plus, Sparkles, Home, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

const ALL_SERVICES: ServiceItem[] = [
  { key: 'vibe_upgrade_catalog', label: 'Vibe Upgrade Catalog', href: '/services/vibe-upgrade', icon: Sparkles },
  { key: 'living_services', label: 'Living Services', href: '/services/living', icon: Home, comingSoon: true },
  { key: 'legal_services', label: 'Legal Services', href: '/services/legal', icon: ShieldAlert, comingSoon: true },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState<string[]>([]);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Fetch which features are visible for the current user
  useEffect(() => {
    fetch('/api/features/visible')
      .then((r) => r.json())
      .then((data) => {
        setVisibleFeatures(data.visibleFeatures || []);
        setFeaturesLoaded(true);
      })
      .catch(() => {
        // Fail open — show nothing until loaded
        setFeaturesLoaded(true);
      });
  }, [session]);

  // Filter services to visible ones only
  const visibleServices = featuresLoaded
    ? ALL_SERVICES.filter((s) => visibleFeatures.includes(s.key))
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="bg-brand-primary bg-clip-text text-xl font-bold tracking-tight text-transparent">
            FlatNFlatmates.in
          </span>
          <span className="text-[10px] font-semibold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
            Pune
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/search/flats"
            className={`text-sm font-medium transition-colors hover:text-brand-primary ${isActive("/search/flats") ? "text-brand-primary font-semibold" : "text-gray-600"
              }`}
          >
            Search Flats
          </Link>
          <Link
            href="/search/flatmates"
            className={`text-sm font-medium transition-colors hover:text-brand-primary ${isActive("/search/flatmates") ? "text-brand-primary font-semibold" : "text-gray-600"
              }`}
          >
            Find Flatmates
          </Link>

          {/* Services Dropdown — only shown when there are visible services */}
          {featuresLoaded && visibleServices.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                onBlur={() => setTimeout(() => setServicesDropdownOpen(false), 200)}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-brand-primary ${pathname.startsWith("/services") ? "text-brand-primary font-semibold" : "text-gray-600"
                  }`}
              >
                <span>Services</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {servicesDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {visibleServices.map((service, idx) => {
                    const Icon = service.icon;
                    return (
                      <span key={service.key}>
                        {idx > 0 && <div className="border-t my-1" />}
                        <Link
                          href={service.href}
                          className={`flex items-center px-4 py-2 text-sm ${service.comingSoon ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {service.label}
                          {service.comingSoon && ' (Soon)'}
                        </Link>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/list-property">
            <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-primary/10">
              <Plus className="mr-0 h-4 w-4" /> Post Property <span className="text-brand-primary font-semibold bg-brand-primary/10 rounded-sm text-xs px-2">Free</span>
            </Button>
          </Link>

          {session ? (
            <div className="flex items-center space-x-3">
              {session.user && (session.user as any).role !== "user" && (session.user as any).role !== "owner" && (session.user as any).role !== "tester" && (
                <Link href="/admin">
                  <Button size="sm" variant="ghost" className="text-gray-600 hover:text-brand-primary">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile" className="flex items-center space-x-1.5 text-sm font-medium text-gray-700 hover:text-brand-primary">
                <div className="h-8 w-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary font-bold border border-brand-primary/20">
                  {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-brand-primary text-white hover:bg-brand-primaryHover">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center space-x-2">
          {session && (
            <Link href="/profile" className="h-8 w-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-brand-primary font-bold">
              {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-white px-4 pb-4 pt-2 shadow-inner">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/search/flats"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/search/flats") ? "bg-brand-primary/10 text-brand-primary" : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              Search Flats
            </Link>
            <Link
              href="/search/flatmates"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/search/flatmates") ? "bg-brand-primary/10 text-brand-primary" : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              Find Flatmates
            </Link>

            {/* Visible service links on mobile */}
            {visibleServices.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.key}
                  href={service.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isActive(service.href) ? "bg-brand-primary/10 text-brand-primary" : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="mr-2 h-4 w-4 text-brand-primary" />
                  {service.label}{service.comingSoon ? ' (Soon)' : ''}
                </Link>
              );
            })}

            <Link
              href="/list-property"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-brand-primary hover:bg-brand-primary/10 flex items-center border border-dashed border-brand-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Post Property <span className="text-brand-primary font-semibold bg-brand-primary/10 rounded-sm text-xs px-2 ml-2">Free</span>
            </Link>
            {session ? (
              <>
                {session.user && (session.user as any).role !== "user" && (session.user as any).role !== "owner" && (session.user as any).role !== "tester" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 text-left flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-brand-primary text-white hover:bg-brand-primaryHover text-center"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
