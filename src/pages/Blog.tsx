import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/Footer';

export default function Blog() {
  const { t } = useTranslation();

  const featuredPost = {
    title: '10 Tips for Selling Your Items Faster on EchoWave',
    excerpt: 'Learn the secrets to creating listings that attract buyers and close deals quickly. From photography tips to pricing strategies.',
    category: 'Selling Tips',
    date: 'Jan 5, 2026',
    readTime: '5 min read',
    image: '/placeholder.svg',
  };

  const posts = [
    {
      title: 'How to Stay Safe When Meeting Buyers',
      excerpt: 'Essential safety tips for in-person transactions that every seller should know.',
      category: 'Safety',
      date: 'Jan 3, 2026',
      readTime: '4 min read',
    },
    {
      title: 'The Complete Guide to Pricing Your Items',
      excerpt: 'Research-backed strategies to price your items competitively while maximizing value.',
      category: 'Selling Tips',
      date: 'Dec 28, 2025',
      readTime: '6 min read',
    },
    {
      title: 'New Features: Enhanced Messaging System',
      excerpt: 'Discover the latest improvements to our messaging platform for better buyer-seller communication.',
      category: 'Product Updates',
      date: 'Dec 20, 2025',
      readTime: '3 min read',
    },
    {
      title: 'Building Trust: Our Verification System',
      excerpt: 'Learn how our verification badges work and how they help create a safer marketplace.',
      category: 'Safety',
      date: 'Dec 15, 2025',
      readTime: '4 min read',
    },
    {
      title: 'Photography Tips for Better Listings',
      excerpt: 'Simple techniques to make your product photos stand out and attract more buyers.',
      category: 'Selling Tips',
      date: 'Dec 10, 2025',
      readTime: '5 min read',
    },
    {
      title: 'Year in Review: EchoWave 2025',
      excerpt: 'A look back at the milestones, features, and community achievements of the past year.',
      category: 'Company News',
      date: 'Dec 5, 2025',
      readTime: '7 min read',
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
            EchoWave <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Tips, updates, and stories from our marketplace community.
          </p>
        </div>

        {/* Featured Post */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="grid md:grid-cols-2">
              <div className="aspect-video md:aspect-auto bg-secondary">
                <img 
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit mb-4">{featuredPost.category}</Badge>
                <h2 className="font-display text-2xl font-bold mb-4">{featuredPost.title}</h2>
                <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <Button className="bg-gradient-primary hover:opacity-90 w-fit">
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-8">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article 
                key={post.title}
                className="bg-card rounded-xl border border-border/50 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <Badge variant="secondary" className="mb-4">{post.category}</Badge>
                <h3 className="font-display font-semibold mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
