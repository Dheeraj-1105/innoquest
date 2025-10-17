"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wheat, TestTube2, Bug, Droplets, CloudSun, Wind, Droplet, Sunrise, Sunset } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";

const cropSuggestions = [
  { name: 'Tomatoes', reason: 'High demand in current market' },
  { name: 'Soybean', reason: 'Suitable for current soil moisture levels' },
  { name: 'Maize', reason: 'Favorable weather forecast for next 3 months' },
];

const pestAlerts = [
    { name: 'Aphids', crop: 'Cotton', severity: 'High' },
    { name: 'Bollworm', crop: 'Cotton', severity: 'Medium' },
];

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const weatherDataRef = useMemoFirebase(() => (firestore ? doc(firestore, 'weather_data', 'pune') : null), [firestore]);
  const { data: weatherData, isLoading: isWeatherLoading } = useDoc(weatherDataRef);
  
  const marketDataRef = useMemoFirebase(() => (firestore ? collection(firestore, 'market_data') : null), [firestore]);
  const { data: marketData, isLoading: isMarketLoading } = useCollection(marketDataRef);
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Please <Link href="/profile" className="text-primary underline">log in</Link> to view your personalized insights.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold">Your Agri Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">Personalized insights for your farm.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/assistant">Get New Advisory</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wheat className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Crop Suggestions</CardTitle>
              </div>
              <CardDescription>Based on your location, soil, and market trends.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {cropSuggestions.map(crop => (
                  <li key={crop.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-semibold">{crop.name}</p>
                      <p className="text-sm text-muted-foreground">{crop.reason}</p>
                    </div>
                    <Button variant="outline" size="sm">More Info</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TestTube2 className="w-8 h-8 text-primary" />
                  <CardTitle className="text-2xl font-headline">Soil Health</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex justify-between"><span>pH Level:</span> <span className="font-semibold">6.8 (Optimal)</span></div>
                 <div className="flex justify-between"><span>Nitrogen (N):</span> <span className="font-semibold text-yellow-600">Slightly Low</span></div>
                 <div className="flex justify-between"><span>Phosphorus (P):</span> <span className="font-semibold">Good</span></div>
                 <div className="flex justify-between"><span>Potassium (K):</span> <span className="font-semibold">Excellent</span></div>
                 <Separator />
                 <p className="text-sm text-muted-foreground">Recommendation: Apply a nitrogen-rich fertilizer before the next sowing season.</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bug className="w-8 h-8 text-destructive" />
                  <CardTitle className="text-2xl font-headline">Pest Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                    {pestAlerts.map(alert => (
                        <li key={alert.name}>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">{alert.name} on {alert.crop}</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${alert.severity === 'High' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-accent/20 text-accent-foreground'}`}>{alert.severity}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">High probability of infestation. Immediate action recommended.</p>
                        </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CloudSun className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Weather Today</CardTitle>
              </div>
              <CardDescription>{isWeatherLoading ? "Loading..." : weatherData?.location || "Your Local Forecast"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isWeatherLoading ? (<p>Loading weather...</p>) : weatherData ? (
                <>
                  <div className="text-center">
                      <p className="text-6xl font-bold">{weatherData.temperature}°C</p>
                      <p className="text-muted-foreground">Partly Cloudy</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground"/> <span>Wind: 12 km/h</span></div>
                      <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground"/> <span>Humidity: {weatherData.humidity}%</span></div>
                      <div className="flex items-center gap-2"><Sunrise className="w-4 h-4 text-muted-foreground"/> <span>Sunrise: 5:45 AM</span></div>
                      <div className="flex items-center gap-2"><Sunset className="w-4 h-4 text-muted-foreground"/> <span>Sunset: 6:50 PM</span></div>
                  </div>
                </>
                ) : <p>Weather data not available.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-3">
                <Droplets className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Fertilizer Advice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
                <p className="font-semibold">For current crop (Cotton):</p>
                <p className="text-sm text-muted-foreground">Apply 25kg/hectare of Urea in the next 7 days. Ensure proper irrigation after application.</p>
                <Button variant="link" className="px-0">Read full schedule</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
