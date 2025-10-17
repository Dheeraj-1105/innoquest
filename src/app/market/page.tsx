import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const marketData = [
  { crop: "Cotton", variety: "Long Staple", market: "Guntur", price: "7,500", trend: "up" },
  { crop: "Paddy", variety: "Fine", market: "Karnal", price: "3,200", trend: "stable" },
  { crop: "Tomato", variety: "Hybrid", market: "Nashik", price: "1,800", trend: "down" },
  { crop: "Soybean", variety: "Yellow", market: "Indore", price: "5,100", trend: "up" },
  { crop: "Wheat", variety: "Milling", market: "Ludhiana", price: "2,350", trend: "stable" },
  { crop: "Onion", variety: "Red", market: "Lasalgaon", price: "1,200", trend: "down" },
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
  const TrendArrow = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <span className="text-green-500">▲</span>;
    if (trend === 'down') return <span className="text-red-500">▼</span>;
    return <span className="text-gray-500">▬</span>;
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
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Latest Crop Prices (per Quintal)</CardTitle>
                    <CardDescription>Prices from major agricultural markets (mandis).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Crop</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Market</TableHead>
                            <TableHead className="text-right">Price (INR)</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {marketData.map((item, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium">{item.crop}</TableCell>
                            <TableCell>{item.variety}</TableCell>
                            <TableCell>{item.market}</TableCell>
                            <TableCell className="text-right font-semibold">
                                <TrendArrow trend={item.trend} /> {item.price}
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
