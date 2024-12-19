"use client";

import { useState, useEffect } from "react";
import { Search, Menu, ShoppingCart, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  image: string;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: { start: { localDate: string } };
  _embedded?: { venues?: [{ name: string }] };
  images?: { url: string }[];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [popularNearby, setPopularNearby] = useState<Event[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const fetchEvents = async (geoPoint?: string) => {
    const API_KEY = "SzfYNT6xBps7IGE0ERt2Nvkm1vwRJ0vg";
    const baseUrl = "https://app.ticketmaster.com/discovery/v2/events";

    try {
      // Fetch featured events
      const featuredResponse = await fetch(
        `${baseUrl}.json?apikey=${API_KEY}&size=5&countryCode=CA`,
        { cache: "no-store" }
      );

      if (!featuredResponse.ok) {
        throw new Error(`HTTP error! status: ${featuredResponse.status}`);
      }

      const featuredData = await featuredResponse.json();
      console.log("API Response:", featuredData); // Debug log

      if (featuredData._embedded?.events) {
        const transformedEvents = featuredData._embedded.events.map(
          (event: TicketmasterEvent) => ({
            id: event.id,
            name: event.name,
            date: event.dates.start.localDate,
            venue: event._embedded?.venues?.[0]?.name || "TBA",
            image: event.images?.[0]?.url || "/placeholder.jpg",
          })
        );
        setFeaturedEvents(transformedEvents);
      }

      const nearbyResponse = await fetch(
        `${baseUrl}.json?apikey=${API_KEY}&size=5&preferredCountry=ca&classificationName=music,sports,arts&sort=random${
          geoPoint ? `&geoPoint=${geoPoint}` : ""
        }`,
        { cache: "no-store" }
      );

      const nearbyData = await nearbyResponse.json();
      console.log("Nearby Response:", nearbyData);

      if (nearbyData._embedded?.events) {
        const transformedNearby = nearbyData._embedded.events.map(
          (event: TicketmasterEvent) => ({
            id: event.id,
            name: event.name,
            date: event.dates.start.localDate,
            venue: event._embedded?.venues?.[0]?.name || "TBA",
            image: event.images?.[0]?.url || "/placeholder.jpg",
          })
        );
        setPopularNearby(transformedNearby);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (postalCode.length >= 5) {
      fetchEvents(postalCode);
    }
  }, [postalCode]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button aria-label="Open menu" className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold">TixHub</h1>
          </div>
          <nav className="hidden md:flex space-x-8 ">
            <Link
              href="/sports"
              className="hover:underline hover:subpixel-antialiased decoration-sky-500 text-lg"
            >
              Sports
            </Link>
            <Link
              href="/concerts"
              className="hover:underline hover:subpixel-antialiased decoration-sky-500 text-lg"
            >
              Music
            </Link>
            <Link
              href="/arts"
              className="hover:underline hover:subpixel-antialiased decoration-sky-500 text-lg"
            >
              Arts & Theater
            </Link>
            <Link
              href="/family"
              className="hover:underline hover:subpixel-antialiased decoration-sky-500 text-lg"
            >
              Family
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <button aria-label="View shopping cart">
              <ShoppingCart className="h-6 w-6" />
            </button>
            <button aria-label="View user profile">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Find your next event on TixHub
            </h2>
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-2">
              <Input
                type="text"
                placeholder="Search for events, venues, or cities"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
                aria-label="Search for events"
              />
              <Input
                type="text"
                placeholder="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="md:w-32"
                aria-label="Enter postal code"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  side="bottom"
                  alignOffset={-180}
                >
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <Button className="md:ml-2">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Featured Events</h2>
            <div dir="ltr">
              <div className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory">
                {featuredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-card text-card-foreground rounded-lg overflow-hidden shadow-md flex flex-col min-w-[450px] snap-center"
                  >
                    <img
                      src={event.image}
                      alt=""
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                      <p className="text-muted-foreground">{event.date}</p>
                      <p className="text-muted-foreground">{event.venue}</p>
                      <Button className="mt-4 w-full">Get Tickets</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Popular Near You</h2>
            <div dir="ltr">
              <div className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory">
                {popularNearby.map((event) => (
                  <div
                    key={event.id}
                    className="bg-card text-card-foreground rounded-lg overflow-hidden shadow-md flex flex-col min-w-[450px] snap-center"
                  >
                    <img
                      src={event.image}
                      alt=""
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                      <p className="text-muted-foreground">{event.date}</p>
                      <p className="text-muted-foreground">{event.venue}</p>
                      <Button className="mt-4 w-full">Get Tickets</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Help</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Customer Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    My Account
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Our Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Partners</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Affiliate Program
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Developers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Venues
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:underline">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-muted-foreground/10 text-center text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} TixHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
