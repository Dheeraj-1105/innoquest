"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/firebase";
import { getFullWeatherIntelligence } from "../actions";
import type { WeatherIntelligenceData } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, Eye, RefreshCw,
  Sprout, Tractor, Bug, Zap, Activity, AlertTriangle, CheckCircle2,
  XCircle, Loader2, CloudSun, Gauge,
} from "lucide-react";
import Link from "next/link";

const CONDITION_ICONS: Record<string, string> = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
  Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
};

const RISK_COLORS: Record<string, string> = {
  Low: "text-green-600 bg-green-50 border-green-200",
  Medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  High: "text-orange-700 bg-orange-50 border-orange-200",
  Critical: "text-red-700 bg-red-50 border-red-200",
};

const URGENCY_COLORS: Record<string, string> = {
  Skip: "text-blue-700 bg-blue-50",
  Low: "text-green-700 bg-green-50",
  Moderate: "text-yellow-700 bg-yellow-50",
  High: "text-red-700 bg-red-50",
};

const RATING_COLORS: Record<string, string> = {
  Excellent: "text-green-700 bg-green-100",
  Good: "text-emerald-700 bg-emerald-100",
  Fair: "text-yellow-700 bg-yellow-100",
  Poor: "text-orange-700 bg-orange-100",
  Avoid: "text-red-700 bg-red-100",
};

function LoadingCard({ title }: { title: string }) {
  return (
    <Card className="shadow-lg animate-pulse">
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function WeatherPage() {
  const { user } = useUser();
  const [data, setData] = useState<WeatherIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const result = await getFullWeatherIntelligence(user.uid);
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Weather intelligence error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <CloudSun className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Weather Intelligence</h1>
        <p className="text-muted-foreground">Please <Link href="/profile" className="text-primary underline">log in</Link> to see your personalized weather insights.</p>
      </div>
    );
  }

  const w = data?.currentWeather;
  const forecast = data?.forecast ?? [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold flex items-center gap-3">
            <CloudSun className="w-10 h-10 text-primary" /> Weather Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time weather data powered by OpenWeather · AI farm advisories by Groq
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={fetchData} disabled={isLoading} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* AI Summary Banner */}
      {(isLoading || data?.aiSummary) && (
        <Card className="border-primary/30 bg-primary/5 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sprout className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary text-sm mb-1">🌾 AI Farm Advisory for Today</p>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-primary/10 rounded w-full" />
                    <div className="h-4 bg-primary/10 rounded w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 leading-relaxed">{data?.aiSummary}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Weather + UV + Air Quality */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Live Weather */}
        {isLoading ? <LoadingCard title="Live Weather" /> : (
          <Card className="shadow-lg md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Thermometer className="w-5 h-5 text-primary" /> Live Weather</CardTitle>
              <CardDescription>{w?.location || "Your Location"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{CONDITION_ICONS[w?.weatherCondition ?? ""] ?? "🌤️"}</div>
                <p className="text-5xl font-bold">{Math.round(w?.temperature ?? 0)}°C</p>
                <p className="text-muted-foreground capitalize mt-1">{w?.weatherCondition}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /><span>Humidity: <strong>{w?.humidity}%</strong></span></div>
                <div className="flex items-center gap-2"><Cloud className="w-4 h-4 text-gray-400" /><span>Rain: <strong>{w?.rainfall}mm</strong></span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* UV Index */}
        {isLoading ? <LoadingCard title="UV Index" /> : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sun className="w-5 h-5 text-yellow-500" /> UV Index</CardTitle>
              <CardDescription>Field worker safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.uvData ? (
                <>
                  <div className="text-center">
                    <p className="text-6xl font-bold text-yellow-500">{data.uvData.uvIndex}</p>
                    <Badge className={`mt-2 ${data.uvData.uvCategory === 'Low' ? 'bg-green-100 text-green-800' : data.uvData.uvCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : data.uvData.uvCategory === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                      {data.uvData.uvCategory}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-2 text-sm">
                    <Eye className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
                    <p>{data.uvData.uvAdvice}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">UV data unavailable</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Air Quality */}
        {isLoading ? <LoadingCard title="Air Quality" /> : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wind className="w-5 h-5 text-blue-500" /> Air Quality</CardTitle>
              <CardDescription>AQI & particulate matter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.airQuality ? (
                <>
                  <div className="text-center">
                    <p className="text-6xl font-bold text-blue-500">{data.airQuality.aqi}</p>
                    <Badge className={`mt-2 ${data.airQuality.aqi <= 2 ? 'bg-green-100 text-green-800' : data.airQuality.aqi === 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {data.airQuality.category}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">PM2.5</p>
                      <p className="font-bold">{data.airQuality.pm25} µg/m³</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">PM10</p>
                      <p className="font-bold">{data.airQuality.pm10} µg/m³</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">Air quality data unavailable</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 5-Day Forecast */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CloudRain className="w-5 h-5 text-primary" /> 5-Day Forecast</CardTitle>
          <CardDescription>Plan your farm activities for the week ahead</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {forecast.map((day, i) => (
                <div key={i} className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all hover:shadow-md ${i === 0 ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'}`}>
                  <p className="font-bold text-sm">{day.dayName}</p>
                  <p className="text-2xl my-2">{CONDITION_ICONS[day.condition] ?? "🌤️"}</p>
                  <p className="text-xs font-medium text-muted-foreground">{day.condition}</p>
                  <div className="flex gap-1 items-center mt-2">
                    <span className="text-blue-500 font-bold text-sm">{day.tempMin}°</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-orange-500 font-bold text-sm">{day.tempMax}°</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1 w-full text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>💧 Rain</span><span className="font-medium">{day.rainChance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>💨 Wind</span><span className="font-medium">{day.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>💦 Humidity</span><span className="font-medium">{day.humidity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advisories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spray Advisory */}
        {isLoading ? <LoadingCard title="Spray Advisory" /> : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" /> Spray Advisory
              </CardTitle>
              <CardDescription>Pesticide & fertiliser spraying conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {data?.sprayAdvisory.canSpray
                  ? <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  : <XCircle className="w-12 h-12 text-red-500 mx-auto" />}
                <Badge className={`mt-2 text-sm px-3 py-1 ${RATING_COLORS[data?.sprayAdvisory.rating ?? 'Fair']}`}>
                  {data?.sprayAdvisory.rating}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                {data?.sprayAdvisory.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-muted-foreground">•</span><p>{r}</p>
                  </div>
                ))}
              </div>
              {data?.sprayAdvisory.canSpray && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                  <p className="text-green-800"><strong>Best window:</strong> {data.sprayAdvisory.bestWindowToday}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Irrigation Advisory */}
        {isLoading ? <LoadingCard title="Irrigation Advisory" /> : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tractor className="w-5 h-5 text-blue-600" /> Irrigation Advisory
              </CardTitle>
              <CardDescription>Smart water management recommendation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Droplets className={`w-12 h-12 mx-auto ${data?.irrigationAdvisory.shouldIrrigate ? 'text-blue-500' : 'text-gray-400'}`} />
                <Badge className={`mt-2 text-sm px-3 py-1 ${URGENCY_COLORS[data?.irrigationAdvisory.urgency ?? 'Low']}`}>
                  {data?.irrigationAdvisory.urgency === 'Skip' ? '⏭ Skip Today' : `Urgency: ${data?.irrigationAdvisory.urgency}`}
                </Badge>
              </div>
              <Separator />
              <p className="text-sm text-foreground/80">{data?.irrigationAdvisory.reason}</p>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Next expected rain:</strong> {data?.irrigationAdvisory.nextRainIn}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Disease Risk */}
        {isLoading ? <LoadingCard title="Disease Risk" /> : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-600" /> Crop Disease Risk
              </CardTitle>
              <CardDescription>Weather-based pathogen risk analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <AlertTriangle className={`w-12 h-12 mx-auto ${data?.diseaseRisk.overallRisk === 'Low' ? 'text-green-500' : data?.diseaseRisk.overallRisk === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`} />
                <Badge className={`mt-2 text-sm px-3 py-1 border ${RISK_COLORS[data?.diseaseRisk.overallRisk ?? 'Low']}`}>
                  {data?.diseaseRisk.overallRisk} Risk
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                {data?.diseaseRisk.risks.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{r.disease}</p>
                      <p className="text-xs text-muted-foreground">{r.trigger}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${RISK_COLORS[r.risk]}`}>{r.risk}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex justify-center gap-4 pt-4">
        <Button asChild><Link href="/assistant">Ask AI About This Weather</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard">Back to Dashboard</Link></Button>
      </div>
    </div>
  );
}
