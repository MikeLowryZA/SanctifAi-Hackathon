import { useState } from "react";
import { Search, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  onSearch: (title: string, mediaType?: string, artist?: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mediaType, setMediaType] = useState<string>("all");

  const isSongSelected = mediaType === "song";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSearch(
        title.trim(),
        mediaType === "all" ? undefined : mediaType,
        isSongSelected && artist.trim() ? artist.trim() : undefined
      );
    }
  };

  // Update placeholder based on media type
  const getPlaceholder = () => {
    if (isSongSelected) {
      return "Enter song title...";
    }
    return "Enter a movie, show, song, or book title...";
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Main search row: Type dropdown, Title input, Search button */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* 1. Media Type Dropdown - LEFTMOST */}
          <Select value={mediaType} onValueChange={setMediaType} disabled={isLoading}>
            <SelectTrigger
              className="w-full sm:w-[140px] h-12 rounded-2xl border-2"
              data-testid="select-media-type"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="show">TV Show</SelectItem>
              <SelectItem value="song">Song</SelectItem>
              <SelectItem value="book">Book</SelectItem>
            </SelectContent>
          </Select>

          {/* 2. Title Input - CENTER */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={getPlaceholder()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl shadow-xl border-2 focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="input-search"
              disabled={isLoading}
            />
            {isSongSelected && (
              <Label
                htmlFor="title-input"
                className="absolute -top-2 left-4 px-2 bg-background text-xs font-medium text-muted-foreground"
              >
                Song Title
              </Label>
            )}
          </div>

          {/* 3. Search Button - RIGHTMOST */}
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8 rounded-2xl text-base font-semibold"
            disabled={!title.trim() || isLoading}
            data-testid="button-search"
          >
            {isLoading ? "Seeking wisdom..." : "Search with Discernment"}
          </Button>
        </div>

        {/* Conditional Artist Field - Shows when Song is selected */}
        {isSongSelected && (
          <div
            className="relative animate-in slide-in-from-top-2 duration-300"
            data-testid="artist-field-container"
          >
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Enter artist name (optional)..."
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl border-2 focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="input-artist"
              disabled={isLoading}
            />
            <Label
              htmlFor="artist-input"
              className="absolute -top-2 left-4 px-2 bg-background text-xs font-medium text-muted-foreground"
            >
              Artist Name
            </Label>
          </div>
        )}
      </div>
    </form>
  );
}
