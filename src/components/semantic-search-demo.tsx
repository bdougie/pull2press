import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { semanticSearch, type SearchResult } from '../lib/semantic-search';

export function SemanticSearchDemo() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const searchResults = await semanticSearch(query, 5, 0.3);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Semantic Search</h2>
        <p className="text-gray-600 mb-6">
          Search for blog posts using natural language. The search uses AI embeddings
          to find semantically similar content.
        </p>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search for posts... (e.g., 'performance optimization', 'authentication')"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>
      </Card>

      {searched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {results.length > 0 
              ? `Found ${results.length} results`
              : 'No results found'}
          </h3>
          
          {results.map((result) => (
            <Card key={result.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold">{result.title}</h4>
                <span className="text-sm text-gray-500">
                  {(result.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              <p className="text-gray-600 mb-3">{result.content}</p>
              <div className="flex justify-between items-center text-sm">
                <a
                  href={result.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View PR →
                </a>
                <span className="text-gray-500">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}