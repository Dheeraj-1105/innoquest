
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const marketData = [
  { id: '1', cropName: 'Tomato', region: 'Maharashtra', reason: 'High demand in urban areas.', pricePerKg: 45 + Math.floor(Math.random() * 10) - 5 },
  { id: '2', cropName: 'Cotton', region: 'Gujarat', reason: 'Favorable textile market trends.', pricePerKg: 60 + Math.floor(Math.random() * 15) - 7 },
  { id: '3', cropName: 'Sugarcane', region: 'Uttar Pradesh', reason: 'Increased demand from sugar mills.', pricePerKg: 4 + Math.floor(Math.random() * 2) - 1 },
  { id: '4', cropName: 'Rice', region: 'Andhra Pradesh', reason: 'Strong export demand.', pricePerKg: 52 + Math.floor(Math.random() * 8) - 4 },
  { id: '5', cropName: 'Wheat', region: 'Punjab', reason: 'Government procurement season.', pricePerKg: 22 + Math.floor(Math.random() * 5) - 2 },
  { id: '6', cropName: 'Onion', region: 'Maharashtra', reason: 'Seasonal supply shortage.', pricePerKg: 30 + Math.floor(Math.random() * 12) - 6 },
  { id: '7', cropName: 'Potato', region: 'West Bengal', reason: 'Steady consumption rates.', pricePerKg: 20 + Math.floor(Math.random() * 6) - 3 },
];

const schemes = [
    {
        title: "PM-KISAN Scheme",
        description: "An income support scheme for all landholding farmer families.",
        link: "#"
    },
    {
        title: "Pradhan Mantri Fasal Bima Yojana",
        description: "Crop insurance scheme to provide financial support to farmers suffering crop loss/damage.",
        link: "#"
    },
    {
        title: "Kisan Credit Card (KCC)",
        description: "Provides farmers with timely access to credit for their agricultural needs.",
        link: "#"
    },
];

export default function MarketPage() {
  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Market &amp; Schemes</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Stay updated with the latest crop prices and government schemes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-headline">Latest Crop Prices (per Kg)</CardTitle>
                        <CardDescription>Sample prices from major agricultural markets.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Crop</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Price (INR/Kg)</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {marketData && marketData.length > 0 ? (
                          marketData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.cropName}</TableCell>
                              <TableCell>{item.region}</TableCell>
                              <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                              <TableCell className="text-right font-semibold">
                                ₹{item.pricePerKg}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data available.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        <div>
            <h2 className="text-3xl font-headline font-bold mb-4">Government Schemes</h2>
            <div className="space-y-4">
                {schemes.map((scheme, index) => (
                    <Card key={index} className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline">{scheme.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{scheme.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild>
                                <Link href={scheme.link}>Read More</Link>
                            </Button>
                            <Button asChild>
                                <Link href={scheme.link}>Apply Now <ArrowUpRight className="w-4 h-4 ml-2"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
