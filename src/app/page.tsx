import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Bot, CloudSun, Leaf, Mic, Languages, BarChart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: 'AI Chat Assistant',
    description: 'Get instant answers to your farming questions in your native language.',
  },
  {
    icon: <CloudSun className="h-10 w-10 text-primary" />,
    title: 'Weather Insights',
    description: 'Receive real-time weather forecasts to plan your activities.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Market Prices',
    description: 'Stay updated with the latest market prices for your crops.',
  },
  {
    icon: <Leaf className="h-10 w-10 text-primary" />,
    title: 'Crop Advisory',
    description: 'Personalized advice on crop management, pests, and diseases.',
  },
  {
    icon: <Mic className="h-10 w-10 text-primary" />,
    title: 'Voice Input',
    description: 'Simply speak your questions in your local language.',
  },
  {
    icon: <Languages className="h-10 w-10 text-primary" />,
    title: 'Multilingual Support',
    description: 'Available in English, Hindi, Telugu, Tamil, and more.',
  },
];

const testimonials = [
  {
    quote: "AgriAI has transformed the way I farm. The voice assistant is so easy to use, and the advice is always accurate. My yield has increased by 20%!",
    name: "Ramesh Kumar",
    location: "Andhra Pradesh",
  },
  {
    quote: "Finally, a tool that understands me and my needs. The market price updates have helped me get better returns for my produce.",
    name: "Sunita Devi",
    location: "Uttar Pradesh",
  },
  {
    quote: "The pest alerts saved my cotton crop this season. I am so grateful for this platform. It's like having an agriculture expert in my pocket.",
    name: "Muthu Selvan",
    location: "Tamil Nadu",
  }
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-farmland');

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl px-4 animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
            Empowering Farmers with AI-Driven Advisory in Native Languages
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Get personalized crop, weather, and market insights using your own voice.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/assistant">
                Ask the Agent <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/profile">
                Login / Register
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">A Smarter Way to Farm</h2>
            <p className="mt-2 text-lg text-muted-foreground">Everything you need, in one simple platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md transition-transform hover:scale-105 duration-300">
                {feature.icon}
                <h3 className="mt-4 text-xl font-bold font-headline">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section id="testimonials" className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">From Our Farmers</h2>
             <p className="mt-2 text-lg text-muted-foreground">Real stories from farmers benefiting from AgriAI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card flex flex-col">
                <CardContent className="pt-6 flex-grow">
                  <p className="italic">"{testimonial.quote}"</p>
                </CardContent>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{testimonial.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
