import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, ShoppingCart, Shield, CreditCard, User, MessageCircle, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/Footer';

export default function HelpCenter() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: ShoppingCart,
      title: 'Buying',
      description: 'How to find, purchase, and receive items',
      articles: 12,
    },
    {
      icon: CreditCard,
      title: 'Selling',
      description: 'Create listings, manage sales, and get paid',
      articles: 15,
    },
    {
      icon: User,
      title: 'Account',
      description: 'Profile settings, verification, and security',
      articles: 8,
    },
    {
      icon: Shield,
      title: 'Safety',
      description: 'Stay safe while buying and selling',
      articles: 10,
    },
    {
      icon: MessageCircle,
      title: 'Messaging',
      description: 'Communicate with buyers and sellers',
      articles: 6,
    },
    {
      icon: Settings,
      title: 'Technical',
      description: 'App issues, troubleshooting, and bugs',
      articles: 9,
    },
  ];

  const popularArticles = [
    'How do I create a listing?',
    'How do I contact a seller?',
    'Is EchoWave safe to use?',
    'How do I report a suspicious listing?',
    'How do I delete my account?',
    'Why was my listing removed?',
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
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            How can we <span className="gradient-text">help?</span>
          </h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold mb-8">Browse by Topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div 
                key={category.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                      {category.title}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <p className="text-xs text-primary">{category.articles} articles</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold mb-8">Popular Articles</h2>
          <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
            {popularArticles.map((article) => (
              <div 
                key={article}
                className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{article}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-4">Still need help?</h2>
            <p className="mb-6 opacity-90">
              Our support team is here to assist you 24/7.
            </p>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
