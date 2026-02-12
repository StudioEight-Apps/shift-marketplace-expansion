import React, { createContext, useContext, useState, useCallback } from "react";

interface ContactContextValue {
  isOpen: boolean;
  openContact: () => void;
  closeContact: () => void;
  isListOpen: boolean;
  openListWithUs: () => void;
  closeListWithUs: () => void;
}

const ContactContext = createContext<ContactContextValue | null>(null);

export const useContact = () => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error("useContact must be used within a ContactProvider");
  }
  return context;
};

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const openContact = useCallback(() => setIsOpen(true), []);
  const closeContact = useCallback(() => setIsOpen(false), []);
  const openListWithUs = useCallback(() => setIsListOpen(true), []);
  const closeListWithUs = useCallback(() => setIsListOpen(false), []);

  return (
    <ContactContext.Provider value={{ isOpen, openContact, closeContact, isListOpen, openListWithUs, closeListWithUs }}>
      {children}
    </ContactContext.Provider>
  );
};
