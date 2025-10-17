
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpRight, DatabaseZap } from "lucide-react";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { seedMarketData } from "../actions";
import { useState } from "react";

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
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const marketDataRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'market_data') : null),
    [firestore]
  );
  const marketDataQuery = useMemoFirebase(
    () => (marketDataRef ? query(marketDataRef, orderBy('date', 'desc'), limit(15)) : null),
    [marketDataRef]
  );
  const { data: marketData, isLoading: isMarketLoading } = useCollection(marketDataQuery);

  const handleSeedData = async () => {
    setIsSeeding(true);
    const result = await seedMarketData();
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsSeeding(false);
  };

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
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-3xl font-headline">Latest Crop Prices (per Kg)</CardTitle>
                        <CardDescription>Prices from major agricultural markets (mandis), updated daily.</CardDescription>
                    </div>
                    <Button onClick={handleSeedData} disabled={isSeeding} variant="outline">
                      <DatabaseZap className="mr-2 h-4 w-4" />
                      {isSeeding ? 'Seeding...' : 'Seed Data'}
                    </Button>
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
                        {isMarketLoading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">Loading market data...</TableCell>
                          </TableRow>
                        ) : marketData && marketData.length > 0 ? (
                            marketData.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.cropName}</TableCell>
                                <TableCell>{item.region}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₹{item.pricePerKg}
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                           <TableRow>
                            <TableCell colSpan={3} className="text-center">No market data available. Click "Seed Data" to add some.</TableCell>
                          </TableRow>
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
