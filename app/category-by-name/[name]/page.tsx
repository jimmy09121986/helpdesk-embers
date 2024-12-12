'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      toast.error('Fehler beim Laden der Kategorien');
    } else {
      setCategories(data || []);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategoryName }])
      .select();

    if (error) {
      console.error('Error adding category:', error);
      toast.error('Fehler beim Hinzufügen der Kategorie');
    } else {
      toast.success('Kategorie erfolgreich hinzugefügt');
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const saveEdit = async () => {
    if (!editingCategory) return;

    const { data, error } = await supabase
      .from('categories')
      .update({ name: editingCategory.name })
      .eq('id', editingCategory.id)
      .select();

    if (error) {
      console.error('Error updating category:', error);
      toast.error('Fehler beim Aktualisieren der Kategorie');
    } else {
      toast.success('Kategorie erfolgreich aktualisiert');
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const deleteCategory = async (id: number) => {
    // Zuerst prüfen, ob es Fehlermeldungen für diese Kategorie gibt
    const { data: errors, error: errorsFetchError } = await supabase
      .from('errors')
      .select('id')
      .eq('category_id', id);

    if (errorsFetchError) {
      console.error('Error checking for related errors:', errorsFetchError);
      toast.error('Fehler beim Prüfen auf zugehörige Fehlermeldungen');
      return;
    }

    if (errors && errors.length > 0) {
      toast.error('Diese Kategorie kann nicht gelöscht werden, da ihr noch Fehlermeldungen zugeordnet sind. Bitte löschen Sie zuerst alle zugehörigen Fehlermeldungen.');
      return;
    }

    // Wenn keine Fehlermeldungen vorhanden sind, fahren wir mit dem Löschen fort
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      toast.error('Fehler beim Löschen der Kategorie');
    } else {
      toast.success('Kategorie erfolgreich gelöscht');
      fetchCategories();
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Kategorien verwalten</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Neue Kategorie hinzufügen</h2>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Kategoriename"
              className="flex-grow"
            />
            <Button onClick={addCategory}>
              <Plus className="mr-2 h-4 w-4" /> Hinzufügen
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Kategorieliste</h2>
        <ul className="space-y-4">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between bg-white shadow rounded-lg p-4">
              {editingCategory && editingCategory.id === category.id ? (
                <Input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="flex-grow mr-2"
                />
              ) : (
                <span>{category.name}</span>
              )}
              <div className="space-x-2">
                {editingCategory && editingCategory.id === category.id ? (
                  <>
                    <Button onClick={saveEdit} variant="outline">Speichern</Button>
                    <Button onClick={cancelEditing} variant="outline">Abbrechen</Button>
                  </>
                ) : (
                  <Button onClick={() => startEditing(category)} variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={() => deleteCategory(category.id)} variant="outline" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <ToastContainer />
      </div>
    </main>
  );
}

