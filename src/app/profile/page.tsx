import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl py-16 px-4 animate-fade-in">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-headline">Farmer Profile</CardTitle>
          <CardDescription>
            Manage your personal information, location, and crop details to get personalized advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
