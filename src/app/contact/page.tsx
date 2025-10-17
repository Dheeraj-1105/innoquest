import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  const mapImage = PlaceHolderImages.find(p => p.id === 'map-placeholder');
  
  return (
    <div className="container mx-auto max-w-6xl py-16 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Get in Touch</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We'd love to hear from you. Send us a message or find us at our location.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Contact Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message..." rows={5} />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Our Office</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <MapPin className="w-6 h-6 text-primary" />
                        <p>123 AgriTech Avenue, Green Valley, Farmville 54321</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Phone className="w-6 h-6 text-primary" />
                        <p>+1 (234) 567-890</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Mail className="w-6 h-6 text-primary" />
                        <p>contact@agriadvisor.ai</p>
                    </div>
                 </CardContent>
            </Card>
            {mapImage && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image
                    src={mapImage.imageUrl}
                    alt={mapImage.description}
                    width={1200}
                    height={400}
                    className="w-full h-auto object-cover"
                    data-ai-hint={mapImage.imageHint}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
