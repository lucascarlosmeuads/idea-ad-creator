import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ImageProviderFactory } from "@/services/imageProviderFactory";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

const SimpleImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Basic SEO: title, meta description, canonical
  useEffect(() => {
    const title = "Gerador de Imagens por Prompt | Anúncio IA";
    const description = "Cole um prompt e gere 1 imagem por vez com DALL·E 3 (1024x1024, HD, vívida).";
    if (document.title !== title) document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    } else {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      m.setAttribute("content", description);
      document.head.appendChild(m);
    }

    const canonicalHref = window.location.origin + window.location.pathname;
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;
  }, []);

  const isDisabled = useMemo(() => !prompt.trim() || loading, [prompt, loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const result = await ImageProviderFactory.generateImage({
        prompt: prompt.trim(),
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
      });
      setImageUrl(result.url);
    } catch (e) {
      // ImageProviderFactory already toasts errors; keep a fallback here
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Falha ao gerar a imagem.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "anuncio-gerado-ia.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gerador de Imagem por Prompt</h1>
      </header>

      <main>
        <section aria-label="Gerar imagem a partir de prompt">
          <Card>
            <CardHeader>
              <CardTitle>Insira seu prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Cole aqui o texto do seu anúncio ou descrição visual…"
                rows={6}
                aria-label="Área de texto do prompt"
              />

              <div className="flex items-center gap-3">
                <Button onClick={handleGenerate} disabled={isDisabled} aria-label="Gerar imagem">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando…
                    </span>
                  ) : (
                    "Gerar imagem"
                  )}
                </Button>

                {imageUrl && (
                  <Button variant="secondary" onClick={handleDownload} aria-label="Baixar imagem gerada">
                    <span className="inline-flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Baixar
                    </span>
                  </Button>
                )}
              </div>

              {imageUrl && (
                <figure className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Imagem de anúncio gerada por IA a partir do prompt fornecido"
                    loading="lazy"
                    className="w-full rounded-md"
                  />
                  <figcaption className="mt-2 text-sm text-muted-foreground">
                    Imagem 1024x1024 (HD, vívida) — gerada com DALL·E 3
                  </figcaption>
                </figure>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default SimpleImageGenerator;
