import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Target, Heart, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function About() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Users,
      titleKey: 'footer.about.community',
      description: 'We believe in building strong local communities through trusted connections.',
    },
    {
      icon: Target,
      titleKey: 'footer.about.innovation',
      description: 'Making buying and selling as easy and straightforward as possible.',
    },
    {
      icon: Heart,
      titleKey: 'footer.about.trust',
      description: 'Creating a secure environment where everyone can trade with confidence.',
    },
    {
      icon: Award,
      titleKey: 'footer.about.sustainability',
      description: 'Maintaining high standards in everything we do, from our platform to our support.',
    },
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Founder', image: '/placeholder.svg' },
    { name: 'Michael Chen', role: 'CTO', image: '/placeholder.svg' },
    { name: 'Emily Rodriguez', role: 'Head of Design', image: '/placeholder.svg' },
    { name: 'David Kim', role: 'Head of Operations', image: '/placeholder.svg' },
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
            {t('footer.about.title')}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('footer.about.description')}
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <h2 className="font-display text-2xl font-bold mb-6">{t('footer.about.subtitle')}</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>{t('footer.about.missionText')}</p>
              <p>{t('footer.about.visionText')}</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border/50 p-8">
              <h2 className="font-display text-xl font-bold mb-4">{t('footer.about.mission')}</h2>
              <p className="text-muted-foreground">{t('footer.about.missionText')}</p>
            </div>
            <div className="bg-card rounded-xl border border-border/50 p-8">
              <h2 className="font-display text-xl font-bold mb-4">{t('footer.about.vision')}</h2>
              <p className="text-muted-foreground">{t('footer.about.visionText')}</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="font-display text-3xl font-bold text-center mb-12">{t('footer.about.values')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div 
                key={value.titleKey}
                className="bg-card rounded-xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary mb-4">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold mb-2">{t(value.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div 
                key={member.name}
                className="bg-card rounded-xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-24 h-24 rounded-full bg-secondary mx-auto mb-4 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
