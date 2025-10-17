import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl py-16 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">About AgriAdvisor AI</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Revolutionizing agriculture through the power of artificial intelligence.
        </p>
      </div>

      <Card className="mb-12 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Target className="w-10 h-10 text-primary" />
            <CardTitle className="text-3xl font-headline">Our Mission</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-foreground/80">
            Our mission is to bridge the information gap in agriculture by providing small and marginal farmers with accessible, affordable, and actionable advice. We believe that by leveraging technology like AI and multilingual support, we can empower farmers to make informed decisions, improve their livelihoods, and contribute to a more sustainable agricultural future.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
             <Sprout className="w-10 h-10 text-primary" />
             <CardTitle className="text-3xl font-headline">Who We Are</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg text-foreground/80">
            AgriAdvisor AI was born from a passion for technology and a deep respect for the farming community. We are a team of engineers, data scientists, and agricultural enthusiasts dedicated to solving real-world challenges faced by farmers. 
          </p>
          <p className="text-lg text-foreground/80">
            We are building a platform that is not only technologically advanced but also intuitive and user-friendly, ensuring that every farmer, regardless of their technical literacy, can benefit from the digital agriculture revolution. By breaking down language barriers and delivering personalized insights, we aim to be a trusted partner for farmers on their journey to success.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
