import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Camera, FileUp, Download, ScanLine, Trash2, CheckCircle2, X, Play, StopCircle,
  Share2, ExternalLink
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * DocumentsCard — drop-in component for a "Documents" feature.
 * Tabs: Lab Results, Official ID, Insurance/IMSS (country-aware label)
 * For each tab: Upload, Scan→PDF, Download, Share, Delete
 */

const COUNTRY_INSURANCE_LABEL: Record<string, string> = {
  MX: "IMSS / Seguro (credencial)",
  US: "Insurance / Medicare card",
  CA: "Provincial Health Card",
  BR: "SUS Card",
  UK: "NHS Number Card",
  IN: "Ayushman / Insurance Card",
};

function insuranceLabel(country?: string) {
  if (!country) return "Insurance ID";
  return COUNTRY_INSURANCE_LABEL[country] ?? "Insurance ID";
}

type DocKind = "lab" | "official_id" | "insurance_id";

type Props = {
  defaultCountry?: string; // e.g., "MX", "US"
  onSave?: (kind: DocKind, file: File) => Promise<void> | void; // PDF or image file
  onDelete?: (kind: DocKind, doc: { name: string; url: string }) => Promise<void> | void; // optional backend delete
  existing?: Partial<Record<DocKind, Array<{ name: string; url: string }>>>; // pre-existing docs to show
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentsCard({ defaultCountry = "MX", onSave, onDelete, existing }: Props) {
  const [country, setCountry] = useState(defaultCountry);
  const [active, setActive] = useState<DocKind>("lab");
  const insLabel = useMemo(() => insuranceLabel(country), [country]);

  // Keep last-saved items (in-memory) so we can Download/Share immediately
  const [recent, setRecent] = useState<Array<{ kind: DocKind; name: string; url: string; file?: File }>>([]);

  const handleSaved = useCallback(
    async (kind: DocKind, file: File) => {
      try {
        if (onSave) await onSave(kind, file);
        // Blob URL for quick preview/download/share
        const url = URL.createObjectURL(file);
        setRecent((r) => [{ kind, name: file.name, url, file }, ...r].slice(0, 10));
        toast.success("Document saved", { description: `${file.name} (${Math.round(file.size / 1024)} KB)` });
      } catch (e: any) {
        console.error(e);
        toast.error("Save failed", { description: e?.message ?? "Unknown error" });
      }
    },
    [onSave]
  );

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">Documents</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Upload images/PDFs or scan documents to PDF. Accepted: JPG/PNG/PDF (max 10MB)</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="country" className="text-xs text-muted-foreground">Country</Label>
          <Select value={country} onValueChange={(v: string) => setCountry(v)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="MX">Mexico</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="BR">Brazil</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="IN">India</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
  <Tabs value={active} onValueChange={(v: string) => setActive(v as DocKind)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lab">Lab results</TabsTrigger>
            <TabsTrigger value="official_id">Official ID</TabsTrigger>
            <TabsTrigger value="insurance_id">{insLabel}</TabsTrigger>
          </TabsList>

          <TabsContent value="lab"><DocSection kind="lab" onSaved={handleSaved} allowMulti /></TabsContent>
          <TabsContent value="official_id"><DocSection kind="official_id" onSaved={handleSaved} /></TabsContent>
          <TabsContent value="insurance_id"><DocSection kind="insurance_id" onSaved={handleSaved} /></TabsContent>
        </Tabs>

        {(existing || recent.length > 0) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Recent / Existing</h3>
            <ScrollArea className="h-[180px] rounded-md border p-2">
              <div className="flex flex-col gap-2">

                {/* Recent (in this session; we have File handles) */}
                {recent.map((d, i) => (
                  <div key={`r-${i}`} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{labelForKind(d.kind)} — {d.name}</div>
                        <button 
                          onClick={() => openDocument(d.url, d.name)}
                          className="text-xs text-muted-foreground underline inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </button>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => downloadBlobOrUrl(d.file ?? d.url, d.name)}>
                        <Download className="w-4 h-4 mr-1" />Download
                      </Button>
                      <Button size="sm" onClick={() => shareDocument(d)}>
                        <Share2 className="w-4 h-4 mr-1" />Share
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRecent((r) => r.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Existing (from backend/props; usually only URL) */}
                {Object.entries(existing ?? {}).flatMap(([k, list]) =>
                  (list ?? []).map((d, i) => (
                    <div key={`e-${k}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{labelForKind(k as DocKind)} — {d.name}</div>
                        <button 
                          onClick={() => openDocument(d.url, d.name)}
                          className="text-xs text-muted-foreground underline inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </button>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={async () => {
                          const blob = await fetchBlob(d.url);
                          downloadBlobOrUrl(blob ?? d.url, d.name);
                        }}>
                          <Download className="w-4 h-4 mr-1" />Download
                        </Button>
                        <Button size="sm" onClick={() => shareDocument({ kind: k as DocKind, name: d.name, url: d.url })}>
                          <Share2 className="w-4 h-4 mr-1" />Share
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!onDelete}
                          onClick={async () => {
                            try {
                              if (onDelete) await onDelete(k as DocKind, d);
                            } catch {
                              toast.error("Delete failed");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}

              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function labelForKind(k: DocKind) {
  switch (k) {
    case "lab": return "Lab results";
    case "official_id": return "Official ID";
    case "insurance_id": return "Insurance ID";
  }
}

function DocSection({ kind, onSaved, allowMulti = false }: { kind: DocKind; onSaved: (k: DocKind, f: File) => void | Promise<void>; allowMulti?: boolean }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = useCallback((file: File) => {
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_PDF_TYPES.includes(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;
    
    if (!isValidType) {
      toast.error("Unsupported file type", { description: `${file.name} (${file.type}). Accepted: JPG, PNG, PDF` });
      return false;
    }
    if (!isValidSize) {
      toast.error("File too large", { description: `${file.name} (${Math.round(file.size / 1024 / 1024)}MB). Max size: 10MB` });
      return false;
    }
    return true;
  }, []);

  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      if (!validateFile(f)) continue;
      await onSaved(kind, f);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onSaved, kind, validateFile]);

  const onPdfUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      if (!validateFile(f)) continue;
      await onSaved(kind, f);
    }
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }, [onSaved, kind, validateFile]);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Image Upload box */}
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-2"><FileUp className="w-4 h-4"/><span className="font-medium">Upload Images</span></div>
          <p className="text-xs text-muted-foreground mb-3">Choose JPG/PNG photos. {allowMulti ? 'Select multiple files.' : 'Single file only.'}</p>
          <Input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            capture="environment"
            multiple={allowMulti}
            onChange={onUpload}
          />
        </div>

        {/* PDF Upload box */}
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-2"><FileUp className="w-4 h-4"/><span className="font-medium">Upload PDF</span></div>
          <p className="text-xs text-muted-foreground mb-3">Choose existing PDF documents. Max 10MB per file.</p>
          <Input
            ref={pdfInputRef}
            type="file"
            accept={ALLOWED_PDF_TYPES.join(",")}
            multiple={allowMulti}
            onChange={onPdfUpload}
          />
        </div>

        {/* Scan box */}
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-2"><ScanLine className="w-4 h-4"/><span className="font-medium">Scan → PDF</span></div>
          <p className="text-xs text-muted-foreground mb-3">Use camera to capture pages and create PDF.</p>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setScannerOpen(true)}><Camera className="w-4 h-4 mr-2"/>Open scanner</Button>
          </div>
        </div>
      </div>

      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onExport={async (pdfFile) => { await onSaved(kind, pdfFile); }}
        allowMulti={allowMulti}
      />
    </div>
  );
}

// --- Scanner Dialog ---
function ScannerDialog({ open, onOpenChange, onExport, allowMulti }: { open: boolean; onOpenChange: (v: boolean) => void; onExport: (file: File) => void | Promise<void>; allowMulti: boolean; }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pages, setPages] = useState<string[]>([]); // data URLs
  const [enhance, setEnhance] = useState(true);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (e: any) {
      toast.error("Camera error", { description: e?.message ?? "Could not access camera" });
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
      setPages([]);
    }
    return () => stop();
  }, [open, start, stop]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    if (enhance) {
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      const contrast = 1.25; // 25% boost
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let y = 0.299 * r + 0.587 * g + 0.114 * b; // grayscale luminance
        y = contrast * y + intercept;              // simple contrast boost
        const v = Math.max(0, Math.min(255, y));
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      ctx.putImageData(img, 0, 0);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPages((p) => (allowMulti ? [dataUrl, ...p] : [dataUrl]));
  }, [enhance, allowMulti]);

  const removePage = (idx: number) => setPages((p) => p.filter((_, i) => i !== idx));

  const exportPdf = useCallback(async () => {
    if (!pages.length) return toast.error("Nothing to export");
    const pdf = await PDFDocument.create();

    for (const dataUrl of [...pages].reverse()) {
      const bytes = dataURLtoBytes(dataUrl);
  const img = await pdf.embedJpg(bytes);
  // pdf-lib versions expose image size either as a method or properties
  const size = typeof (img as any).size === 'function' ? (img as any).size() : ((img as any).size ?? { width: (img as any).width, height: (img as any).height });
  const { width, height } = size as { width: number; height: number };

      const A4 = { w: 595.28, h: 841.89 };
      const margin = 36; // 0.5in
      const maxW = A4.w - margin * 2;
      const maxH = A4.h - margin * 2;
      const scale = Math.min(maxW / width, maxH / height);
      const page = pdf.addPage([A4.w, A4.h]);
      const drawW = width * scale;
      const drawH = height * scale;
      const x = (A4.w - drawW) / 2;
      const y = (A4.h - drawH) / 2;
      page.drawImage(img, { x, y, width: drawW, height: drawH });

      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const idx = pdf.getPageCount();
      page.drawText(`${idx}`, { x: A4.w - margin - 10, y: margin - 18, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    }

  const bytes = await pdf.save();
  const bytesArr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as any);
  const blob = new Blob([bytesArr.buffer], { type: "application/pdf" });
  const file = new File([blob], `scan_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`, { type: "application/pdf" });
    await onExport(file);
    toast.success("PDF exported");
    onOpenChange(false);
  }, [pages, onExport, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanLine className="w-5 h-5"/> Scanner</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live camera */}
          <div className="col-span-2">
            <div className="aspect-video w-full bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {!isStreaming ? (
                <Button onClick={start} variant="secondary"><Play className="w-4 h-4 mr-2"/>Start camera</Button>
              ) : (
                <>
                  <Button onClick={capture}><Camera className="w-4 h-4 mr-2"/>Capture</Button>
                  <Button onClick={stop} variant="ghost"><StopCircle className="w-4 h-4 mr-2"/>Stop</Button>
                </>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" className="accent-primary" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
                Enhance (B/W + contrast)
              </label>
            </div>
          </div>

          {/* Pages */}
          <div className="col-span-1">
            <h4 className="text-sm font-medium mb-2">Pages ({pages.length})</h4>
            <ScrollArea className="h-[300px] rounded-md border p-2">
              <div className="grid grid-cols-2 gap-2">
                {pages.map((p, i) => (
                  <div key={i} className="relative group">
                    <img src={p} className="w-full aspect-[3/4] object-cover rounded-lg border" />
                    <button className="absolute top-1 right-1 p-1 bg-white/70 rounded-full opacity-0 group-hover:opacity-100 transition" onClick={() => removePage(i)} title="Remove">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-3">
              <Button onClick={exportPdf} disabled={!pages.length} className="flex-1"><Download className="w-4 h-4 mr-2"/>Export PDF</Button>
              <Button variant="outline" onClick={() => setPages([])} disabled={!pages.length}><X className="w-4 h-4 mr-2"/>Clear</Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-muted-foreground">Tip: On mobile Safari/Chrome, the Upload input also offers Camera. This scanner adds multi-page + enhancement + PDF.</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}><X className="w-4 h-4 mr-2"/>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- utils ---
function dataURLtoBytes(dataUrl: string): Uint8Array {
  const [_, body] = dataUrl.split(",");
  const bstr = atob(body);
  const n = bstr.length;
  const u8 = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
  return u8;
}

function downloadBlobOrUrl(input: Blob | File | string, name: string) {
  const a = document.createElement("a");
  if (typeof input === "string") {
    a.href = input;
  } else {
    const url = URL.createObjectURL(input);
    a.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function fetchBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

async function openDocument(url: string, name: string) {
  try {
    // Determine file type from name extension
    const fileExtension = name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension || '');
    const isPdf = fileExtension === 'pdf';
    const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension || '');
    
    // For blob URLs (recent files), handle appropriately
    if (url.startsWith('blob:')) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        if (isPdf) {
          // For PDFs, use a direct blob URL approach that won't trigger AR
          const blobUrl = URL.createObjectURL(blob);
          const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
          if (!newWindow) {
            toast.error("Popup blocked", { description: "Please allow popups for this site to view documents" });
          }
          // Clean up after 30 seconds
          setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        } else if (isImage) {
          // Open images directly
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          if (!newWindow) {
            toast.error("Popup blocked", { description: "Please allow popups for this site to view documents" });
          }
        } else if (isDocument) {
          // For Office documents, download instead of trying to open
          downloadBlobOrUrl(blob, name);
          toast.success("Document downloaded", { description: "Office documents are downloaded for local viewing" });
        } else {
          // Download other file types
          downloadBlobOrUrl(blob, name);
          toast.success("Document downloaded", { description: "File saved to downloads folder" });
        }
        return;
      } catch (error) {
        console.error("Error processing blob URL:", error);
        toast.error("Failed to open document", { description: "Please try downloading the file instead" });
        return;
      }
    }
    
    // For external URLs, handle based on file type
    if (isPdf) {
      // Try multiple PDF viewer approaches
      const viewers = [
        `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
        `https://drive.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
        url // Fallback to direct URL
      ];
      
      let opened = false;
      for (const viewerUrl of viewers) {
        try {
          const newWindow = window.open(viewerUrl, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            opened = true;
            break;
          }
        } catch (e) {
          console.warn("Failed to open with viewer:", viewerUrl);
        }
      }
      
      if (!opened) {
        toast.error("Cannot open PDF", { description: "Please use the Download button instead" });
      }
      return;
    }
    
    if (isDocument) {
      // For Office documents, download instead of opening
      toast.info("Office document detected", { description: "Please use the Download button to save and open with your preferred app" });
      return;
    }
    
    if (isImage) {
      // Open images directly
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        toast.error("Popup blocked", { description: "Please allow popups for this site to view documents" });
      }
      return;
    }
    
    // For other file types, download
    toast.info("File type not supported for viewing", { description: "Please use the Download button instead" });
  } catch (error) {
    console.error("Error opening document:", error);
    toast.error("Failed to open document", { description: "Please try downloading the file instead" });
  }
}


async function shareDocument(d: { name: string; url: string; file?: File; kind?: DocKind }) {
  // Prefer native share with a File (Android Chrome, iOS Safari ≥ 15)
  if (d.file && navigator.canShare && navigator.canShare({ files: [d.file] })) {
    try {
      await navigator.share({ files: [d.file], title: d.name, text: `${d.name}` });
      return;
    } catch { /* fall through */ }
  }
  // Next: native share with URL
  if (navigator.share && d.url) {
    try {
      await navigator.share({ url: d.url, title: d.name });
      return;
    } catch { /* fall through */ }
  }
  // Fallback: copy link + open mail draft
  try { if (d.url && navigator.clipboard) await navigator.clipboard.writeText(d.url); } catch {}
  const subject = encodeURIComponent(`Sharing document: ${d.name}`);
  const body = d.url ? encodeURIComponent(`Here is the document:\n${d.url}`) : "";
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
