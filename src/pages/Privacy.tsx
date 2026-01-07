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
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground">Last updated: January 1, 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="font-display text-xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                create a listing, communicate with other users, or contact us for support.
              </p>
              <p className="text-muted-foreground mb-6">
                This information may include: name, email address, phone number, location, profile 
                information, listing details, and any other information you choose to provide.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">2. How We Use Your Information</h2>
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

              <h2 className="font-display text-xl font-bold mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground mb-6">
                We may share information about you as follows or as otherwise described in this Privacy 
                Policy: with other users when you create listings or engage in transactions; with vendors, 
                consultants, and service providers who need access to such information to carry out work 
                on our behalf; in response to legal process or government requests; or with your consent.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground mb-6">
                We take reasonable measures to help protect information about you from loss, theft, 
                misuse, unauthorized access, disclosure, alteration, and destruction. We use encryption 
                to protect data transmitted to and from our site and store all data on secure servers.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">5. Cookies</h2>
              <p className="text-muted-foreground mb-6">
                We use cookies and similar tracking technologies to collect information about your 
                browsing activities. You can instruct your browser to refuse all cookies or to indicate 
                when a cookie is being sent. However, some features of our service may not function 
                properly without cookies.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground mb-6">
                We retain your personal data only for as long as necessary to fulfill the purposes for 
                which it was collected, including to satisfy legal, accounting, or reporting requirements. 
                When you delete your account, we will delete or anonymize your data within 30 days.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground mb-6">
                Our services are not directed to children under 18. We do not knowingly collect personal 
                information from children under 18. If we learn we have collected personal information 
                from a child under 18, we will delete that information promptly.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-6">
                We may change this Privacy Policy from time to time. If we make changes, we will notify 
                you by revising the date at the top of the policy and, in some cases, we may provide 
                additional notice such as adding a statement to our homepage or sending you a notification.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <Link to="/contact" className="text-primary hover:underline">our contact page</Link> or 
                email us at privacy@echowave.com.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
