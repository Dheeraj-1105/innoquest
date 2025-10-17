"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }).or(z.literal("")),
  location: z.string().min(2, { message: "Location is required." }),
  preferredLanguage: z.string({ required_error: "Please select a language." }),
  cropsGrown: z.string().min(3, { message: "Please list at least one crop." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "farmers", user.uid) : null),
    [firestore, user]
  );

  const { data: profileData, isLoading } = useDoc<ProfileFormValues>(userProfileRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      location: "",
      preferredLanguage: "en",
      cropsGrown: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        name: profileData.name || "",
        phone: profileData.phone || "",
        location: profileData.location || "",
        preferredLanguage: profileData.preferredLanguage || "en",
        cropsGrown: Array.isArray(profileData.cropsGrown) ? profileData.cropsGrown.join(', ') : profileData.cropsGrown || "",
      });
    }
  }, [profileData, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save your profile." });
      return;
    }

    try {
      const profileToSave = {
        ...data,
        cropsGrown: data.cropsGrown.split(',').map(c => c.trim()).filter(Boolean),
        id: user.uid,
        email: user.email,
      };
      
      const userDocRef = doc(firestore, `farmers/${user.uid}`);
      setDocumentNonBlocking(userDocRef, profileToSave, { merge: true });
      
      toast({
          title: "Success",
          description: "Profile updated successfully!",
      });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong. Please try again.",
        });
    }
  }

  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                    <Input type="tel" placeholder="10-digit mobile number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Village, District, State" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="preferredLanguage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The AI assistant will respond in this language.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cropsGrown"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crops Grown</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Cotton, Rice, Wheat, Sugarcane"
                  {...field}
                />
              </FormControl>
               <FormDescription>
                List the main crops you cultivate, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Profile</Button>
      </form>
    </Form>
  );
}
