import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('footer.terms.title')}
          </h1>
          <p className="text-muted-foreground">{t('footer.terms.lastUpdated')}: January 1, 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="font-display text-xl font-bold mb-4">1. {t('footer.terms.acceptance')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('footer.terms.description')}
              </p>

              <h2 className="font-display text-xl font-bold mb-4">2. {t('footer.terms.userConduct')}</h2>
              <p className="text-muted-foreground mb-6">
                Permission is granted to temporarily access the materials (information or software) on 
                our website for personal, non-commercial transitory viewing only. This is the grant 
                of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">3. {t('footer.terms.intellectualProperty')}</h2>
              <p className="text-muted-foreground mb-6">
                When you create an account with us, you must provide accurate, complete, and current 
                information. You are responsible for safeguarding the password and for all activities 
                that occur under your account. You agree to notify us immediately of any unauthorized access.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">4. {t('footer.terms.limitation')}</h2>
              <p className="text-muted-foreground mb-6">
                All listings must comply with our community guidelines. Prohibited items include but are 
                not limited to: illegal goods, weapons, drugs, counterfeit items, stolen property, and 
                items that violate intellectual property rights. We reserve the right to remove any listing 
                that violates these rules.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">5. Contact</h2>
              <p className="text-muted-foreground">
                {t('footer.contact.description')}{' '}
                <Link to="/contact" className="text-primary hover:underline">{t('footer.contact.title')}</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
