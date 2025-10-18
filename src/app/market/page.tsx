
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

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

const staticMarketData = [
  { id: "1", cropName: "Tomato", region: "Maharashtra", pricePerKg: 45 },
  { id: "2", cropName: "Onion", region: "Karnataka", pricePerKg: 30 },
  { id: "3", cropName: "Potato", region: "Uttar Pradesh", pricePerKg: 25 },
  { id: "4", cropName: "Cotton", region: "Gujarat", pricePerKg: 60 },
  { id: "5", cropName: "Soybean", region: "Madhya Pradesh", pricePerKg: 52 },
  { id: "6", cropName: "Rice", region: "Andhra Pradesh", pricePerKg: 48 },
  { id: "7", cropName: "Wheat", region: "Punjab", pricePerKg: 28 },
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
                <CardHeader>
                    <div>
                        <CardTitle className="text-3xl font-headline">Latest Crop Prices (per Kg)</CardTitle>
                        <CardDescription>Prices from major agricultural markets (mandis).</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Crop</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead className="text-right">Price (INR/Kg)</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {staticMarketData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.cropName}</TableCell>
                            <TableCell>{item.region}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{item.pricePerKg}
                            </TableCell>
                          </TableRow>
                        ))}
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
