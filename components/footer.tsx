'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function Footer() {
  const sites = useQuery(api.sites.getAllSites);
  const mainSite = sites && sites.length > 0 ? sites[0] : null;
  const socialMediaSettings = mainSite?.settings?.socialMedia;

  const socialLinks: Array<{ name: string; href: string; icon: any; color: string }> = [];
  if (socialMediaSettings?.facebookEnabled && socialMediaSettings?.facebook) {
    socialLinks.push({ name: 'Facebook', href: socialMediaSettings.facebook, icon: Facebook, color: '#1877f2' });
  }
  if (socialMediaSettings?.instagramEnabled && socialMediaSettings?.instagram) {
    socialLinks.push({ name: 'Instagram', href: socialMediaSettings.instagram, icon: Instagram, color: '#E4405F' });
  }
  if (socialMediaSettings?.twitterEnabled && socialMediaSettings?.twitter) {
    socialLinks.push({ name: 'Twitter', href: socialMediaSettings.twitter, icon: Twitter, color: '#1da1f2' });
  }
  if (socialMediaSettings?.linkedinEnabled && socialMediaSettings?.linkedin) {
    socialLinks.push({ name: 'LinkedIn', href: socialMediaSettings.linkedin, icon: Linkedin, color: '#0077b5' });
  }
  if (socialMediaSettings?.youtubeEnabled && socialMediaSettings?.youtube) {
    socialLinks.push({ name: 'YouTube', href: socialMediaSettings.youtube, icon: Youtube, color: '#ff0000' });
  }

  const displaySocialLinks = socialLinks.length > 0 ? socialLinks : [
    { name: 'Facebook', href: 'https://facebook.com/people/Find-Accommodation/61578064222800/', icon: Facebook, color: '#1877f2' },
    { name: 'Instagram', href: 'https://instagram.com', icon: Instagram, color: '#E4405F' },
    { name: 'Twitter', href: 'https://twitter.com', icon: Twitter, color: '#1da1f2' },
  ];

  const quickLinks = [
    { name: 'Browse Listings', href: '/listings' },
    { name: 'Advertise With Us', href: '/advertise' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];

  return (
    <footer className="sans bg-white border-t border-stone-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <span className="serif text-3xl font-bold text-stone-700">Find</span>
              <span className="serif text-3xl font-bold text-[#0d6b11] ml-1">Accommodation</span>
            </Link>
            <p className="text-stone-600 text-sm leading-relaxed max-w-xs">
              Your trusted platform for finding and listing holiday accommodation in South Africa.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {displaySocialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center border border-stone-200 bg-white text-stone-400 hover:border-[#16911c] hover:bg-[#16911c]/5 hover:text-[#16911c] transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-stone-900 tracking-widest uppercase">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-stone-600 hover:text-[#16911c] transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-stone-900 tracking-widest uppercase">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 flex items-center justify-center bg-[#16911c]/10 rounded-lg group-hover:bg-[#16911c]/20 transition-colors">
                  <Mail className="h-4 w-4 text-[#16911c]" />
                </div>
                <a href="mailto:info@findaccommodation.co.za" className="text-stone-600 hover:text-[#16911c] transition-colors">
                  info@findaccommodation.co.za
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 flex items-center justify-center bg-[#16911c]/10 rounded-lg group-hover:bg-[#16911c]/20 transition-colors">
                  <Phone className="h-4 w-4 text-[#16911c]" />
                </div>
                <a href="tel:0689006679" className="text-stone-600 hover:text-[#16911c] transition-colors">
                  068 900 6679
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 flex items-center justify-center bg-[#16911c]/10 rounded-lg group-hover:bg-[#16911c]/20 transition-colors">
                  <MapPin className="h-4 w-4 text-[#16911c]" />
                </div>
                <span className="text-stone-600">Richards Bay, South Africa</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
