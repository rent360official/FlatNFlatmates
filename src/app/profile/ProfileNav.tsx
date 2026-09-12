'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Users, Home, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProfileNav({ name }: { name: string }) {
  const pathname = usePathname();

  const items = [
    { name: "Personal Info", href: "/profile", icon: User },
    { name: "Roommate Settings", href: "/profile/roommate", icon: Users },
    { name: "My Properties & Analytics", href: "/profile/properties", icon: Home },
  ];

  const isActive = (href: string) => {
    if (href === "/profile") {
      return pathname === "/profile";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="space-y-1 bg-white border rounded-xl p-4 shadow-sm">
      <div className="px-3 py-2 border-b mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Account</p>
        <h3 className="text-sm font-bold text-gray-800 truncate mt-0.5">{name}</h3>
      </div>
      
      {items.map((item) => {
        const Icon = item.icon;
        const Active = isActive(item.href);
        return (
          <Link key={item.name} href={item.href}>
            <div className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              Active 
                ? "bg-brand-primary/10 text-brand-primaryHover border border-brand-primary/15 font-semibold" 
                : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
            }`}>
              <Icon className={`h-4.5 w-4.5 ${Active ? "text-brand-primary" : "text-gray-400"}`} />
              <span>{item.name}</span>
            </div>
          </Link>
        );
      })}

      <div className="border-t pt-2 mt-2">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left"
        >
          <LogOut className="h-4.5 w-4.5 text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
