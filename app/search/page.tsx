'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Loader2, X, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Category {
  id: number;
  name: string;
}

interface ErrorPhoto {
  id: number;
  photo_url: string;
}

interface ErrorEntry {
  id: number;
  description: string;
  solution: string;
  category_id: number;
  created_by: string;
  last_edited_by: string;
  created_at: string;
  photos: ErrorPhoto[];
  helpful_count: number;
  not_helpful_count: number;
}

interface Feedback {
  error_id: number;
  is_helpful: boolean;
}

export default function Search() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchErrorsByCategory(selectedCategory);
    } else {
      setErrors([]);
      setSelectedError(null);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Fehler beim Laden der Kategorien",
        description: "Die Kategorien konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorsByCategory = async (categoryId: string) => {
    setIsLoading(true);
    setErrors([]);
    setSelectedError(null);
    try {
      const { data: errorData, error: errorError } = await supabase
        .from('errors')
        .select(`
          *,
          error_photos (
            id,
            photo_url
          )
        `)
        .eq('category_id', categoryId);
      if (errorError) throw errorError;
      if (errorData && errorData.length > 0) {
        const errorsWithPhotos = errorData.map(error => ({
          ...error,
          photos: error.error_photos || []
        }));
        setErrors(errorsWithPhotos);
      } else {
        setErrors([]);
        toast({
          title: "Keine Fehlermeldungen gefunden",
          description: "Für diese Kategorie wurden keine Fehlermeldungen gefunden.",
          variant: "warning",
        });
      }
    } catch (error: any) {
      console.error('Error fetching errors:', error);
      toast({
        title: "Fehler beim Laden der Fehlermeldungen",
        description: `Die Fehlermeldungen konnten nicht geladen werden. Fehler: ${error.message || 'Unbekannter Fehler'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleErrorChange = (errorId: string) => {
    const selectedError = errors.find(e => e.id.toString() === errorId);
    setSelectedError(selectedError || null);
  };

  const handleImageClick = (photoUrl: string) => {
    setSelectedImage(photoUrl);
  };

  const handleFeedback = async (isHelpful: boolean) => {
    if (!selectedError) return;

    const newFeedback: Feedback = {
      error_id: selectedError.id,
      is_helpful: isHelpful
    };

    try {
      const { error: insertError } = await supabase
        .from('error_feedback')
        .insert(newFeedback);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('errors')
        .update({
          helpful_count: isHelpful ? selectedError.helpful_count + 1 : selectedError.helpful_count,
          not_helpful_count: isHelpful ? selectedError.not_helpful_count : selectedError.not_helpful_count + 1
        })
        .eq('id', selectedError.id);

      if (updateError) throw updateError;

      setSelectedError(prev => {
        if (!prev) return null;
        return {
          ...prev,
          helpful_count: isHelpful ? prev.helpful_count + 1 : prev.helpful_count,
          not_helpful_count: isHelpful ? prev.not_helpful_count : prev.not_helpful_count + 1
        };
      });

      setFeedback(newFeedback);
      toast({
        title: "Feedback gesendet",
        description: "Vielen Dank für Ihr Feedback!",
        variant: "success",
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Fehler beim Senden des Feedbacks",
        description: `Das Feedback konnte nicht gesendet werden. Fehler: ${error.message || 'Unbekannter Fehler'}`,
        variant: "destructive",
      });
    }
  };

  const renderSolutionSteps = (solution: string) => {
    const steps = solution.split(/\d+\./).filter(step => step.trim() !== '');
    return (
      <ol className="list-decimal list-inside space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="pl-2">{step.trim()}</li>
        ))}
      </ol>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fehlermeldungen suchen</h1>
        <Link href="/">
          <Button variant="outline">Zurück zur Startseite</Button>
        </Link>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleCategoryChange} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Fehlermeldungen</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : errors.length > 0 ? (
                <Select onValueChange={handleErrorChange} >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Fehlermeldung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {errors.map((error) => (
                      <SelectItem key={error.id} value={error.id.toString()} className="py-2 px-4 hover:bg-gray-100 text-black">
                        {error.description ? error.description.substring(0, 50) + (error.description.length > 50 ? '...' : '') : `Fehlermeldung ${error.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-center text-gray-500">Keine Fehlermeldungen für diese Kategorie gefunden.</p>
              )}
            </CardContent>
          </Card>
        )}
        {selectedError && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedError.description ? selectedError.description.substring(0, 50) + (selectedError.description.length > 50 ? '...' : '') : `Fehlermeldung ${selectedError.id}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Beschreibung:</h3>
                  <p className="text-gray-700">{selectedError.description}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Lösung:</h3>
                  {renderSolutionSteps(selectedError.solution)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Erstellt von:</p>
                    <p className="text-gray-700">{selectedError.created_by}</p>
                  </div>
                  <div>
                    <p className="font-medium">Zuletzt bearbeitet von:</p>
                    <p className="text-gray-700">{selectedError.last_edited_by}</p>
                  </div>
                  <div>
                    <p className="font-medium">Erstellt am:</p>
                    <p className="text-gray-700">{new Date(selectedError.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {selectedError.photos && selectedError.photos.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bilder:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedError.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square cursor-pointer" onClick={() => handleImageClick(photo.photo_url)}>
                          {photo.photo_url ? (
                            <Image src={photo.photo_url} alt={`Fehlerbild ${index + 1}`} layout="fill" objectFit="cover" className="rounded" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                              <p className="text-gray-500">Bild nicht verfügbar</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Keine Bilder verfügbar</p>
                )}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">War diese Anleitung hilfreich?</h3>
                  {feedback ? (
                    <p className="text-green-600">Vielen Dank für Ihr Feedback!</p>
                  ) : (
                    <div className="flex space-x-4">
                      <Button onClick={() => handleFeedback(true)} variant="outline">
                        <ThumbsUp className="mr-2 h-4 w-4" /> Ja
                      </Button>
                      <Button onClick={() => handleFeedback(false)} variant="outline">
                        <ThumbsDown className="mr-2 h-4 w-4" /> Nein
                      </Button>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Hilfreich: {selectedError.helpful_count} | Nicht hilfreich: {selectedError.not_helpful_count}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white z-10" onClick={() => setSelectedImage(null)}>
              <X className="h-6 w-6" />
            </Button>
            <Image src={selectedImage} alt="Vergrößertes Bild" layout="fill" objectFit="contain" />
          </div>
        </div>
      )}
    </div>
  )
}

