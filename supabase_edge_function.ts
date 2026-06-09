// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js';
import { Buffer } from "node:buffer";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
    // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json();

  let filename;
  let email;
  let data_id;

  if(body.data_id === undefined) {
    filename = body.filename;
    email = body.email;

    const { data, error } = await supabase
      .from('photos')
      .insert({
        email,
        photo_id: filename,
        newsletter: body.newsletter,
        communication: body.communication
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur base de données :', error);
      return new Response(
        JSON.stringify({ error: 'Enregistrement impossible' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    data_id = data.id;
  } else {
    data_id = body.data_id;
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('id', data_id)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Photo introuvable' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    filename = data.photo_id;
    email = data.email;
  }

  console.log('data_id ', data_id);

  const file = await supabase.storage
    .from("photobooth")
    .download(filename);

  if(!file.data) {
    console.log('file not found!');
    return new Response(
      JSON.stringify({ error: 'file not found' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // const arrayBuffer = await file.data.arrayBuffer();
  // const uint8 = new Uint8Array(arrayBuffer);
  // let binary = "";
  // for (let i = 0; i < uint8.length; i++) {
  //   binary += String.fromCharCode(uint8[i]);
  // }
  // const base64 = btoa(binary);
  const arrayBuffer = await file.data.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'no-reply@contact.museeduchateaudemayenne.fr',
      to: email,
      subject: "Votre photo 📸",
      html: `
        <p>Votre photo est disponible ici :</p>
        `,
        attachments: [
          {
            filename: "photo.png",
            content: base64,
          },
        ],
    }),
  });

  const responseData = await res.json();

  if (res.ok) {
    const { error } = await supabase
      .from('photos')
      .update({
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', data_id);
  }

  return new Response(JSON.stringify(responseData), {
    headers: { ...corsHeaders,  'Content-Type': 'application/json' },
  })
})