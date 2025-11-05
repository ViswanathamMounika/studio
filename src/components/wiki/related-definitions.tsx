
'use client';

import { useState, useEffect } from 'react';
import { suggestDefinitions } from '@/ai/flows/definition-suggestion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Definition } from '@/lib/types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import { initialDefinitions } from '@/lib/data';

type RelatedDefinitionsProps = {
  currentDefinition: Definition;
  onDefinitionClick: (id: string, sectionId?: string) => void;
};

export default function RelatedDefinitions({ currentDefinition, onDefinitionClick }: RelatedDefinitionsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [definitions] = useLocalStorage<Definition[]>('definitions', initialDefinitions);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await suggestDefinitions({
        currentDefinitionName: currentDefinition.name,
        currentDefinitionDescription: currentDefinition.description,
        keywords: currentDefinition.keywords,
      });
      setSuggestions(result.suggestedDefinitions);
    } catch (err) {
      setError('Failed to fetch related definitions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDefinition.id]);

  const findDefinitionByName = (name: string): Definition | null => {
    const search = (items: Definition[]): Definition | null => {
        for (const item of items) {
            if (item.name.toLowerCase() === name.toLowerCase()) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return null;
    };
    return search(definitions);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
            {error}
            <Button variant="secondary" size="sm" onClick={fetchSuggestions} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
            </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const renderedSuggestions = suggestions
    .map(name => findDefinitionByName(name))
    .filter((def): def is Definition => def !== null && def.id !== currentDefinition.id);

  return (
    <div className="space-y-3">
        {renderedSuggestions.length > 0 ? (
            renderedSuggestions.map((def, index) => (
                <Card key={index} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                        <button
                            onClick={() => onDefinitionClick(def.id)}
                            className="text-left w-full"
                        >
                            <p className="font-semibold text-primary">{def.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: def.description.replace(/<[^>]+>/g, '') }}></p>
                        </button>
                    </CardContent>
                </Card>
            ))
        ) : (
            <p className="text-muted-foreground text-center py-4">No related definitions found.</p>
        )}
    </div>
  );
}
