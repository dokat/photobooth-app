import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";

export function useShareLogic(capturedPhoto: string) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [allowEmailStorage, setAllowEmailStorage] = useState<boolean | null>(null);
  const [allowPhotoStorage, setAllowPhotoStorage] = useState<boolean | null>(null);

  const isValidEmail = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) !== null;

  const handleSendEmail = async () => {
    if (!email || !capturedPhoto) return;
    setIsSending(true);
    setSendSuccess(false);

    try {
      const filename = await uploadPicture();
      await sendEmail(filename);
      setSendSuccess(true);
      setEmail("");
    } catch (error) {
      console.error('Erreur lors de l’envoi :', error);
      alert('Erreur lors de l’envoi. Vérifiez votre configuration Supabase.');
    } finally {
      setIsSending(false);
    }
  }

  const sendEmail = async (filename: string) => {
    // const { data, error } = await supabase.functions.invoke('send-email', {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { filename, email, newsletter: allowEmailStorage ?? false, communication: allowPhotoStorage ?? false },
    })

    if (error) {
      throw error;
    }
  };

  const uploadPicture = async () => {
    // Fetch blob once for both DB and Upload
    const res = await fetch(capturedPhoto);
    const photoBlob = await res.blob();

    // Save to IndexedDB if consent is given
    if (allowEmailStorage) {
      await db.visiteurs.add({
        email: email,
        photo: allowPhotoStorage ? photoBlob : undefined
      });
    }

    // Upload to Supabase bucket 'photobooth'
    const fileName = `${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase
      .storage
      .from('photobooth')
      .upload(fileName, photoBlob, {
        contentType: 'image/png'
      });

    if (uploadError) {
      throw uploadError;
    }

    return fileName;
  };

  return {
    email,
    setEmail,
    isSending,
    sendSuccess,
    setSendSuccess,
    allowEmailStorage,
    setAllowEmailStorage,
    allowPhotoStorage,
    setAllowPhotoStorage,
    handleSendEmail,
    isValidEmail
  };
}
