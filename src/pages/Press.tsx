import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

export default function Press() {
  const { t } = useTranslation();

  const pressReleases = [
    {
      title: 'EchoWave Reaches 10 Million Users Milestone',
      date: 'January 2, 2026',
      summary: 'The marketplace platform celebrates a major milestone in its growth journey.',
    },
    {
      title: 'EchoWave Launches Enhanced Safety Features',
      date: 'December 15, 2025',
      summary: 'New verification badges and safety tools to protect buyers and sellers.',
    },
    {
      title: 'EchoWave Expands to 15 New Countries',
      date: 'November 20, 2025',
      summary: 'International expansion brings local commerce to more communities worldwide.',
    },
    {
      title: 'EchoWave Raises Series B Funding',
      date: 'October 5, 2025',
      summary: '$50M raised to accelerate product development and market expansion.',
    },
  ];

  const mediaFeatures = [
    { outlet: 'TechCrunch', title: 'The Future of Local Commerce', date: 'Dec 2025' },
    { outlet: 'Forbes', title: 'Top 50 Startups to Watch', date: 'Nov 2025' },
    { outlet: 'Wired', title: 'How EchoWave is Changing C2C', date: 'Oct 2025' },
    { outlet: 'Bloomberg', title: 'Marketplace Trends 2025', date: 'Sep 2025' },
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
            Press & <span className="gradient-text">Media</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            News, press releases, and media resources about EchoWave.
          </p>
        </div>

        {/* Media Contact */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-4">Media Inquiries</h2>
            <p className="mb-6 opacity-90">
              For press inquiries, interviews, or media requests, please contact our press team.
            </p>
            <Button variant="secondary" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              press@echowave.com
            </Button>
          </div>
        </div>

        {/* Press Kit */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Press Kit</h2>
                <p className="text-muted-foreground">
                  Download logos, brand guidelines, and executive photos.
                </p>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Download className="w-4 h-4 mr-2" />
                Download Press Kit
              </Button>
            </div>
          </div>
        </div>

        {/* Press Releases */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold mb-8">Press Releases</h2>
          <div className="space-y-4">
            {pressReleases.map((release) => (
              <div 
                key={release.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{release.date}</p>
                    <h3 className="font-display font-semibold mb-2">{release.title}</h3>
                    <p className="text-sm text-muted-foreground">{release.summary}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Read More
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-8">In the Media</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {mediaFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <p className="text-sm font-medium text-primary mb-2">{feature.outlet}</p>
                <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.date}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
