'use client';

import PlatformNavbar from '@/components/platform/PlatformNavbar';
import PlatformFooter from '@/components/platform/PlatformFooter';
import Link from 'next/link';
import {
  Home, TrendingUp, Mail, Bell, Settings, Upload, Image as ImageIcon, Users,
  CheckCircle, ArrowRight, Shield, Zap, Camera, ChevronDown, Globe, BarChart3,
  MessageSquare, Calendar, CreditCard, Award, Target, Sparkles, Headphones,
} from 'lucide-react';
import { useState } from 'react';

const faqItems = [
  {
    question: 'How much does it cost to list my property?',
    answer: 'Listing your property is completely free. We charge a 12% commission only on successful bookings. There are no setup fees, monthly subscriptions, or hidden charges.',
  },
  {
    question: 'How do I get paid?',
    answer: 'Once a guest completes their stay, we transfer the payment to your bank account, minus the 12% service fee. Payments are processed within 5 business days.',
  },
  {
    question: 'Can I manage my own calendar and availability?',
    answer: 'Yes! You have full control over your availability calendar, pricing, and property details through your dashboard. You can update anything anytime.',
  },
  {
    question: 'What if I need help with my listing?',
    answer: 'Our team provides full support including photo upload assistance, listing optimisation, and guest communication. You can choose to self-manage or let us handle bookings for you.',
  },
  {
    question: 'How do guests find my property?',
    answer: 'Your property is showcased on Find Accommodation where thousands of travellers search for holiday stays across South Africa. We also use SEO and marketing to drive traffic to listings.',
  },
  {
    question: 'Can I list multiple properties?',
    answer: 'Absolutely. There is no limit to the number of properties you can list. Each property gets its own listing page with up to 10 photos.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border-b border-stone-200 transition-colors duration-200 ${isOpen ? 'border-stone-300' : ''}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-start justify-between py-6 text-left group">
        <span className={`font-medium text-base pr-8 transition-colors duration-200 ${isOpen ? 'text-[#16911c]' : 'text-stone-800 group-hover:text-stone-900'}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem' }}>
          {question}
        </span>
        <span className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? 'border-[#16911c] bg-[#16911c] text-white rotate-180' : 'border-stone-300 text-stone-400 group-hover:border-stone-400'}`}>
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-stone-600 leading-relaxed text-base">{answer}</p>
      </div>
    </div>
  );
}

export default function AdvertisePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans { font-family: 'DM Sans', system-ui, sans-serif; }
        .hero-grid { background-image: linear-gradient(rgba(22,145,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,145,28,0.04) 1px, transparent 1px); background-size: 60px 60px; }
        .feature-card { position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #16911c, transparent); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover::before { opacity: 1; }
        .stat-divider { position: relative; }
        .stat-divider + .stat-divider::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 1px; background: rgba(87,83,78,0.15); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.22s; }
        .fade-up-3 { animation-delay: 0.34s; }
        .fade-up-4 { animation-delay: 0.46s; }
      `}</style>

      <div className="min-h-screen bg-stone-50 sans">
        <PlatformNavbar />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden bg-white hero-grid">
            <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #16911c 0%, transparent 70%)' }} />
            <div className="relative container mx-auto px-6 lg:px-8 pt-24 pb-28 md:pt-32 md:pb-36">
              <div className="max-w-5xl mx-auto">
                <div className="fade-up fade-up-1 flex items-center gap-3 mb-8">
                  <div className="h-px w-12 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Find Accommodation — Host Programme</span>
                </div>
                <h1 className="fade-up fade-up-2 serif text-5xl md:text-7xl lg:text-8xl font-light text-stone-900 leading-[1.05] mb-8">
                  Your Property.<br />
                  <em className="text-[#16911c] not-italic font-semibold">Our Platform.</em><br />
                  Shared Success.
                </h1>
                <p className="fade-up fade-up-3 text-stone-500 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-12">
                  List your South African holiday accommodation and reach thousands of travellers — with zero upfront cost, and a commission only when you earn.
                </p>
                <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <button className="group inline-flex items-center gap-3 bg-[#16911c] text-white px-8 py-4 text-base font-medium tracking-wide hover:bg-[#0d6b11] transition-colors duration-200">
                      Start Listing Today
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </Link>
                  <Link href="/listings">
                    <button className="inline-flex items-center gap-3 border border-stone-300 text-stone-700 px-8 py-4 text-base font-medium tracking-wide hover:border-stone-500 hover:text-stone-900 transition-colors duration-200 bg-transparent">
                      Browse Listings
                    </button>
                  </Link>
                </div>
                <div className="mt-16 flex flex-wrap gap-8 items-center">
                  {[{ icon: Shield, label: 'No Setup Fees' }, { icon: CreditCard, label: 'Pay Only When You Earn' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-stone-500">
                      <Icon className="h-4 w-4 text-[#16911c]" />
                      <span className="text-sm font-medium tracking-wide uppercase">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-white border-y border-[#16911c]/20" style={{ boxShadow: '0 0 30px rgba(22,145,28,0.06)' }}>
            <div className="container mx-auto px-6 lg:px-8">
              <div className="grid grid-cols-3">
                {[{ icon: Globe, value: 'Multiple', label: 'List Properties' }, { icon: BarChart3, value: '12%', label: 'Commission Only' }, { icon: Award, value: 'R0', label: 'Setup Cost' }].map(({ icon: Icon, value, label }, i) => (
                  <div key={label} className={`stat-divider text-center py-12 px-6 ${i < 2 ? 'border-r border-[#16911c]/10' : ''}`}>
                    <Icon className="h-5 w-5 text-[#16911c] mx-auto mb-4" />
                    <div className="serif text-4xl md:text-5xl text-stone-900 font-light mb-2">{value}</div>
                    <div className="text-stone-500 text-sm font-medium tracking-widest uppercase">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-8 bg-[#16911c]" />
                    <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Simple Pricing</span>
                  </div>
                  <h2 className="serif text-4xl md:text-5xl font-light text-stone-900 leading-tight mb-6">
                    One straightforward<br />
                    <em className="font-semibold not-italic">commission model.</em>
                  </h2>
                  <p className="text-stone-500 leading-relaxed mb-8">
                    No monthly fees. No subscription tiers. No surprises. You list for free and only pay a 12% commission on confirmed bookings — after your guest checks in.
                  </p>
                  <div className="space-y-4">
                    {['Free to list — no credit card required', 'Commission charged only after check-in', 'Payout within 5 business days', 'Unlimited properties at no extra cost'].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-[#16911c] flex-shrink-0" />
                        <span className="text-stone-700 text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 translate-x-3 translate-y-3 border border-[#16911c]/30" />
                  <div className="relative bg-white p-10 border border-[#16911c]/20" style={{ boxShadow: '0 0 40px rgba(22,145,28,0.08)' }}>
                    <div className="mb-8">
                      <div className="serif text-8xl font-light text-stone-900 leading-none mb-1">
                        12<span className="text-[#16911c] text-5xl align-top mt-4 inline-block">%</span>
                      </div>
                      <p className="text-stone-500 text-base">per successful booking</p>
                    </div>
                    <div className="space-y-4 mb-10">
                      {[{ icon: Shield, title: 'No Setup Cost', desc: 'List your property free' }, { icon: TrendingUp, title: 'Pay on Success', desc: 'Only when you get bookings' }, { icon: Zap, title: 'Instant Exposure', desc: 'Live within 24 hours' }].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-[#16911c]/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-[#16911c]" />
                          </div>
                          <div>
                            <div className="text-stone-900 text-base font-medium">{title}</div>
                            <div className="text-stone-500 text-sm">{desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/auth/register">
                      <button className="group w-full flex items-center justify-center gap-3 bg-[#16911c] text-white py-4 text-base font-medium tracking-wide hover:bg-[#0d6b11] transition-colors duration-200">
                        Get Started Free
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-28 bg-stone-50">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">The Process</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                  <h2 className="serif text-4xl md:text-5xl font-light text-stone-900 leading-tight">
                    From listing to payout<br />
                    <em className="font-semibold not-italic">in five steps.</em>
                  </h2>
                  <p className="text-stone-500 text-base max-w-xs">A streamlined process designed to get you earning with minimal effort.</p>
                </div>
                <div className="grid md:grid-cols-5 gap-0">
                  {[{ num: '01', title: 'Register & List', desc: 'Create your profile and add your property details', icon: Target }, { num: '02', title: 'Guest Enquiries', desc: 'Receive instant notifications from interested guests', icon: MessageSquare }, { num: '03', title: 'Confirm Booking', desc: 'Approve the booking and guest(s) gets notified', icon: Calendar }, { num: '04', title: 'Payment Secured', desc: 'Guest payment confirms and secures the stay', icon: CreditCard }, { num: '05', title: 'Get Paid', desc: 'Receive your payout after check-in, less 12%', icon: TrendingUp }].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.num} className={`p-6 border-l border-t border-stone-200 bg-white group hover:border-[#16911c]/30 hover:bg-[#16911c]/5 transition-colors duration-300 ${i === 4 ? 'border-r' : ''}`}>
                        <div className="text-[#16911c] text-sm font-medium tracking-widest mb-4">{step.num}</div>
                        <Icon className="h-5 w-5 text-stone-400 group-hover:text-[#16911c] mb-4 transition-colors" />
                        <h3 className="font-medium text-stone-900 group-hover:text-[#16911c] text-base mb-2 transition-colors">{step.title}</h3>
                        <p className="text-stone-500 group-hover:text-stone-600 text-sm leading-relaxed transition-colors">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="h-px bg-stone-200" />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Platform Features</span>
                </div>
                <h2 className="serif text-4xl md:text-5xl font-light text-stone-900 leading-tight mb-16">
                  Everything you need<br />
                  <em className="font-semibold not-italic">to succeed as a host.</em>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-100">
                  {[{ icon: Home, title: 'Multiple Listings', desc: 'List as many properties as you own — no limit, no extra charge.' }, { icon: ImageIcon, title: 'Up to 10 Photos', desc: 'Showcase your property with high-quality images per listing.' }, { icon: Camera, title: 'Upload Assistance', desc: 'Our team helps you upload and organise your property photos.' }, { icon: Mail, title: 'Email Notifications', desc: 'Get instant alerts for new bookings and guest inquiries.' }, { icon: Settings, title: 'Self-Manage Listings', desc: 'Full control over availability, pricing, and property details.' }, { icon: Users, title: 'We Handle Bookings', desc: 'Our team manages guest communication and coordination.' }, { icon: Bell, title: 'Real-Time Alerts', desc: 'Instant notifications for all booking activity on your properties.' }, { icon: Upload, title: 'Easy Media Management', desc: 'Organise images with categories and reuse across listings.' }, { icon: CheckCircle, title: 'Verified Listings', desc: 'Build trust with verified property badges and authentic reviews.' }].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="feature-card bg-white p-8 group hover:border-[#16911c]/30 hover:bg-[#16911c]/5 transition-colors duration-300">
                      <Icon className="h-5 w-5 text-[#16911c] mb-5 group-hover:text-[#16911c] transition-colors" />
                      <h3 className="font-medium text-stone-900 group-hover:text-[#16911c] text-base mb-2 transition-colors">{title}</h3>
                      <p className="text-stone-500 group-hover:text-stone-600 text-sm leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="py-16 bg-stone-50">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-16">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Why Find Accommodation</span>
                </div>
                <div className="grid md:grid-cols-2 gap-16">
                  <div>
                    <div className="flex items-center gap-3 mb-2"><span className="serif text-stone-400 text-base italic">For Hosts</span></div>
                    <h3 className="serif text-3xl font-light text-stone-900 mb-8 leading-snug">Built for owners<br /><em className="font-semibold not-italic">who want results.</em></h3>
                    <div className="space-y-5">
                      {['Get started with zero upfront costs', 'Unlimited property listings', 'We handle all guest inquiries and bookings', 'Professional booking coordination', 'Only pay commission on confirmed bookings', 'Full dashboard to manage your properties'].map((item) => (
                        <div key={item} className="flex items-start gap-4">
                          <div className="mt-0.5 w-5 h-5 border border-[#16911c] flex items-center justify-center flex-shrink-0"><CheckCircle className="h-3 w-3 text-[#16911c]" /></div>
                          <span className="text-stone-600 text-base leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:border-l md:border-stone-200 md:pl-16">
                    <div className="flex items-center gap-3 mb-2"><span className="serif text-stone-400 text-base italic">For Guests</span></div>
                    <h3 className="serif text-3xl font-light text-stone-900 mb-8 leading-snug">A platform guests<br /><em className="font-semibold not-italic">implicitly trust.</em></h3>
                    <div className="space-y-5">
                      {['Wide selection of verified properties', 'Secure booking and payment process', 'Professional support team available', 'Transparent pricing with no hidden fees', 'Payment handled by Find Accommodation', 'Multiple payment options'].map((item) => (
                        <div key={item} className="flex items-start gap-4">
                          <div className="mt-0.5 w-5 h-5 border border-[#16911c] flex items-center justify-center flex-shrink-0"><CheckCircle className="h-3 w-3 text-[#16911c]" /></div>
                          <span className="text-stone-600 text-base leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Common Questions</span>
                </div>
                <h2 className="serif text-4xl md:text-5xl font-light text-stone-900 mb-4 leading-tight">
                  Frequently asked<br /><em className="font-semibold not-italic">questions.</em>
                </h2>
                <p className="text-stone-500 text-base mb-14">Everything you need to know about listing your property.</p>
                <div className="border-t border-stone-200">
                  {faqItems.map((item, i) => (
                    <FAQItem key={i} question={item.question} answer={item.answer} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="relative overflow-hidden py-16 bg-white border border-[#16911c]/20 mx-4 md:mx-8 my-4" style={{ boxShadow: '0 0 40px rgba(22,145,28,0.06)' }}>
            <div className="pointer-events-none absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #16911c 0%, transparent 70%)' }} />
            <div className="relative container mx-auto px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-[#16911c]" />
                  <span className="text-[#16911c] text-sm font-medium tracking-[0.2em] uppercase">Get Started</span>
                </div>
                <h2 className="serif text-5xl md:text-6xl lg:text-7xl font-light text-stone-900 leading-tight mb-8">
                  Ready to grow<br />your property<br /><em className="text-[#16911c] font-semibold not-italic">business?</em>
                </h2>
                <p className="text-stone-500 text-lg max-w-md mb-12 leading-relaxed">
                  Join hundreds of owners already earning through Find Accommodation. No upfront cost — get started today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <button className="group inline-flex items-center gap-3 bg-[#16911c] text-white px-8 py-4 text-base font-medium tracking-wide hover:bg-[#0d6b11] transition-colors duration-200">
                      Create Your Listing
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </Link>
                  <Link href="/contact">
                    <button className="inline-flex items-center gap-3 border border-stone-300 text-stone-600 px-8 py-4 text-base font-medium tracking-wide hover:border-[#16911c] hover:text-[#16911c] transition-colors duration-200 bg-transparent">
                      Talk to Our Team
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <PlatformFooter />
      </div>
    </>
  );
}
