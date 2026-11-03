import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
// Copied from components/DocumentsCard.tsx — placed under src for alias @/* resolution
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

const COUNTRY_INSURANCE_LABEL: Record<string, string> = {
  get MX() { return uiI18n.t("ui.imssSeguroCredencial"); },
  get US() { return uiI18n.t("ui.insuranceMedicareCard"); },
  get CA() { return uiI18n.t("ui.provincialHealthCard"); },
  get BR() { return uiI18n.t("ui.susCard"); },
  get UK() { return uiI18n.t("ui.nhsNumberCard"); },
  get IN() { return uiI18n.t("ui.ayushmanInsuranceCard"); },
};

function insuranceLabel(country?: string) {
  if (!country) return uiI18n.t("ui.insuranceId");
  return COUNTRY_INSURANCE_LABEL[country] ?? uiI18n.t("ui.insuranceId");
}

type DocKind = "lab" | "official_id" | "insurance_id";

type Props = {
  defaultCountry?: string; // e.g., "MX", "US"
  onSave?: (kind: DocKind, file: File) => Promise<void> | void; // PDF or image file
  onDelete?: (kind: DocKind, doc: { name: string; url: string }) => Promise<void> | void; // optional backend delete
  existing?: Partial<Record<DocKind, Array<{ name: string; url: string }>>>; // pre-existing docs to show
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

export default function DocumentsCard({ defaultCountry = "MX", onSave, onDelete, existing }: Props) {
  useUILanguage();
  const [country, setCountry] = useState(defaultCountry);
  const [active, setActive] = useState<DocKind>("lab");
  const insLabel = useMemo(() => insuranceLabel(country), [country, uiI18n.resolvedLanguage]);

  const [recent, setRecent] = useState<Array<{ kind: DocKind; name: string; url: string; file?: File }>>([]);

  const handleSaved = useCallback(
    async (kind: DocKind, file: File) => {
      try {
        if (onSave) await onSave(kind, file);
        const url = URL.createObjectURL(file);
        setRecent((r) => [{ kind, name: file.name, url, file }, ...r].slice(0, 10));
        toast.success(uiI18n.t("ui.documentSaved"), { description: `${file.name} (${Math.round(file.size / 1024)} KB)` });
      } catch (e: any) {
        console.error(e);
        toast.error(uiI18n.t("ui.saveFailed"), { description: e?.message ?? uiI18n.t("ui.unknownError") });
      }
    },
    [onSave]
  );

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">{uiI18n.t("tiles.documents")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{uiI18n.t("ui.uploadOrScanToPdfAcceptedJpgPngPdf")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="country" className="text-xs text-muted-foreground">{uiI18n.t("ui.country")}</Label>
          <Select value={country} onValueChange={(v: string) => setCountry(v)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder={uiI18n.t("ui.country")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="MX">{uiI18n.t("ui.mexico")}</SelectItem>
                <SelectItem value="US">{uiI18n.t("ui.unitedStates")}</SelectItem>
                <SelectItem value="CA">{uiI18n.t("ui.canada")}</SelectItem>
                <SelectItem value="BR">{uiI18n.t("ui.brazil")}</SelectItem>
                <SelectItem value="UK">{uiI18n.t("ui.unitedKingdom")}</SelectItem>
                <SelectItem value="IN">{uiI18n.t("ui.india")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={active} onValueChange={(v: string) => setActive(v as DocKind)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lab">{uiI18n.t("medicalDocuments.labResults")}</TabsTrigger>
          </TabsList>

          <TabsContent value="lab"><DocSection kind="lab" onSaved={handleSaved} allowMulti /></TabsContent>
        </Tabs>

        {(existing || recent.length > 0) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">{uiI18n.t("ui.recentExisting")}</h3>
            <ScrollArea className="h-[180px] rounded-md border p-2">
              <div className="flex flex-col gap-2">

                {recent.map((d, i) => (
                  <div key={`r-${i}`} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{labelForKind(d.kind)} — {d.name}</div>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline inline-flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />{uiI18n.t("ui.open")}</a>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => downloadBlobOrUrl(d.file ?? d.url, d.name)}>
                        <Download className="w-4 h-4 mr-1" />{uiI18n.t("ui.download")}</Button>
                      <Button size="sm" onClick={() => shareDocument(d)}>
                        <Share2 className="w-4 h-4 mr-1" />{uiI18n.t("medicalDocuments.share")}</Button>
                      <Button size="sm" variant="destructive" onClick={() => setRecent((r) => r.filter((_, idx) => idx !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {Object.entries(existing ?? {}).flatMap(([k, list]) =>
                  (list ?? []).map((d, i) => (
                    <div key={`e-${k}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{labelForKind(k as DocKind)} — {d.name}</div>
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />{uiI18n.t("ui.open")}</a>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={async () => {
                          const blob = await fetchBlob(d.url);
                          downloadBlobOrUrl(blob ?? d.url, d.name);
                        }}>
                          <Download className="w-4 h-4 mr-1" />{uiI18n.t("ui.download")}</Button>
                        <Button size="sm" onClick={() => shareDocument({ kind: k as DocKind, name: d.name, url: d.url })}>
                          <Share2 className="w-4 h-4 mr-1" />{uiI18n.t("medicalDocuments.share")}</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!onDelete}
                          onClick={async () => {
                            try {
                              if (onDelete) await onDelete(k as DocKind, d);
                            } catch {
                              toast.error(uiI18n.t("ui.deleteFailed"));
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
    case "lab": return uiI18n.t("medicalDocuments.labResults");
    case "official_id": return uiI18n.t("ui.officialId");
    case "insurance_id": return uiI18n.t("ui.insuranceId");
  }
}

function DocSection({ kind, onSaved, allowMulti = false }: { kind: DocKind; onSaved: (k: DocKind, f: File) => void | Promise<void>; allowMulti?: boolean }) {
  useUILanguage();
  const [scannerOpen, setScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type) && f.type !== "application/pdf") {
        toast.error(uiI18n.t("ui.unsupportedFile"), { description: `${f.name} (${f.type})` });
        continue;
      }
      await onSaved(kind, f);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onSaved, kind]);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-2"><FileUp className="w-4 h-4"/><span className="font-medium">{uiI18n.t("ui.upload_fa0d2f")}{labelForKind(kind)}</span></div>
          <p className="text-xs text-muted-foreground mb-3">{uiI18n.t("ui.chooseJpgPngOrAnExistingPdfForPhotosYouCanSelectMultiple")}</p>
          <Input
            ref={fileInputRef}
            type="file"
            accept={[...ALLOWED_IMAGE_TYPES, "application/pdf"].join(",")}
            capture="environment"
            multiple={allowMulti}
            onChange={onUpload}
          />
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-2"><ScanLine className="w-4 h-4"/><span className="font-medium">{uiI18n.t("ui.scanWithCameraPdf")}</span></div>
          <p className="text-xs text-muted-foreground mb-3">{uiI18n.t("ui.useYourDeviceCameraToCaptureOneOrMorePagesAndExportToASinglePdf")}</p>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setScannerOpen(true)}><Camera className="w-4 h-4 mr-2"/>{uiI18n.t("ui.openScanner")}</Button>
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

function ScannerDialog({ open, onOpenChange, onExport, allowMulti }: { open: boolean; onOpenChange: (v: boolean) => void; onExport: (file: File) => void | Promise<void>; allowMulti: boolean; }) {
  useUILanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
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
      toast.error(uiI18n.t("ui.cameraError"), { description: e?.message ?? uiI18n.t("ui.couldNotAccessCamera") });
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
      const contrast = 1.25;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let y = 0.299 * r + 0.587 * g + 0.114 * b;
        y = contrast * y + intercept;
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
    if (!pages.length) return toast.error(uiI18n.t("ui.nothingToExport"));
    const pdf = await PDFDocument.create();

    for (const dataUrl of [...pages].reverse()) {
      const bytes = dataURLtoBytes(dataUrl);
      const img = await pdf.embedJpg(bytes);
      const size = typeof (img as any).size === 'function' ? (img as any).size() : ((img as any).size ?? { width: (img as any).width, height: (img as any).height });
      const { width, height } = size as { width: number; height: number };

      const A4 = { w: 595.28, h: 841.89 };
      const margin = 36;
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
    toast.success(uiI18n.t("ui.pdfExported"));
    onOpenChange(false);
  }, [pages, onExport, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanLine className="w-5 h-5"/>{uiI18n.t("ui.scanner")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="aspect-video w-full bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {!isStreaming ? (
                <Button onClick={start} variant="secondary"><Play className="w-4 h-4 mr-2"/>{uiI18n.t("ui.startCamera")}</Button>
              ) : (
                <>
                  <Button onClick={capture}><Camera className="w-4 h-4 mr-2"/>{uiI18n.t("ui.capture")}</Button>
                  <Button onClick={stop} variant="ghost"><StopCircle className="w-4 h-4 mr-2"/>{uiI18n.t("appointments.stop")}</Button>
                </>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" className="accent-primary" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />{uiI18n.t("ui.enhanceBWContrast")}</label>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="text-sm font-medium mb-2">{uiI18n.t("ui.pages")}{pages.length})</h4>
            <ScrollArea className="h-[300px] rounded-md border p-2">
              <div className="grid grid-cols-2 gap-2">
                {pages.map((p, i) => (
                  <div key={i} className="relative group">
                    <img src={p} className="w-full aspect-[3/4] object-cover rounded-lg border" />
                    <button className="absolute top-1 right-1 p-1 bg-white/70 rounded-full opacity-0 group-hover:opacity-100 transition" onClick={() => removePage(i)} title={uiI18n.t("healthProfile.removeHealthCondition")}>
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-3">
              <Button onClick={exportPdf} disabled={!pages.length} className="flex-1"><Download className="w-4 h-4 mr-2"/>{uiI18n.t("documents.exportPDF")}</Button>
              <Button variant="outline" onClick={() => setPages([])} disabled={!pages.length}><X className="w-4 h-4 mr-2"/>{uiI18n.t("medicalDocuments.clear")}</Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="text-xs text-muted-foreground">{uiI18n.t("ui.tipOnMobileSafariChromeTheUploadInputAlsoOffersCameraThisScannerAddsMultiPageEnhancementPd")}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}><X className="w-4 h-4 mr-2"/>{uiI18n.t("ai.close")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

async function shareDocument(d: { name: string; url: string; file?: File; kind?: DocKind }) {
  if (d.file && navigator.canShare && navigator.canShare({ files: [d.file] })) {
    try {
      await navigator.share({ files: [d.file], title: d.name, text: `${d.name}` });
      return;
    } catch { }
  }
  if (navigator.share && d.url) {
    try {
      await navigator.share({ url: d.url, title: d.name });
      return;
    } catch { }
  }
  try { if (d.url && navigator.clipboard) await navigator.clipboard.writeText(d.url); } catch {}
  const subject = encodeURIComponent(uiI18n.t("ui.sharingDocumentValue", { value1: d.name }));
  const body = d.url ? encodeURIComponent(uiI18n.t("ui.hereIsTheDocumentValue", { value1: d.url })) : "";
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
