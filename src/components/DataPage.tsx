import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as defaultSupabase, type PhotoRow } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database, RefreshCw, Download, Trash2, Search, FileSpreadsheet,
  Lock, Unlock, ArrowLeft, Check, X, KeyRound, Copy,
  CheckCircle2, Image, Calendar, Mail, AlertCircle,
  MailIcon
} from "lucide-react";
import { DEFAULT_ADMIN_PASSWORD, STORAGE_KEYS } from "@/constants";

export function DataPage() {
  const navigate = useNavigate();

  // Authentication states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Data states
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // UI state
  const [searchText, setSearchText] = useState("");
  const [newsletterFilter, setNewsletterFilter] = useState<"all" | "yes" | "no">("all");
  const [commFilter, setCommFilter] = useState<"all" | "yes" | "no">("all");
  const [emailSentFilter, setEmailSentFilter] = useState<"all" | "yes" | "no">("all");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSending, setIsSending] = useState<number | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Load session authentication on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_data_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

    // Fetch photos from Supabase
  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const { data, error } = await defaultSupabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = data || [];
      setPhotos(rows);

      // Pre-fetch signed URLs for all photos
      const entries = await Promise.all(
        rows
          .filter((r) => r.photo_id)
          .map(async (r) => {
            const { data: urlData, error: urlError } = await defaultSupabase.storage
              .from("photobooth")
              .createSignedUrl(r.photo_id, 3600);
            if (urlError) {
              console.error("Erreur de génération de l'URL signée :", urlError);
              return [r.photo_id, ""] as const;
            }
            return [r.photo_id, urlData.signedUrl] as const;
          })
      );
      setPhotoUrls(Object.fromEntries(entries));
    } catch (err: unknown) {
      console.error("Erreur de récupération des données :", err);
      setFetchError(err instanceof Error ? err.message : "Erreur lors de la récupération des photos depuis Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch photos once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated, fetchPhotos]);

  // Authenticate admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      // 1. Fallback: local passcode authentication if email is empty
      if (!loginEmail.trim()) {
        const activePassword = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
        if (password === activePassword) {
          setIsAuthenticated(true);
          sessionStorage.setItem("admin_data_authenticated", "true");
          setAuthError("");
          return;
        } else {
          setAuthError("Mot de passe incorrect (ou saisissez un e-mail pour vous connecter via Supabase Auth).");
          return;
        }
      }

      // 2. Real connection/authentication via Supabase Auth
      const { data, error } = await defaultSupabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_data_authenticated", "true");
        setAuthError("");
      } else {
        setAuthError("Échec de l'authentification.");
      }
    } catch (err: unknown) {
      console.error("Erreur d'authentification Supabase :", err);
      setAuthError(err instanceof Error ? err.message : "Erreur de connexion à Supabase.");
    } finally {
      setIsAuthenticating(false);
    }
  };



  // Copy email to clipboard
  const handleCopyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Delete photo row and associated storage bucket file
  const handleDeletePhoto = async (row: PhotoRow) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette photo et ses données associées ? Cette action est irréversible.")) {
      return;
    }

    setIsDeleting(row.id);
    try {
      // 1. Delete from storage bucket if there's a file
      if (row.photo_id) {
        const { error: storageError } = await defaultSupabase
          .storage
          .from("photobooth")
          .remove([row.photo_id]);

        if (storageError) {
          console.warn("Avertissement: Impossible de supprimer le fichier du bucket storage :", storageError);
        }
      }

      // 2. Delete from database table
      const { error: dbError } = await defaultSupabase
        .from("photos")
        .delete()
        .eq("id", row.id);

      if (dbError) throw dbError;

      // Update state
      setPhotos((prev) => prev.filter((p) => p.id !== row.id));
    } catch (err: unknown) {
      console.error("Erreur de suppression :", err);
      alert(`Erreur de suppression : ${err instanceof Error ? err.message : "Erreur inconnue."}`);
    } finally {
      setIsDeleting(null);
    }
  };

    const handleResendPhoto = async (row: PhotoRow) => {
      setIsSending(row.id);
      try {
        const { error } = await defaultSupabase.functions.invoke('send-email', {
          body: { data_id: row.id },
        })
        if(error) {
          throw error;
        }
      } catch (err: unknown) {
        alert(`Erreur de suppression : ${err instanceof Error ? err.message : "Erreur inconnue."}`);
      } finally {
        setIsSending(null);
        fetchPhotos();
      }
    }

  // Get cached signed URL (synchronous — URLs are pre-fetched by loadPhotoUrls)
  const getPhotoUrl = (photoId: string): string => {
    return photoUrls[photoId] ?? "";
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPhotos.length === 0) return;

    // Headers
    const headers = ["ID", "Date", "Email", "Newsletter", "Communication Consent", "Photo URL"];

    // Rows
    const csvRows = filteredPhotos.map(row => [
      row.id,
      new Date(row.created_at).toLocaleString("fr-FR"),
      `"${row.email.replace(/"/g, '""')}"`,
      row.newsletter ? "Oui" : "Non",
      row.communication ? "Oui" : "Non",
      getPhotoUrl(row.photo_id)
    ]);

    // Combine
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `photobooth_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredPhotos = photos.filter((photo) => {
    // Search filter
    const matchesSearch = photo.email.toLowerCase().includes(searchText.toLowerCase());

    // Newsletter filter
    const matchesNewsletter =
      newsletterFilter === "all" ? true :
        newsletterFilter === "yes" ? photo.newsletter === true :
          photo.newsletter === false;

    // Comm filter
    const matchesComm =
      commFilter === "all" ? true :
        commFilter === "yes" ? photo.communication === true :
          photo.communication === false;

    // Email sent filter
    const matchesEmailSent =
      emailSentFilter === "all" ? true :
        emailSentFilter === "yes" ? photo.email_sent_at != null :
          photo.email_sent_at == null;

    return matchesSearch && matchesNewsletter && matchesComm && matchesEmailSent;
  });

  // Calculate statistics
  const totalPhotos = photos.length;

  // Render Login state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-neutral-950 to-neutral-950 pointer-events-none" />

        <Card className="w-full max-w-md bg-neutral-900/40 border-neutral-800 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden relative border">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-cyan-500/0" />

          <CardHeader className="text-center space-y-3 pt-8 pb-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-neutral-100">Portail d'Administration</CardTitle>
              <CardDescription className="text-neutral-400 mt-1">
                Accès sécurisé aux données de l'application
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  Adresse e-mail
                </label>
                <Input
                  type="email"
                  placeholder="admin@votredomaine.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-neutral-950/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-12 rounded-xl"
                  autoFocus
                />
                <p className="text-[10px] text-neutral-500">Laissez vide pour vous connecter avec le mot de passe local.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-500" />
                  Mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="Entrez le mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-neutral-950/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-12 rounded-xl"
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-12 rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="bg-neutral-950/30 border-t border-neutral-900 px-8 py-4 flex justify-between items-center text-xs text-neutral-500">
            <span>Photobooth App Admin Panel</span>
            <button
              onClick={() => navigate("/")}
              className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 font-medium hover:underline"
            >
              <ArrowLeft className="w-3 h-3" /> Retour
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 lg:p-10 flex flex-col space-y-8 select-text">
      {/* Background ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/10 via-neutral-950 to-neutral-950 pointer-events-none -z-10" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              DONNÉES DU PHOTOBOOTH
            </h1>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-sm">
              <Unlock className="w-3 h-3" /> Admin
            </span>
          </div>
          <p className="text-neutral-400 mt-1">
            Gérez les inscriptions, consultez les images et téléchargez la liste des emails collectés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Total Photos compact card */}
          <div className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl px-5 py-2 rounded-xl flex items-center gap-3 shadow-md relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Total Photos</p>
              <h3 className="text-lg font-black text-white leading-tight">{totalPhotos}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem("admin_data_authenticated");
                setIsAuthenticated(false);
              }}
              className="border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-xl h-11"
            >
              Verrouiller la session
            </Button>

            <Button
              onClick={() => navigate("/")}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-xl flex items-center gap-2 h-11"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>

      {/* Main Data Section */}
      <Card className="bg-neutral-900/30 border-neutral-800/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
        {/* Table Filters and Options Header */}
        <div className="p-6 border-b border-neutral-800/80 bg-neutral-900/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Rechercher par email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-neutral-950/60 border-neutral-800 pl-10 pr-4 text-neutral-200 placeholder:text-neutral-600 h-10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Newsletter filter dropdown */}
            <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 h-10">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Newsletter:</span>
              <select
                value={newsletterFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewsletterFilter(e.target.value as "all" | "yes" | "no")}
                className="bg-transparent text-sm text-neutral-300 font-medium border-none focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-950 text-neutral-300">Tous</option>
                <option value="yes" className="bg-neutral-950 text-emerald-400 font-semibold">Oui</option>
                <option value="no" className="bg-neutral-950 text-neutral-400">Non</option>
              </select>
            </div>

            {/* Communication filter dropdown */}
            <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 h-10">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Consentement Com:</span>
              <select
                value={commFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCommFilter(e.target.value as "all" | "yes" | "no")}
                className="bg-transparent text-sm text-neutral-300 font-medium border-none focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-950 text-neutral-300">Tous</option>
                <option value="yes" className="bg-neutral-950 text-emerald-400 font-semibold">Oui</option>
                <option value="no" className="bg-neutral-950 text-neutral-400">Non</option>
              </select>
            </div>

            {/* Email sent filter dropdown */}
            <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 h-10">
              <span className="text-xs text-neutral-500 font-semibold uppercase">Email envoyé:</span>
              <select
                value={emailSentFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setEmailSentFilter(e.target.value as "all" | "yes" | "no")}
                className="bg-transparent text-sm text-neutral-300 font-medium border-none focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-950 text-neutral-300">Tous</option>
                <option value="yes" className="bg-neutral-950 text-emerald-400 font-semibold">Oui</option>
                <option value="no" className="bg-neutral-950 text-neutral-400">Non</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <Button
              variant="outline"
              onClick={fetchPhotos}
              disabled={isLoading}
              className="border-neutral-800 hover:border-neutral-700 bg-neutral-950/50 hover:bg-neutral-900 rounded-xl text-neutral-300 flex items-center gap-2 h-10 px-4 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
              Rafraîchir
            </Button>

            <Button
              disabled={filteredPhotos.length === 0}
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 rounded-xl flex items-center gap-2 px-4 shadow-md shadow-emerald-500/10 transition-all active:scale-95 border-none"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter en CSV ({filteredPhotos.length})
            </Button>
          </div>
        </div>

        {/* Error message banner */}
        {fetchError && (
          <div className="m-6 flex items-center gap-3 text-red-400 text-sm bg-red-500/5 p-4 rounded-xl border border-red-500/15">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-neutral-400 text-xs mt-0.5">{fetchError}</p>
            </div>
            <Button onClick={fetchPhotos} size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
              Réessayer
            </Button>
          </div>
        )}

        {/* Table itself */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-12 h-12">
                <span className="absolute inset-0 border-4 border-neutral-800 rounded-full" />
                <span className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" />
              </div>
              <p className="text-neutral-400 font-medium">Chargement des données Supabase...</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 text-neutral-600">
                <Database className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-300">Aucun enregistrement trouvé</h3>
              <p className="text-neutral-500 text-sm max-w-xs text-center">
                {photos.length === 0
                  ? "Aucune photo n'est enregistrée dans la table Supabase pour le moment."
                  : "Aucun résultat ne correspond à vos filtres de recherche."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-xs font-bold uppercase bg-neutral-900/10">
                  <th className="py-4 px-6 font-semibold">ID</th>
                  <th className="py-4 px-6 font-semibold">Photo</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold text-center">Newsletter</th>
                  <th className="py-4 px-6 font-semibold text-center">Marketing / Com</th>
                  <th className="py-4 px-6 font-semibold">Date de capture</th>
                  <th className="py-4 px-6 font-semibold">Date d'envoi</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredPhotos.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-neutral-900/20 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-sm text-neutral-400">
                      #{row.id}
                    </td>

                    {/* Photo Thumbnail */}
                    <td className="py-4 px-6">
                      {row.photo_id ? (
                        <div
                          className="w-16 h-12 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden cursor-pointer relative group-hover:border-neutral-700 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md"
                          onClick={() => setPreviewPhotoUrl(getPhotoUrl(row.photo_id))}
                          title="Agrandir l'image"
                        >
                          <img
                            src={getPhotoUrl(row.photo_id)}
                            alt="Visiteur"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Search className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                          <Image className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-200 select-all">{row.email}</span>
                        <button
                          onClick={() => handleCopyEmail(row.email, row.id)}
                          className="text-neutral-500 hover:text-emerald-400 p-1 rounded transition-colors"
                          title="Copier l'email"
                        >
                          {copiedEmailId === row.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-200" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Newsletter badge */}
                    <td className="py-4 px-6 text-center">
                      {row.newsletter ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/15 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Oui
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-neutral-950 text-neutral-500 text-xs px-2.5 py-1 rounded-full border border-neutral-800/80 font-medium">
                          <X className="w-3.5 h-3.5" /> Non
                        </span>
                      )}
                    </td>

                    {/* Communication badge */}
                    <td className="py-4 px-6 text-center">
                      {row.communication ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/15 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Oui
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-neutral-950 text-neutral-500 text-xs px-2.5 py-1 rounded-full border border-neutral-800/80 font-medium">
                          <X className="w-3.5 h-3.5" /> Non
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <span>
                          {new Date(row.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-neutral-600 text-xs">•</span>
                        <span className="text-neutral-400 text-xs">
                          {new Date(row.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Date d'envoi */}
                    <td className="py-4 px-6 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        {row.email_sent_at ? (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                            <span>
                              {new Date(row.email_sent_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                            <span className="text-neutral-600 text-xs">•</span>
                            <span className="text-neutral-400 text-xs">
                              {new Date(row.email_sent_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </>
                        ) : (
                          <span className="text-neutral-200">Pas encore envoyé</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          disabled={isSending === row.id}
                          onClick={() => handleResendPhoto(row)}
                          className="bg-red-950/10 hover:bg-red-600 hover:text-white border border-red-950 text-red-400 rounded-xl w-9 h-9 flex items-center justify-center transition-all shadow-sm"
                          title="Renvoyer l'email"
                        >
                          {isSending === row.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <MailIcon className="w-4 h-4" />
                          )}
                        </Button>
                        {row.photo_id && (
                          <a
                            href={getPhotoUrl(row.photo_id)}
                            download={`photo_${row.id}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-850 p-2 rounded-xl text-neutral-400 hover:text-neutral-200 transition-colors shadow-sm"
                            title="Télécharger l'image HD"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={isDeleting === row.id}
                          onClick={() => handleDeletePhoto(row)}
                          className="bg-red-950/10 hover:bg-red-600 hover:text-white border border-red-950 text-red-400 rounded-xl w-9 h-9 flex items-center justify-center transition-all shadow-sm"
                          title="Supprimer cet enregistrement"
                        >
                          {isDeleting === row.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Photo Lightbox Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center max-h-[90vh]">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-12 right-0 text-neutral-400 hover:text-white flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              Fermer <X className="w-5 h-5 inline-block" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Agrandissement"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-neutral-800 animate-in zoom-in-95 duration-200"
            />
            <div className="mt-4 flex gap-3">
              <a
                href={previewPhotoUrl}
                download="photo_photobooth.png"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" /> Télécharger Haute Résolution
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
