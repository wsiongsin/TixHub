"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Search,
  Menu,
  ShoppingCart,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded: {
    venues: Array<{
      name: string;
      city: {
        name: string;
      };
    }>;
  };
  images: Array<{
    url: string;
  }>;
  venue?: string;
  time?: string;
  status?: string;
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [location, setLocation] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 50;

  const categoryTitles: { [key: string]: string } = {
    concerts: "CONCERT TICKETS",
    sports: "SPORTS TICKETS",
    arts: "ARTS & THEATRE TICKETS",
    family: "FAMILY TICKETS",
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchEvents();
  }, [location]);

  const fetchEvents = async () => {
    try {
      setError(null);
      const apiKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;

      if (!apiKey) {
        setError(
          "API key is missing. Please check your environment variables."
        );
        return;
      }

      if (location === "all") {
        // Fetch events for all cities
        const cities = ["Toronto", "Vancouver", "Montreal"];
        const allEvents = await Promise.all(
          cities.map(async (city) => {
            const response = await fetch(
              `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=music&segmentName=Music&city=${city}&size=200`
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch events for ${city} (HTTP ${response.status})`
              );
            }

            const data = await response.json();
            return data._embedded?.events || [];
          })
        );

        // Combine and deduplicate events from all cities
        const combinedEvents = allEvents.flat();
        const uniqueEvents = Array.from(
          new Map(combinedEvents.map((event) => [event.id, event])).values()
        );
        setEvents(uniqueEvents);
      } else {
        // Fetch events for single city
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&classificationName=music&segmentName=Music&city=${location}&size=200`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch events (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (data._embedded && data._embedded.events) {
          setEvents(data._embedded.events);
        } else {
          setEvents([]);
          setError("No events found for this location");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    switch (filter) {
      case "today":
        return { start: today, end: endOfDay };

      case "this-weekend": {
        const friday = new Date(today);
        friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);
        sunday.setHours(23, 59, 59, 999);
        return { start: friday, end: sunday };
      }

      case "this-week": {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: today, end: endOfWeek };
      }

      case "this-month": {
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        endOfMonth.setHours(23, 59, 59, 999);
        return { start: today, end: endOfMonth };
      }

      default:
        return null;
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchQuery ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event._embedded.venues[0].name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      event._embedded.venues[0].city.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    const dateRange = getDateRange(dateFilter);
    if (!dateRange) return true;

    const eventDate = new Date(event.dates.start.localDate);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate >= dateRange.start && eventDate <= dateRange.end;
  });

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent
  );
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button aria-label="Open menu" className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold">TixHub</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
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
      <div className="min-h-screen">
        <div className="relative h-[300px]">
          <img
            src="./concerts/assets/concerts.jpg"
            alt="Concerts background"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
            <h1 className="text-white text-5xl font-bold">CONCERTS</h1>
          </div>
        </div>
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="Search for events"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 md:w-48">
              <MapPin className="h-5 w-5 text-gray-500" />
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Toronto">Toronto</SelectItem>
                  <SelectItem value="Vancouver">Vancouver</SelectItem>
                  <SelectItem value="Montreal">Montreal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 md:w-48">
              <Calendar className="h-5 w-5 text-gray-500" />
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value);
                  setCurrentPage(1); // Reset to first page when changing date filter
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-weekend">This Weekend</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="md:w-24">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {(params?.category || "events").toUpperCase()} •{" "}
              {filteredEvents.length} RESULTS
            </h2>
          </div>

          <div className="flex flex-col space-y-4">
            {currentEvents.map((event) => {
              const date = new Date(event.dates.start.localDate);
              const month = date
                .toLocaleString("default", { month: "short" })
                .toUpperCase();
              const day = date.getDate();
              const time = event.dates.start.localTime || "19:00:00";
              const formattedTime = new Date(
                `2000-01-01T${time}`
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              });

              return (
                <div key={event.id} className="border-t border-gray-200 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-6">
                      <div className="text-center w-16">
                        <div className="text-gray-600 text-sm">{month}</div>
                        <div className="text-2xl font-bold">{day}</div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {event.dates.start.localDate} • {formattedTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mt-1">{event.name}</h3>
                        <p className="text-gray-600">
                          {event._embedded.venues[0].city.name},{" "}
                          {event._embedded.venues[0].name}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      className="min-w-[120px]"
                      onClick={() => {
                        /* Add your ticket purchase logic */
                      }}
                    >
                      Find Tickets
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index + 1}
                  variant={currentPage === index + 1 ? "default" : "outline"}
                  onClick={() => handlePageChange(index + 1)}
                  className="w-10"
                >
                  {index + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="container mx-auto px-4 py-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
