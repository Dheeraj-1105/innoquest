
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wheat, TestTube2, Bug, CloudSun, Wind, Droplet, Sunrise, Sunset, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { getDashboardData, getWeather, seedMarketData } from "../actions";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { DashboardInsightsOutput } from "@/ai/flows/get-dashboard-insights-flow";

type WeatherData = {
  temperature: number;
  humidity: number;
  rainfall: number;
  location: string;
  weatherCondition: string;
};

type MarketDataItem = {
  id: string;
  cropName: string;
  region: string;
  pricePerKg: number;
};

export default function DashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [insights, setInsights] = useState<DashboardInsightsOutput | null>(null);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchDashboardData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { insights, marketData: newMarketData } = await getDashboardData(userId);
      setInsights(insights);
      setMarketData(newMarketData || []);
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error fetching dashboard insights", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchWeather = useCallback(async (userId: string) => {
    try {
        const weather = await getWeather(userId);
        setWeatherData(weather);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error fetching weather", description: error.message });
    }
  }, [toast]);


  useEffect(() => {
    if (user?.uid) {
        fetchDashboardData(user.uid);
        fetchWeather(user.uid);
    } else {
        setIsLoading(false);
    }
  }, [user, fetchDashboardData, fetchWeather]);
  
  const handleSeedData = async () => {
      if (!user) {
          toast({ variant: "destructive", title: "You must be logged in to seed data." });
          return;
      }
      setIsSeeding(true);
      const result = await seedMarketData(user.uid);
      if (result.success) {
          toast({ title: "Success!", description: result.message });
          // Re-fetch data to show new market prices
           await fetchDashboardData(user.uid);
      } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setIsSeeding(false);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Please <Link href="/profile" className="text-primary underline">log in</Link> to view your personalized insights.</p>
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-headline font-bold">Your Agri Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">Personalized, AI-driven insights for your farm.</p>
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
              <CardDescription>Crops with the highest market price right now. Updates when new data is seeded.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (<p>Loading market trends...</p>) : marketData && marketData.length > 0 ? (
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
              ) : <p>No recent market data available. Try seeding new data.</p>}
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
                 {isLoading ? renderSkeleton() : insights ? (
                  <>
                    <p className="text-sm text-muted-foreground">{insights.soilHealth.recommendation}</p>
                    <Separator />
                    <div className="flex justify-between"><span>Condition:</span> <span className={`font-semibold ${insights.soilHealth.status === 'Optimal' ? 'text-green-600' : 'text-yellow-600'}`}>{insights.soilHealth.status}</span></div>
                  </>
                 ) : <p>Could not load AI soil insights.</p>}
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
                {isLoading ? renderSkeleton() : insights && insights.pestAlerts.length > 0 ? (
                  <ul className="space-y-4">
                    {insights.pestAlerts.map((alert, index) => (
                        <li key={index}>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold">{alert.pestName}</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${alert.severity === 'High' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-700'}`}>{alert.severity}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.recommendation}</p>
                        </li>
                    ))}
                  </ul>
                ) : <p>No specific pest alerts from AI at this time. Conditions seem stable.</p>}
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
              <CardDescription>{isLoading ? "Loading..." : weatherData?.location || "Set location in profile"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && !weatherData ? (<div className="text-center"><p>Loading live weather...</p></div>) : weatherData ? (
                <>
                  <div className="text-center">
                      <p className="text-6xl font-bold">{Math.round(weatherData.temperature)}°C</p>
                      <p className="text-muted-foreground capitalize">{weatherData.weatherCondition}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground"/> <span>Wind: 12 km/h</span></div>
                      <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground"/> <span>Humidity: {weatherData.humidity}%</span></div>
                      <div className="flex items-center gap-2"><Sunrise className="w-4 h-4 text-muted-foreground"/> <span>Sunrise: 5:45 AM</span></div>
                      <div className="flex items-center gap-2"><Sunset className="w-4 h-4 text-muted-foreground"/> <span>Sunset: 6:50 PM</span></div>
                  </div>
                </>
                ) : <p>Could not load live weather. Ensure your location is set in your profile and the API key is valid.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-3">
                <Wheat className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl font-headline">Market Opportunity</CardTitle>
              </div>
              <CardDescription>Generate and seed AI-powered crop suggestions for your region.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Click below to use AI to analyze market trends and populate the market data list with high-demand crops for your area.</p>
                <Button onClick={handleSeedData} disabled={isSeeding || !user} className="w-full">
                    {isSeeding ? "Analyzing Market..." : "Seed AI Suggestions"}
                    <RefreshCw className={`ml-2 h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
