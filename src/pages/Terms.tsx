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
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <p className="text-muted-foreground">Last updated: January 1, 2026</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h2 className="font-display text-xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-6">
                By accessing or using EchoWave's services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you 
                are prohibited from using or accessing this site.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">2. Use License</h2>
              <p className="text-muted-foreground mb-6">
                Permission is granted to temporarily access the materials (information or software) on 
                EchoWave's website for personal, non-commercial transitory viewing only. This is the grant 
                of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>

              <h2 className="font-display text-xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground mb-6">
                When you create an account with us, you must provide accurate, complete, and current 
                information. You are responsible for safeguarding the password and for all activities 
                that occur under your account. You agree to notify us immediately of any unauthorized access.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">4. Listing Rules</h2>
              <p className="text-muted-foreground mb-6">
                All listings must comply with our community guidelines. Prohibited items include but are 
                not limited to: illegal goods, weapons, drugs, counterfeit items, stolen property, and 
                items that violate intellectual property rights. We reserve the right to remove any listing 
                that violates these rules.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">5. Transactions</h2>
              <p className="text-muted-foreground mb-6">
                EchoWave is a platform that connects buyers and sellers. We are not a party to any 
                transaction between users. All transactions are conducted at your own risk. We recommend 
                meeting in public places and using secure payment methods.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">6. Disclaimer</h2>
              <p className="text-muted-foreground mb-6">
                The materials on EchoWave's website are provided on an 'as is' basis. EchoWave makes no 
                warranties, expressed or implied, and hereby disclaims and negates all other warranties 
                including, without limitation, implied warranties or conditions of merchantability, fitness 
                for a particular purpose, or non-infringement of intellectual property.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">7. Limitations</h2>
              <p className="text-muted-foreground mb-6">
                In no event shall EchoWave or its suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit, or due to business interruption) arising 
                out of the use or inability to use the materials on EchoWave's website.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">8. Revisions</h2>
              <p className="text-muted-foreground mb-6">
                EchoWave may revise these terms of service at any time without notice. By using this 
                website you are agreeing to be bound by the then current version of these terms of service.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground mb-6">
                These terms and conditions are governed by and construed in accordance with the laws of 
                the State of California and you irrevocably submit to the exclusive jurisdiction of the 
                courts in that State.
              </p>

              <h2 className="font-display text-xl font-bold mb-4">10. Contact</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at{' '}
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
