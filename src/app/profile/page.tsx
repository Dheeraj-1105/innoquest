"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./ProfileForm";
import { useUser } from "@/firebase";
import { AuthForm } from "./AuthForm";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-16 px-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4 animate-fade-in">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-headline">Farmer Profile</CardTitle>
          <CardDescription>
            {user
              ? "Manage your personal information, location, and crop details to get personalized advice."
              : "Create an account or sign in to manage your profile."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? <ProfileForm /> : <AuthForm />}
        </CardContent>
      </Card>
    </div>
  );
}
