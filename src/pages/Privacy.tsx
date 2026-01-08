import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function Privacy() {
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
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('footer.privacy.title')}
          </h1>
          <p className="text-muted-foreground">{t('footer.terms.lastUpdated')}: January 1, 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground mb-6">{t('footer.privacy.description')}</p>

              <h2 className="font-display text-xl font-bold mb-4">1. {t('footer.privacy.dataCollection')}</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                create a listing, communicate with other users, or contact us for support.
              </p>
              <p className="text-muted-foreground mb-6">
                This information may include: name, email address, phone number, location, profile 
                information, listing details, and any other information you choose to provide.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">2. {t('footer.privacy.dataUsage')}</h2>
              <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
                <li>Personalize and improve your experience</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">3. {t('footer.privacy.dataSecurity')}</h2>
              <p className="text-muted-foreground mb-6">
                We take reasonable measures to help protect information about you from loss, theft, 
                misuse, unauthorized access, disclosure, alteration, and destruction. We use encryption 
                to protect data transmitted to and from our site and store all data on secure servers.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">4. {t('footer.privacy.cookies')}</h2>
              <p className="text-muted-foreground mb-6">
                We use cookies and similar tracking technologies to collect information about your 
                browsing activities. You can instruct your browser to refuse all cookies or to indicate 
                when a cookie is being sent. However, some features of our service may not function 
                properly without cookies.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">5. {t('footer.privacy.yourRights')}</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">6. {t('footer.contact.title')}</h2>
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
