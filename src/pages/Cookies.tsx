import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function Cookies() {
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
            <Cookie className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Cookie <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground">Last updated: January 1, 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="font-display text-xl font-bold mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground mb-6">
                Cookies are small text files that are stored on your computer or mobile device when you 
                visit a website. They are widely used to make websites work more efficiently and to 
                provide information to the owners of the site.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">How We Use Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies for various purposes, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li><strong>Essential cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our website</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Marketing cookies:</strong> Track visitors across websites for advertising purposes</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">Types of Cookies We Use</h2>
              
              <h3 className="font-display text-lg font-semibold mb-2 mt-6">Essential Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for the website to function and cannot be switched off. 
                They are usually only set in response to actions made by you, such as setting your 
                privacy preferences, logging in, or filling in forms.
              </p>

              <h3 className="font-display text-lg font-semibold mb-2 mt-6">Analytics Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies allow us to count visits and traffic sources so we can measure and 
                improve the performance of our site. They help us know which pages are the most and 
                least popular and see how visitors move around the site.
              </p>

              <h3 className="font-display text-lg font-semibold mb-2 mt-6">Preference Cookies</h3>
              <p className="text-muted-foreground mb-4">
                These cookies enable the website to provide enhanced functionality and personalization. 
                They may be set by us or by third-party providers whose services we have added to our pages.
              </p>

              <h3 className="font-display text-lg font-semibold mb-2 mt-6">Marketing Cookies</h3>
              <p className="text-muted-foreground mb-6">
                These cookies may be set through our site by our advertising partners. They may be used 
                by those companies to build a profile of your interests and show you relevant ads on 
                other sites.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Most web browsers allow you to control cookies through their settings preferences. 
                However, if you limit the ability of websites to set cookies, you may worsen your 
                overall user experience.
              </p>
              <p className="text-muted-foreground mb-6">
                You can manage your cookie preferences in your browser settings:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Chrome: Settings → Privacy and security → Cookies</li>
                <li>Firefox: Settings → Privacy & Security → Cookies</li>
                <li>Safari: Preferences → Privacy → Cookies</li>
                <li>Edge: Settings → Privacy, search, and services → Cookies</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-6">
                In addition to our own cookies, we may also use various third-party cookies to report 
                usage statistics of the Service and deliver advertisements on and through the Service.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">Updates to This Policy</h2>
              <p className="text-muted-foreground mb-6">
                We may update this Cookie Policy from time to time. We encourage you to periodically 
                review this page for the latest information on our cookie practices.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies, please contact us at{' '}
                <Link to="/contact" className="text-primary hover:underline">our contact page</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
