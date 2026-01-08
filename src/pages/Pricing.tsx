import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Zap, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/Footer';

export default function Pricing() {
  const { t } = useTranslation();

  const plans = [
    {
      nameKey: 'footer.pricing.basic',
      icon: Zap,
      priceKey: 'footer.pricing.free',
      period: '',
      description: 'Perfect for occasional sellers',
      features: [
        'Up to 3 active listings',
        'Basic analytics',
        'Standard support',
        'Email notifications',
        '30-day listing duration',
      ],
      ctaKey: 'footer.pricing.getStarted',
      popular: false,
    },
    {
      nameKey: 'footer.pricing.gold',
      icon: Crown,
      price: '$9.99',
      periodKey: 'footer.pricing.perMonth',
      description: 'For regular sellers who want more',
      features: [
        'Up to 15 active listings',
        'Priority placement in search',
        'Advanced analytics',
        'Priority support',
        'Featured badge',
        '60-day listing duration',
        'No commission fees',
      ],
      ctaKey: 'footer.pricing.upgrade',
      popular: true,
    },
    {
      nameKey: 'footer.pricing.premium',
      icon: Rocket,
      price: '$24.99',
      periodKey: 'footer.pricing.perMonth',
      description: 'For power sellers and businesses',
      features: [
        'Unlimited active listings',
        'Top placement in search',
        'Real-time analytics dashboard',
        '24/7 priority support',
        'Verified seller badge',
        '90-day listing duration',
        'No commission fees',
        'Custom branding',
        'API access',
      ],
      ctaKey: 'footer.pricing.upgrade',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'Can I change my plan later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and Apple Pay.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. You can cancel your subscription at any time with no questions asked.',
    },
  ];

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
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {t('footer.pricing.subtitle')}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('footer.pricing.description')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.nameKey}
                className={`relative bg-card rounded-2xl border p-8 ${
                  plan.popular 
                    ? 'border-primary shadow-lg shadow-primary/10 scale-105' 
                    : 'border-border/50'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${
                    plan.popular ? 'bg-gradient-primary' : 'bg-secondary'
                  }`}>
                    <plan.icon className={`w-7 h-7 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{t(plan.nameKey)}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display text-4xl font-bold">
                      {plan.priceKey ? t(plan.priceKey) : plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.periodKey ? t(plan.periodKey) : plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {t(plan.ctaKey)}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            {t('footer.faq.subtitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div 
                key={faq.question}
                className="bg-card rounded-xl border border-border/50 p-6"
              >
                <h3 className="font-display font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-4">{t('footer.pricing.getStarted')}</h2>
            <p className="mb-6 opacity-90">
              {t('footer.pricing.description')}
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg">
                {t('footer.pricing.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
