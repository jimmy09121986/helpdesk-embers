'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Calendar, User, X } from 'lucide-react';
import { Bell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Category {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
  last_edited_by: string;
  updated_at: string;
}

export default function DashboardContent() {
  const { user, logout } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newTicketsCount, setNewTicketsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      fetchCategories();
      fetchNewTicketsCount();
    }
  }, [user, router]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Fehler beim Laden der Kategorien',
        description: 'Die Kategorien konnten nicht geladen werden.',
        variant: 'destructive',
      });
    }
  };

  const addCategory = async () => {
    if (newCategory.trim() !== '') {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const now = new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna' });
        const { data, error } = await supabase
          .from('categories')
          .insert([{ 
            name: newCategory.trim(),
            created_by: userData.user.email,
            created_at: now,
            last_edited_by: userData.user.email,
            updated_at: now
          }])
          .select();

        if (error) throw error;

        if (data) {
          setCategories((prevCategories) => [...prevCategories, data[0]]);
          setNewCategory('');
          toast({
            title: 'Kategorie hinzugefügt',
            description: 'Die neue Kategorie wurde erfolgreich hinzugefügt.',
          });
        }
      } catch (error) {
        console.error('Error adding category:', error);
        toast({
          title: 'Fehler beim Hinzufügen der Kategorie',
          description: 'Die Kategorie konnte nicht hinzugefügt werden.',
          variant: 'destructive',
        });
      }
    }
  };

  const deleteCategory = async () => {
    if (categoryToDelete) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryToDelete.id);

        if (error) throw error;

        setCategories(categories.filter((category) => category.id !== categoryToDelete.id));
        setCategoryToDelete(null);
        setIsDeleteDialogOpen(false);
        toast({
          title: 'Kategorie gelöscht',
          description: 'Die Kategorie wurde erfolgreich gelöscht.',
        });
      } catch (error) {
        toast({
          title: 'Fehler beim Löschen der Kategorie',
          description: 'Die Kategorie kann nicht gelöscht werden, da noch Einträge damit verknüpft sind.',
          variant: 'destructive',
        });
      }
    }
  };

  const startEditingCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setIsEditDialogOpen(true);
  };

  const saveEditedCategory = async () => {
    if (editingCategory && editedCategoryName.trim() !== '') {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const now = new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna' });
        const { error } = await supabase
          .from('categories')
          .update({ 
            name: editedCategoryName.trim(),
            last_edited_by: userData.user.email,
            updated_at: now
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category.id === editingCategory.id
              ? { 
                  ...category, 
                  name: editedCategoryName.trim(),
                  last_edited_by: userData.user.email,
                  updated_at: now
                }
              : category
          )
        );
        setEditingCategory(null);
        setEditedCategoryName('');
        setIsEditDialogOpen(false);
        toast({
          title: 'Kategorie aktualisiert',
          description: 'Die Kategorie wurde erfolgreich aktualisiert.',
        });
      } catch (error) {
        console.error('Error updating category:', error);
        toast({
          title: 'Fehler beim Aktualisieren der Kategorie',
          description: 'Die Kategorie konnte nicht aktualisiert werden.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout-Fehler:', error);
      toast({
        title: 'Fehler beim Ausloggen',
        description: 'Es gab ein Problem beim Ausloggen. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    }
  };

  const fetchNewTicketsCount = async () => {
    try {
      const { data, error, count } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact' })
        .eq('status', 'new');

      if (error) throw error;

      setNewTicketsCount(count || 0);
    } catch (error) {
      console.error('Error fetching new tickets count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNewTicketsCount();
    }
  }, [user]);


  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="bg-gray-100 px-3 py-2 rounded-md w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700">Eingeloggt als:</span>
            <span className="ml-2 text-sm font-bold text-gray-900">{user.email}</span>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Link href="/benachrichtigung" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Bell className="w-4 h-4 mr-2" />
                SupportTickets
                {newTicketsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {newTicketsCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              Ausloggen
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-4 overflow-x-auto">
        <CardHeader>
          <CardTitle>Kategorien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Neue Kategorie"
              className="flex-grow"
            />
            <Button onClick={addCategory} className="whitespace-nowrap w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Hinzufügen
            </Button>
          </div>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="bg-white shadow-sm rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                  <Link href={`/category/${category.id}`} className="flex-grow">
                    <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors duration-200">
                      {category.name}
                    </h3>
                  </Link>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => startEditingCategory(category)} className="w-full sm:w-auto">
                      <Edit className="w-4 h-4 mr-1" /> Bearbeiten
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => {
                      setCategoryToDelete(category);
                      setIsDeleteDialogOpen(true);
                    }} className="w-full sm:w-auto">
                      <Trash2 className="w-4 h-4 mr-1" /> Löschen
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" /> Erstellt von: {category.created_by}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> am: {new Date(category.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" /> Zuletzt bearbeitet: {category.last_edited_by}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> am: {new Date(category.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorie bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie den Namen der Kategorie und klicken Sie auf Speichern.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="editedCategoryName"
                value={editedCategoryName}
                onChange={(e) => setEditedCategoryName(e.target.value)}
                className="col-span-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)} variant="outline">
              <X className="w-4 h-4 mr-2" /> Abbrechen
            </Button>
            <Button onClick={saveEditedCategory}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bestätigung der Löschung</DialogTitle>
            <DialogDescription>
              Möchten Sie diese Kategorie wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
              <X className="w-4 h-4 mr-2" /> Abbrechen
            </Button>
            <Button onClick={deleteCategory} variant="destructive">
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

