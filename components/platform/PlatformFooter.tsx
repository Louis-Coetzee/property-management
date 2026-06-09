import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function PlatformFooter() {
  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#16911c] flex items-center justify-center">
                <span className="text-white font-bold text-sm">FA</span>
              </div>
              <span className="font-semibold text-white text-lg">Find Accommodation</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your trusted platform for finding and listing holiday accommodation across South Africa.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/listings" className="text-sm hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link href="/advertise" className="text-sm hover:text-white transition-colors">Advertise</Link></li>
              <li><Link href="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#16911c]" />
                info@findaccommodation.co.za
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#16911c]" />
                068 900 6679
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#16911c]" />
                South Africa, Richards Bay
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-800 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} Find Accommodation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
