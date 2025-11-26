export interface BookInfo {
  title: string;
  authors: string;
  description: string;
  genre: string;
  rating: number | null;
  publishedDate?: string;
  pageCount?: number;
  imageUrl?: string;
  source: string;
}

export async function fetchBookInfo(title: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`
    );
    
    if (!res.ok) {
      console.error(`Google Books API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    
    if (!data.items?.length) {
      return null;
    }

    const bookData = data.items[0].volumeInfo;

    return {
      title: bookData.title || title,
      authors: bookData.authors?.join(", ") || "Unknown Author",
      description: bookData.description || "No description available.",
      genre: bookData.categories?.join(", ") || "Unknown",
      rating: bookData.averageRating || null,
      publishedDate: bookData.publishedDate,
      pageCount: bookData.pageCount,
      imageUrl: bookData.imageLinks?.thumbnail,
      source: "Google Books"
    };
  } catch (error) {
    console.error("Error fetching book info:", error);
    return null;
  }
}
