'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Trash2, Edit, X } from 'lucide-react';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorEntry {
  id: number;
  description: string;
  solution: string;
  created_at: string;
  updated_at: string;
  photos: string[];
  created_by: string;
  last_edited_by: string;
}

export default function ErrorEntryManager() {
  const params = useParams();
  const id = params.id as string;
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ErrorEntry | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editSolution, setEditSolution] = useState('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPhotos(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const onEditDrop = useCallback((acceptedFiles: File[]) => {
    Promise.all(acceptedFiles.map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
    )).then(results => {
      setEditPhotos(prev => [...prev, ...results]);
    });
  }, []);

  const { getRootProps: getEditRootProps, getInputProps: getEditInputProps } = useDropzone({ onDrop: onEditDrop });

  useEffect(() => {
    fetchErrorEntries();
  }, [id]);

  const fetchErrorEntries = async () => {
    const { data, error } = await supabase
      .from('errors')
      .select('id, description, solution, created_at, updated_at, photos, created_by, last_edited_by')
      .eq('category_id', id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching error entries:', error);
      toast({
        title: "Fehler",
        description: 'Fehler beim Laden der Einträge',
        variant: "destructive",
      });
    } else {
      setErrorEntries(data || []);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-AT', { 
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Fehler",
          description: 'Sie müssen angemeldet sein, um einen Fehler zu melden.',
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const photoUrls = await Promise.all(photos.map(async (photo) => {
        const fileName = `${Date.now()}-${photo.name}`;
        const { data, error } = await supabase.storage
          .from('error-photos')
          .upload(fileName, photo);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('error-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      }));

      const now = new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna' });
      const { data: errorData, error: errorInsertError } = await supabase
        .from('errors')
        .insert([
          {
            description,
            solution,
            category_id: id,
            created_by: user.email,
            last_edited_by: user.email,
            created_at: now,
            updated_at: now,
            photos: photoUrls,
          }
        ])
        .select();

      if (errorInsertError) throw errorInsertError;

      if (errorData && errorData.length > 0) {
        const errorId = errorData[0].id;
        const photoEntries = photoUrls.map(url => ({
          error_id: errorId,
          photo_url: url
        }));

        const { error: photoInsertError } = await supabase
          .from('error_photos')
          .insert(photoEntries);

        if (photoInsertError) throw photoInsertError;

        toast({
          title: "Erfolg",
          description: 'Eintrag wurde erfolgreich gespeichert!',
        });
        setDescription('');
        setSolution('');
        setPhotos([]);
        fetchErrorEntries();
      } else {
        throw new Error('Keine Daten zurückgegeben');
      }
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen:', error.message);
      toast({
        title: "Fehler",
        description: 'Fehler konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    try {
      await supabase
        .from('error_photos')
        .delete()
        .eq('error_id', entryId);

      const { error } = await supabase
        .from('errors')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: 'Eintrag wurde erfolgreich gelöscht!',
      });
      fetchErrorEntries();
    } catch (error: any) {
      console.error('Fehler beim Löschen:', error.message);
      toast({
        title: "Fehler",
        description: 'Fehler konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.',
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleEdit = (entry: ErrorEntry) => {
    setEditingEntry(entry);
    setEditDescription(entry.description);
    setEditSolution(entry.solution);
    setEditPhotos(entry.photos);
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Fehler",
          description: 'Sie müssen angemeldet sein, um einen Fehler zu bearbeiten.',
          variant: "destructive",
        });
        return;
      }

      const now = new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna' });
      const { data, error } = await supabase
        .from('errors')
        .update({
          description: editDescription,
          solution: editSolution,
          photos: editPhotos,
          last_edited_by: user.email,
          updated_at: now,
        })
        .eq('id', editingEntry.id)
        .select();

      if (error) throw error;

      if (data) {
        await supabase
          .from('error_photos')
          .delete()
          .eq('error_id', editingEntry.id);

        const photoEntries = editPhotos.map(url => ({
          error_id: editingEntry.id,
          photo_url: url
        }));

        const { error: photoInsertError } = await supabase
          .from('error_photos')
          .insert(photoEntries);

        if (photoInsertError) throw photoInsertError;

        toast({
          title: "Erfolg",
          description: 'Eintrag wurde erfolgreich aktualisiert!',
        });
        setEditingEntry(null);
        fetchErrorEntries();
      }
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren:', error.message);
      toast({
        title: "Fehler",
        description: 'Fehler konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/dashboard" className="mb-6 inline-block">
        <Button variant="outline">
          Zurück zum Dashboard
        </Button>
      </Link>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fehlermeldung hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full"
                placeholder="Beschreiben Sie den Fehler"
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-1">
                Lösung
              </label>
              <Textarea
                id="solution"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                required
                className="w-full"
                placeholder="Beschreiben Sie die Lösung"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotos
              </label>
              <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Legen Sie die Dateien hier ab ...</p>
                ) : (
                  <p>Ziehen Sie Dateien hierher oder klicken Sie, um Dateien auszuwählen</p>
                )}
              </div>
              {photos.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {photos.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600">{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Wird hinzugefügt...' : 'Fehler melden'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold mb-4">Gespeicherte Fehlermeldungen</h2>
      <div className="space-y-4">
        {errorEntries.map((entry) => (
          <Card key={entry.id} className="transition-all duration-300 ease-in-out hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-grow overflow-hidden">
                  <h3 className="font-medium text-lg mb-2">{entry.description}</h3>
                  <div className="mt-2">
                    <p className="text-gray-600 whitespace-pre-wrap break-words overflow-hidden">{entry.solution}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Erstellt am: {formatDateForDisplay(entry.created_at)} von {entry.created_by}
                  </p>
                  {entry.updated_at && entry.updated_at !== entry.created_at && (
                    <p className="text-sm text-gray-500">
                      Zuletzt bearbeitet am: {formatDateForDisplay(entry.updated_at)} von {entry.last_edited_by}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit className="h-5 w-5" />
                    <span className="sr-only">Bearbeiten</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setEntryToDelete(entry.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Löschen</span>
                  </Button>
                </div>
              </div>
              {entry.photos && entry.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.photos.map((photo, index) => (
                    <Image
                      key={index}
                      src={photo}
                      alt={`Fehlerbild ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover cursor-pointer"
                      onClick={() => setSelectedImage(photo)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">Vergrößertes Fehlerbild</DialogTitle>
            </DialogHeader>
            <Image
              src={selectedImage}
              alt="Vergrößertes Fehlerbild"
              width={800}
              height={800}
              className="rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full"
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="editSolution" className="block text-sm font-medium text-gray-700 mb-1">
                Lösung
              </label>
              <Textarea
                id="editSolution"
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                className="w-full"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotos
              </label>
              <div {...getEditRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <input {...getEditInputProps()} />
                <p>Ziehen Sie neue Fotos hierher oder klicken Sie, um Fotos hinzuzufügen</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {editPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={photo}
                      alt={`Fehlerbild ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      onClick={() => setEditPhotos(editPhotos.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingEntry(null)} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={handleUpdate}>
              Aktualisieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eintrag löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diesen Eintrag löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={() => entryToDelete && handleDelete(entryToDelete)} variant="destructive">
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

