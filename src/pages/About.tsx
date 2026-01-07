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
      title: 'Community First',
      description: 'We believe in building strong local communities through trusted connections.',
    },
    {
      icon: Target,
      title: 'Simplicity',
      description: 'Making buying and selling as easy and straightforward as possible.',
    },
    {
      icon: Heart,
      title: 'Trust & Safety',
      description: 'Creating a secure environment where everyone can trade with confidence.',
    },
    {
      icon: Award,
      title: 'Quality',
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
            About <span className="gradient-text">EchoWave</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're on a mission to revolutionize local commerce by connecting buyers and sellers 
            in a trusted, easy-to-use marketplace. Since our founding, we've helped millions 
            of people find great deals and sell their items quickly.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <h2 className="font-display text-2xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                EchoWave was born from a simple idea: buying and selling locally should be 
                easy, safe, and enjoyable. Our founders experienced firsthand the frustrations 
                of outdated classifieds platforms and knew there had to be a better way.
              </p>
              <p>
                We launched in 2020 with a vision to create the most user-friendly marketplace 
                that puts community first. Today, we serve millions of users across the globe, 
                helping them connect with their neighbors and discover amazing deals.
              </p>
              <p>
                Our platform is built on trust, transparency, and the belief that when people 
                come together, amazing things happen. We're proud to be a part of so many 
                successful transactions and the stories behind them.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div 
                key={value.title}
                className="bg-card rounded-xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary mb-4">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold mb-2">{value.title}</h3>
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
