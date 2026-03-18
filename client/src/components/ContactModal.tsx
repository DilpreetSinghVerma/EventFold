import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ContactForm } from '@/components/ContactForm';

export function ContactModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* We use border-none, bg-transparent and p-0 to let ContactForm handle the styling without overriding Dialog positioning logic */}
      <DialogContent className="sm:max-w-xl p-0 border-none bg-transparent shadow-none">
        <ContactForm />
      </DialogContent>
    </Dialog>
  );
}
