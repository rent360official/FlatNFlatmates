import React from 'react';
import Link from 'next/link';
import { Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CTAButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto justify-center lg:justify-start">
      <Link href="/search/flats" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primaryHover text-white font-bold rounded-full px-8 py-5 sm:py-6 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none">
          <Home className="h-5 w-5" />
          Find a Flat
        </Button>
      </Link>
      <Link href="/search/flatmates" className="w-full sm:w-auto">
        <Button className="w-full sm:w-auto bg-brand-secondary hover:bg-brand-secondaryHover text-white font-bold rounded-full px-8 py-5 sm:py-6 text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:outline-none">
          <Users className="h-5 w-5" />
          Find a Flatmate
        </Button>
      </Link>
    </div>
  );
}
