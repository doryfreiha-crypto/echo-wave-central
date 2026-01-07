import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, MapPin, Eye, AlertTriangle, MessageCircle, CreditCard, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function SafetyTips() {
  const { t } = useTranslation();

  const tips = [
    {
      icon: MapPin,
      title: 'Meet in Public Places',
      description: 'Always meet buyers and sellers in well-lit, public locations like coffee shops, shopping centers, or police station parking lots.',
      color: 'text-blue-500',
    },
    {
      icon: Users,
      title: 'Bring a Friend',
      description: 'For high-value transactions, consider bringing a friend or family member with you for added safety.',
      color: 'text-green-500',
    },
    {
      icon: Eye,
      title: 'Inspect Before Buying',
      description: 'Always examine items carefully before completing the transaction. Test electronics and check for damage.',
      color: 'text-purple-500',
    },
    {
      icon: CreditCard,
      title: 'Use Safe Payment Methods',
      description: 'Prefer cash for in-person transactions. Be wary of wire transfers, gift cards, or unusual payment requests.',
      color: 'text-orange-500',
    },
    {
      icon: MessageCircle,
      title: 'Keep Communication on Platform',
      description: 'Use our messaging system for all communications. This helps us protect you and provides a record if issues arise.',
      color: 'text-pink-500',
    },
    {
      icon: AlertTriangle,
      title: 'Trust Your Instincts',
      description: 'If something feels off about a deal or person, walk away. Your safety is more important than any transaction.',
      color: 'text-red-500',
    },
  ];

  const warningSignals = [
    'Prices that seem too good to be true',
    'Requests to communicate outside the platform',
    'Pressure to complete the transaction quickly',
    'Refusal to meet in public places',
    'Requests for unusual payment methods',
    'Vague or inconsistent item descriptions',
    'Seller or buyer refuses to verify identity',
    'Requests for personal financial information',
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Safety <span className="gradient-text">Tips</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your safety is our priority. Follow these guidelines for secure transactions.
          </p>
        </div>

        {/* Safety Tips Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip) => (
              <div 
                key={tip.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 ${tip.color}`}>
                  <tip.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold mb-2">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Signs */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <h2 className="font-display text-2xl font-bold">Warning Signs to Watch For</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {warningSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                  </div>
                  <span className="text-sm">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
              <h2 className="font-display text-2xl font-bold">Best Practices</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Verify the seller's profile and reviews before making a purchase</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Share your meeting details with a trusted friend or family member</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Take photos or screenshots of the listing and conversation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>Report suspicious activity immediately using our reporting tools</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Report Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-4">See Something Suspicious?</h2>
            <p className="mb-6 opacity-90">
              Help keep our community safe by reporting suspicious listings or users.
            </p>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                Report an Issue
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
