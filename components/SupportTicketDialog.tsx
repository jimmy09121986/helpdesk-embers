'use client'

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string | undefined) => {
  return phone && phone.replace(/\D/g, '').length >= 6;
};

export function SupportTicketDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prevImages => [...prevImages, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {'image/*': []},
    multiple: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast({
        title: "Ungültige E-Mail",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        variant: "destructive",
      });
      return;
    }
    if (!isValidPhone(phone)) {
      toast({
        title: "Ungültige Telefonnummer",
        description: "Bitte geben Sie eine gültige Telefonnummer ein.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true)

    try {
      const image_urls: string[] = []

      // Upload images
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ticket-images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          throw new Error(`Fehler beim Hochladen des Bildes: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('ticket-images')
          .getPublicUrl(fileName)

        image_urls.push(publicUrl)
      }

      // Insert ticket data
      const { data: insertData, error: insertError } = await supabase
        .from('support_tickets')
        .insert({ 
          name, 
          email, 
          phone, 
          error_description: description, 
          image_url: image_urls.length > 0 ? image_urls.join(',') : null
        })
        .select()

      if (insertError) {
        console.error('Error inserting ticket:', insertError)
        throw new Error(`Fehler beim Erstellen des Tickets: ${insertError.message}`)
      }

      console.log('Inserted ticket data:', insertData)

      toast({
        title: "Ticket erstellt",
        description: "Ihr Support-Ticket wurde erfolgreich erstellt.",
      })

      // Reset form and close dialog
      setName('')
      setEmail('')
      setPhone('')
      setDescription('')
      setImages([])
      setIsOpen(false)
    } catch (error: any) {
      console.error('Detailed error:', error)
      toast({
        title: "Fehler",
        description: error.message || "Es gab einen Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support-Ticket erstellen</DialogTitle>
          <DialogDescription>
            Füllen Sie das Formular aus, um ein neues Support-Ticket zu erstellen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email*
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`col-span-3 ${!isValidEmail(email) && email !== '' ? 'border-red-500' : ''}`}
                required
              />
              {!isValidEmail(email) && email !== '' && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">Bitte geben Sie eine gültige E-Mail-Adresse ein.</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefon*
              </Label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="DE"
                value={phone}
                onChange={setPhone as (value: string | undefined) => void}
                className="col-span-3"
                required
              />
              {!isValidPhone(phone) && phone !== '' && (
                <p className="text-red-500 text-sm col-span-3 col-start-2">Bitte geben Sie eine gültige Telefonnummer ein.</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Beschreibung*
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Fotos
              </Label>
              <div {...getRootProps()} className="col-span-3 border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer">
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Lassen Sie die Bilder hier fallen ...</p>
                ) : (
                  <p>Ziehen Sie Bilder hierher oder klicken Sie, um Bilder auszuwählen</p>
                )}
              </div>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4">
                  <p className="mb-2">Ausgewählte Bilder:</p>
                  <div className="flex flex-wrap gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image src={URL.createObjectURL(image)} alt={`Vorschau ${index + 1}`} width={100} height={100} className="rounded-md" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird erstellt...' : 'Ticket erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

