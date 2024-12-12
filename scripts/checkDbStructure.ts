import { supabase } from '../lib/supabase'

async function checkDbStructure() {
  try {
    // Überprüfen Sie die Struktur der 'errors' Tabelle
    const { data, error } = await supabase
      .from('errors')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Fehler beim Überprüfen der Tabellenstruktur:', error)
      return
    }

    // Überprüfen Sie, ob die 'category' Spalte existiert
    if (data && data.length > 0) {
      const firstRow = data[0]
      if (!('category' in firstRow)) {
        console.log("Die Spalte 'category' fehlt in der 'errors' Tabelle.")
        // Hier könnten wir Code hinzufügen, um die Spalte automatisch zu erstellen
      } else {
        console.log("Die Spalte 'category' existiert in der 'errors' Tabelle.")
      }
    } else {
      console.log("Die 'errors' Tabelle ist leer oder existiert nicht.")
    }

  } catch (error) {
    console.error('Ein unerwarteter Fehler ist aufgetreten:', error)
  }
}

checkDbStructure()

