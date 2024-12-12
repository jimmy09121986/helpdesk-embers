'use client';  // Damit die Datei als Client-Komponente behandelt wird

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Verwende next/navigation statt next/router
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface ErrorData {
  id: string;
  title: string;
  description: string;
  solution: string;
  photos: string[];
  created_at: string;
}

const ErrorDetail = () => {
  const router = useRouter();
  const [error, setError] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sicherstellen, dass der 'id'-Parameter verfügbar ist
    if (router.query.id) {
      const { id } = router.query;

      // Fehler aus der Datenbank holen
      const fetchError = async () => {
        try {
          const { data, error } = await supabase
            .from('errors')
            .select('*')
            .eq('id', id)
            .single();  // .single() sorgt dafür, dass nur ein Datensatz zurückgegeben wird

          if (error) throw error;

          setError(data);
        } catch (error) {
          console.error('Fehler beim Laden der Fehlermeldung:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchError();
    }
  }, [router.query.id]); // Effekt nur ausführen, wenn der id-Parameter verfügbar ist

  if (loading) return <div>Loading...</div>; // Ladezustand anzeigen

  if (!error) return <div>Fehler nicht gefunden.</div>; // Wenn keine Fehlermeldung gefunden wurde

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold">{error.title}</h1>
      <p>{error.description}</p>
      <p>{error.solution}</p>
      {error.photos.length > 0 && (
        <div className="mt-4">
          <h2>Fotos</h2>
          {error.photos.map((photo, index) => (
            <Image
              key={index}
              src={photo}
              alt={`Fehlerfoto ${index + 1}`}
              width={800}
              height={600}
              className="max-w-full"
            />
          ))}
        </div>
      )}
      <p className="text-sm text-gray-500">
        Erstellt am: {new Date(error.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export default ErrorDetail;

