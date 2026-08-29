'use client';

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PhoneVerificationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const phone = (session.user as any).phone;
      if (phone && phone.startsWith("GOOGLE_")) {
        if (pathname !== "/verify-phone" && !pathname.startsWith("/api/auth")) {
          router.replace("/verify-phone");
        }
      }
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}
