import { Clock } from 'lucide-react';

interface ComingSoonSectionProps {
  type: string;
  title?: string;
  description?: string;
}

export function ComingSoonSection({ type, title, description }: ComingSoonSectionProps) {
  const displayTitle = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Section`;
  const displayDescription = description || 'This section type will be available soon.';

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100 border-y border-slate-200">
      <div className="container mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 mb-6 shadow-inner">
          <Clock className="h-10 w-10 text-slate-500" />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-4">{displayTitle}</h2>

        <p className="text-lg text-slate-600 mb-6">{displayDescription}</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-amber-800">Coming Soon</span>
        </div>
      </div>
    </section>
  );
}
