import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, MessageCircle, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Footer } from '@/components/Footer';

export default function Contact() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(t('footer.contact.success'));
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      titleKey: 'footer.contact.email',
      value: 'support@example.com',
      description: 'We respond within 24 hours',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      value: 'Available 24/7',
      description: 'Get instant help from our team',
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      description: 'Mon-Fri, 9am-6pm EST',
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
            {t('footer.contact.title')}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('footer.contact.description')}
          </p>
        </div>

        {/* Contact Methods */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl border border-border/50 p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-1">
                  {method.titleKey ? t(method.titleKey) : method.title}
                </h3>
                <p className="font-medium mb-1">{method.value}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-card rounded-2xl border border-border/50 p-8 md:p-12">
            <h2 className="font-display text-2xl font-bold mb-8 text-center">{t('footer.contact.send')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('footer.contact.name')}</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('footer.contact.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t('footer.contact.subject')}</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('footer.contact.subject')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="report">Report an Issue</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('footer.contact.message')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('footer.contact.message')}
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('footer.contact.send')}
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Office Info */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-secondary/30 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-display text-xl font-bold mb-4">{t('footer.about.title')}</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    123 Market Street, San Francisco, CA 94102
                  </p>
                  <p className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    Monday - Friday, 9:00 AM - 6:00 PM EST
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Follow Us</h3>
                <p className="text-muted-foreground">
                  Stay connected with us on social media for the latest updates, 
                  tips, and community stories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
