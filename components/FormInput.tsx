'use client';

import { useState } from 'react';
import { Button } from './ui/button'; // Importiere Button aus deiner UI-Komponenten
import { Input } from './ui/input';   // Importiere Input aus deiner UI-Komponenten
import { toast } from './ui/use-toast'; // Importiere toast für Fehlermeldungen
import { supabase } from '../lib/supabase'; // Importiere Supabase-Client

// Komponente für das Eingabeformular
const FormInput = () => {
  const [newCategory, setNewCategory] = useState(''); // State für die Eingabe der neuen Kategorie
  const [loading, setLoading] = useState(false); // Ladezustand, um zu wissen, ob das Formular gerade verarbeitet wird

  // Funktion zum Hinzufügen einer neuen Kategorie in die Supabase-Datenbank
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Kategorienamen ein.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true); // Ladezustand wird aktiviert, während die Kategorie hinzugefügt wird

    try {
      const { data, error } = await supabase
        .from('categories')  // Auf die `categories`-Tabelle zugreifen
        .insert([{ name: newCategory.trim() }]) // Neue Kategorie einfügen
        .select(); // Optional: Wähle die eingefügte Kategorie zurück

      if (error) throw error; // Fehlerbehandlung

      // Erfolgreich hinzugefügt
      setNewCategory(''); // Eingabefeld zurücksetzen
      toast({
        title: 'Kategorie hinzugefügt',
        description: 'Die neue Kategorie wurde erfolgreich hinzugefügt.',
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      toast({
        title: 'Fehler',
        description: 'Die Kategorie konnte nicht hinzugefügt werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false); // Ladezustand zurücksetzen
    }
  };

  return (
    <div className="space-y-4">
      <Input
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)} // Wert aus der Eingabe holen
        placeholder="Neue Kategorie" // Platzhaltertext für das Eingabefeld
      />
      <Button onClick={addCategory} disabled={loading}> {/* Button zum Absenden */}
        {loading ? 'Hinzufügen...' : 'Hinzufügen'}
      </Button>
    </div>
  );
};

export default FormInput;
