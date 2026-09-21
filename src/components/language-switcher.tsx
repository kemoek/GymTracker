'use client';

import { useLanguage, Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ variant = 'ghost', size = 'sm' }: { variant?: 'ghost' | 'outline' | 'default'; size?: 'sm' | 'default' }) {
  const { locale, setLocale } = useLanguage();

  const toggleLanguage = () => {
    setLocale(locale === 'tr' ? 'en' : 'tr');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 h-8 rounded-lg"
      title={locale === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === 'tr' ? 'TR' : 'EN'}</span>
    </Button>
  );
}
