import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/Footer';

export default function Careers() {
  const { t } = useTranslation();

  const benefits = [
    'Competitive salary & equity',
    'Remote-first culture',
    'Unlimited PTO',
    'Health, dental & vision',
    'Learning & development budget',
    '401(k) matching',
    'Home office stipend',
    'Team retreats',
  ];

  const openings = [
    {
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Backend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Customer Success Manager',
      department: 'Support',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
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
            Join Our <span className="gradient-text">Team</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Help us build the future of local commerce. We're looking for passionate 
            people who want to make a difference.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <h2 className="font-display text-2xl font-bold mb-8 text-center">Why Work With Us?</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit) => (
                <div 
                  key={benefit}
                  className="bg-secondary/50 rounded-lg p-4 text-center text-sm font-medium"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div 
                key={job.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-2">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Don't see a position that fits? We're always looking for talented people.
            </p>
            <Button variant="outline">
              Send General Application
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
