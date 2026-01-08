import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/Footer';

export default function FAQ() {
  const { t } = useTranslation();

  const faqs = {
    general: [
      {
        question: 'What is this platform?',
        answer: 'This is a trusted online marketplace where you can buy and sell items locally. We connect buyers and sellers in your community, making it easy to find great deals and sell items you no longer need.',
      },
      {
        question: 'Is it free to use?',
        answer: 'Yes! Creating an account and browsing listings is completely free. We offer optional premium features for sellers who want more visibility for their listings.',
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top right corner of the page. You can register using your email address. The process takes less than a minute!',
      },
    ],
    buying: [
      {
        question: 'How do I contact a seller?',
        answer: 'Click on any listing to view its details, then click the "Contact Seller" button. This will open a chat where you can message the seller directly.',
      },
      {
        question: 'Can I negotiate prices?',
        answer: 'Absolutely! Many sellers are open to negotiation. Use our messaging system to discuss pricing with the seller.',
      },
      {
        question: 'How do I pay for items?',
        answer: 'Payment methods are arranged directly between buyers and sellers. We recommend cash for in-person transactions or trusted payment services for remote deals.',
      },
    ],
    selling: [
      {
        question: 'How do I create a listing?',
        answer: 'Click "Create Listing" in the navigation menu. Fill in the details about your item, upload photos, set your price, and publish. Your listing will be visible after a quick review.',
      },
      {
        question: 'How many photos can I add?',
        answer: 'You can add up to 10 photos per listing. We recommend including multiple angles and close-ups of any important details.',
      },
      {
        question: 'How long do listings stay active?',
        answer: 'Listings remain active for 30 days. You can renew, edit, or mark items as sold at any time from your dashboard.',
      },
      {
        question: 'Why was my listing rejected?',
        answer: 'Listings may be rejected if they violate our community guidelines. Check your email for specific reasons and make the necessary changes to resubmit.',
      },
    ],
    safety: [
      {
        question: 'Is it safe to meet strangers?',
        answer: 'We recommend meeting in public places during daylight hours. Many users choose locations like coffee shops, shopping centers, or police station parking lots for transactions.',
      },
      {
        question: 'How do I report a suspicious listing?',
        answer: 'Click the "Report" button on any listing to flag it for review. Our team investigates all reports within 24 hours.',
      },
      {
        question: 'What if I get scammed?',
        answer: 'Contact our support team immediately with all relevant details. While we cannot guarantee refunds for off-platform transactions, we take fraud seriously and will investigate.',
      },
    ],
  };

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
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
            <HelpCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {t('footer.faq.subtitle')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t('footer.faq.description')}
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-3xl mx-auto space-y-12">
          {/* General */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">{t('footer.faq.general')}</h2>
            <Accordion type="single" collapsible className="bg-card rounded-xl border border-border/50">
              {faqs.general.map((faq, index) => (
                <AccordionItem key={index} value={`general-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-secondary/50">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Buying */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">{t('footer.faq.buying')}</h2>
            <Accordion type="single" collapsible className="bg-card rounded-xl border border-border/50">
              {faqs.buying.map((faq, index) => (
                <AccordionItem key={index} value={`buying-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-secondary/50">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Selling */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">{t('footer.faq.selling')}</h2>
            <Accordion type="single" collapsible className="bg-card rounded-xl border border-border/50">
              {faqs.selling.map((faq, index) => (
                <AccordionItem key={index} value={`selling-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-secondary/50">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Safety */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">{t('footer.safetyTips.title')}</h2>
            <Accordion type="single" collapsible className="bg-card rounded-xl border border-border/50">
              {faqs.safety.map((faq, index) => (
                <AccordionItem key={index} value={`safety-${index}`} className="border-border/50">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-secondary/50">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Still Have Questions */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-4">{t('footer.helpCenter.contactSupport')}</h2>
            <p className="mb-6 opacity-90">
              {t('footer.contact.description')}
            </p>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                {t('footer.contact.title')}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
