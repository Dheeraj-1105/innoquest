"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wheat, TestTube2, Bug, CloudSun, Wind, Droplet, Sunrise, Sunset, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { getDashboardWeather } from "../actions";
import { useEffect, useState } from "react";

const cropSuggestions = [
  { name: 'Tomatoes', reason: 'High demand in current market' },
  { name: 'Soybean', reason: 'Suitable for current soil moisture levels' },
  { name: 'Maize', reason: 'Favorable weather forecast for next 3 months' },
];

const pestAlerts = [
    { name: 'Aphids', crop: 'Cotton', severity: 'High' },
    { name: 'Bollworm', crop: 'Cotton', severity: 'Medium' },
];

type WeatherData = {
  temperature: number;
  humidity: number;
  rainfall: number;
  location: string;
  weatherAlerts: string[];
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  
  useEffect(() => {
    const fetchWeather = async () => {
      setIsWeatherLoading(true);
      const data = await getDashboardWeather(user?.uid);
      setWeatherData(data);
      setIsWeatherLoading(false);
    };
    fetchWeather();
  }, [user]);

  const marketDataRef = useMemoFirebase(() => (firestore ? collection(firestore, 'market_data') : null), [firestore]);
  const marketDataQuery = useMemoFirebase(
    () => (marketDataRef ? query(marketDataRef, orderBy('pricePerKg', 'desc'), limit(3)) : null),
    [marketDataRef]
  );
  const { data: marketData, isLoading: isMarketLoading } = useCollection(marketDataQuery);
  
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
                <TrendingUp className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Top Market Movers</CardTitle>
              </div>
              <CardDescription>Crops with the highest market price right now.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMarketLoading ? (<p>Loading market trends...</p>) : marketData && marketData.length > 0 ? (
                <ul className="space-y-4">
                  {marketData.map(crop => (
                    <li key={crop.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-semibold">{crop.cropName} <span className="text-sm text-muted-foreground">in {crop.region}</span></p>
                        <p className="text-lg font-bold text-primary">₹{crop.pricePerKg} / Kg</p>
                      </div>
                      <Button variant="outline" size="sm" asChild><Link href="/market">View Market</Link></Button>
                    </li>
                  ))}
                </ul>
              ) : <p>Market data not available.</p>}
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
                      <p className="text-6xl font-bold">{Math.round(weatherData.temperature)}°C</p>
                      <p className="text-muted-foreground capitalize">{weatherData.weatherAlerts?.[0] || 'Clear Sky'}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground"/> <span>Wind: 12 km/h</span></div>
                      <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground"/> <span>Humidity: {weatherData.humidity}%</span></div>
                      <div className="flex items-center gap-2"><Sunrise className="w-4 h-4 text-muted-foreground"/> <span>Sunrise: 5:45 AM</span></div>
                      <div className="flex items-center gap-2"><Sunset className="w-4 h-4 text-muted-foreground"/> <span>Sunset: 6:50 PM</span></div>
                  </div>
                </>
                ) : <p>Could not load live weather. Ensure location is set in your profile.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-3">
                <Wheat className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Crop Suggestions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
                 <ul className="space-y-4">
                {cropSuggestions.map(crop => (
                  <li key={crop.name} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-semibold">{crop.name}</p>
                      <p className="text-sm text-muted-foreground">{crop.reason}</p>
                    </div>
                    <Button variant="outline" size="sm">Info</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
