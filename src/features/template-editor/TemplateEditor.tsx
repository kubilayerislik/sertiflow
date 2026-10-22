'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Rnd } from 'react-rnd';
import * as pdfjs from 'pdfjs-dist';
import type { EditorField } from './TemplateTab';
import { FilePicker } from '@/components/FilePicker';
import { Spinner } from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PALETTE = [
  'FULL_NAME',
  'FIRST_NAME',
  'LAST_NAME',
  'STUDENT_NO',
  'CERTIFICATE_NO',
  'COURSE_NAME',
  'CERTIFICATE_DATE',
  'COURSE_START',
  'COURSE_END',
  'VERIFICATION_CODE',
  'QR_CODE',
  'SIGNATURE',
  'STATIC_TEXT',
].map((type) => ({
  type,
  label:
    type === 'SIGNATURE'
      ? 'Yetkili imza'
      : type === 'STATIC_TEXT'
        ? 'Sabit metin'
        : type.replace(/_/g, ' '),
}));

const DATE_TYPES = new Set(['CERTIFICATE_DATE', 'COURSE_START', 'COURSE_END']);
const IMAGE_FIELD_TYPES = new Set(['QR_CODE', 'SIGNATURE']);

const DEFAULT_FIELD: EditorField = {
  fieldType: 'FULL_NAME',
  x: 0.1,
  y: 0.4,
  width: 0.35,
  height: 0.06,
  fontKey: 'NotoSans-Regular',
  fontSize: 24,
  minFontSize: 10,
  color: '#000000',
  align: 'center',
  uppercase: false,
};

const SAMPLE: Record<string, string> = {
  FULL_NAME: 'İsim Soyisim',
  FIRST_NAME: 'İsim',
  LAST_NAME: 'Soyisim',
  STUDENT_NO: '20240001',
  CERTIFICATE_NO: 'PYT-0001',
  COURSE_NAME: 'Örnek Kurs',
  CERTIFICATE_DATE: '21.10.2026',
  COURSE_START: '01.10.2026',
  COURSE_END: '21.10.2026',
  VERIFICATION_CODE: 'K7M2-QX9P-4TRA',
  QR_CODE: 'QR',
  SIGNATURE: '',
  STATIC_TEXT: 'Sabit metin',
};

function roundPx(n: number) {
  return Math.round(n * 10) / 10;
}

function PxNumberInput({
  label,
  valuePx,
  onCommit,
  inputKey,
}: {
  label: string;
  valuePx: number;
  onCommit: (px: number | null) => void;
  inputKey: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
  }, [inputKey]);

  const commit = () => {
    const raw = (draft ?? String(roundPx(valuePx))).trim();
    setDraft(null);
    if (raw === '') {
      onCommit(null);
      return;
    }
    const normalized = raw.replace(',', '.');
    const n = Number(normalized);
    if (!Number.isFinite(n)) return;
    onCommit(n);
  };

  return (
    <div className="w-full">
      <Label className="mb-1 block text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="text"
        inputMode="decimal"
        value={draft ?? String(roundPx(valuePx))}
        onFocus={() => setDraft(String(roundPx(valuePx)))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

function IntFieldInput({
  label,
  value,
  onCommit,
  inputKey,
  min,
  max,
}: {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  inputKey: string;
  min: number;
  max: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
  }, [inputKey]);

  const commit = () => {
    const raw = (draft ?? String(value)).trim();
    setDraft(null);
    if (raw === '') return;
    const normalized = raw.replace(',', '.');
    const n = Math.round(Number(normalized));
    if (!Number.isFinite(n)) return;
    onCommit(Math.min(max, Math.max(min, n)));
  };

  return (
    <div className="w-full">
      <Label className="mb-1 block text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

async function loadTemplatePdf(courseId: string) {
  const res = await fetch(`/api/courses/${courseId}/template/file`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(res.status === 401 ? 'Oturum gerekli' : text || `PDF alınamadı (${res.status})`);
  }
  const data = new Uint8Array(await res.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  return { page, viewport };
}

export type TemplateEditorHandle = {
  save: () => Promise<void>;
};

export const TemplateEditor = forwardRef<
  TemplateEditorHandle,
  {
    courseId: string;
    pageWidth: number;
    pageHeight: number;
    initialFields: EditorField[];
    onSave: (fields: EditorField[]) => Promise<void>;
    hasSignature?: boolean;
    signatureImageUrl?: string | null;
    onUploadSignature?: (file: File) => Promise<void>;
  }
>(function TemplateEditor(
  {
    courseId,
    pageWidth,
    pageHeight,
    initialFields,
    onSave,
    hasSignature = false,
    signatureImageUrl = null,
    onUploadSignature,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [pdfPage, setPdfPage] = useState<pdfjs.PDFPageProxy | null>(null);
  const [pdfBaseSize, setPdfBaseSize] = useState({ w: 0, h: 0 });
  const [size, setSize] = useState({ w: 400, h: 283 });
  const [fields, setFields] = useState<EditorField[]>(initialFields.length ? initialFields : []);
  const [selected, setSelected] = useState<number | null>(
    initialFields.length ? 0 : null,
  );
  const [longName, setLongName] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageRender, setPageRender] = useState<{
    page: pdfjs.PDFPageProxy;
    viewport: pdfjs.PageViewport;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    save: async () => {
      await onSave(fields);
    },
  }));

  useEffect(() => {
    setFields(initialFields.length ? initialFields : []);
    setSelected(initialFields.length ? 0 : null);
  }, [initialFields]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPdf(true);
    setPdfError(null);
    setPdfPage(null);
    setPageRender(null);
    loadTemplatePdf(courseId)
      .then(({ page, viewport }) => {
        if (cancelled) return;
        setPdfPage(page);
        setPdfBaseSize({ w: viewport.width, h: viewport.height });
      })
      .catch((e: Error) => {
        if (!cancelled) setPdfError(e.message || 'Şablon PDF yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoadingPdf(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, pageWidth, pageHeight]);

  const setDisplayWidth = useCallback(
    (displayW: number) => {
      if (!pdfPage || pdfBaseSize.w <= 0 || pageWidth <= 0 || pageHeight <= 0) return;
      const targetW = Math.max(120, Math.floor(displayW));
      const pdfScale = targetW / pdfBaseSize.w;
      const scaledVp = pdfPage.getViewport({ scale: pdfScale });
      const w = Math.round(scaledVp.width);
      const h = Math.round((pageHeight / pageWidth) * w);
      setSize({ w, h });
      setPageRender({ page: pdfPage, viewport: scaledVp });
    },
    [pdfPage, pdfBaseSize.w, pageWidth, pageHeight],
  );

  useLayoutEffect(() => {
    const el = centerRef.current;
    if (!el || !pdfPage) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setDisplayWidth(w);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfPage, setDisplayWidth]);

  useLayoutEffect(() => {
    if (!pageRender || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = pageRender.viewport.width;
    canvas.height = pageRender.viewport.height;
    const task = pageRender.page.render({ canvasContext: ctx, viewport: pageRender.viewport });
    return () => {
      task.cancel();
    };
  }, [pageRender]);

  const addField = (type: string) => {
    setFields((f) => {
      const next = [
        ...f,
        {
          ...DEFAULT_FIELD,
          fieldType: type,
          ...(type === 'SIGNATURE' ? { width: 0.22, height: 0.08 } : {}),
          ...(DATE_TYPES.has(type) ? { dateFormat: 'DD.MM.YYYY' as const } : {}),
        },
      ];
      setSelected(next.length - 1);
      return next;
    });
  };

  const removeSelected = () => {
    if (selected === null) return;
    setFields((list) => {
      const next = list.filter((_, i) => i !== selected);
      setSelected(next.length ? Math.min(selected, next.length - 1) : null);
      return next;
    });
  };

  const clampBounds = (f: EditorField): EditorField => {
    const width = Math.min(Math.max(f.width, 0.005), 1);
    const height = Math.min(Math.max(f.height, 0.005), 1);
    const x = Math.min(Math.max(f.x, 0), Math.max(0, 1 - width));
    const y = Math.min(Math.max(f.y, 0), Math.max(0, 1 - height));
    return { ...f, x, y, width, height };
  };

  const updateSelected = (patch: Partial<EditorField>) => {
    if (selected === null) return;
    setFields((list) =>
      list.map((f, i) => {
        if (i !== selected) return f;
        let next = { ...f, ...patch };
        if (patch.fontSize != null && Number.isFinite(patch.fontSize)) {
          next.minFontSize = Math.min(next.minFontSize, next.fontSize);
        }
        if (patch.minFontSize != null && Number.isFinite(patch.minFontSize)) {
          next.minFontSize = Math.min(next.minFontSize, next.fontSize);
        }
        return clampBounds(next);
      }),
    );
  };

  const setAxisPx = (
    axis: 'x' | 'y' | 'width' | 'height',
    px: number | null,
  ) => {
    if (px == null || !Number.isFinite(px) || px < 0) return;
    if (axis === 'width' || axis === 'height') {
      if (px <= 0) return;
      const canvasLen = axis === 'width' ? size.w : size.h;
      updateSelected({ [axis]: Math.min(px / canvasLen, 1) });
      return;
    }
    const canvasLen = axis === 'x' ? size.w : size.h;
    const max = axis === 'x' ? size.w : size.h;
    const clamped = Math.min(Math.max(px, 0), max);
    updateSelected({ [axis]: clamped / canvasLen });
  };

  const labelFor = (f: EditorField) => {
    if (f.fieldType === 'FULL_NAME' && longName) return 'Uzun İsim Soyisim Örneği';
    if (f.fieldType === 'STATIC_TEXT') return f.staticText ?? SAMPLE.STATIC_TEXT;
    return SAMPLE[f.fieldType] ?? f.fieldType;
  };

  const scaledFontSize = (f: EditorField) => {
    const baseH = pdfBaseSize.h > 0 ? pdfBaseSize.h : pageHeight;
    return Math.max(8, (f.fontSize / baseH) * size.h);
  };

  const current = selected !== null ? fields[selected] : undefined;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        width: '100%',
        maxWidth: '100%',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: '0 0 172px', width: 172, flexShrink: 0 }}>
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Alan ekle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-3">
          <ul className="space-y-1">
            {PALETTE.map((item) => (
              <li key={item.type}>
                <Button type="button" size="sm" className="w-full" onClick={() => addField(item.type)}>
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Eklenen alan: {fields.length}</p>
        </CardContent>
      </Card>
      </div>
      <div
        ref={centerRef}
        style={{ flex: '1 1 0', minWidth: 0, maxWidth: '100%' }}
      >
      <div
        className="relative border border-[#ddd] box-content"
        style={{ width: size.w, height: size.h }}
      >
        {loadingPdf && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fafafa',
              zIndex: 2,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Spinner />
              <span className="text-sm text-muted-foreground">PDF yükleniyor...</span>
            </div>
          </div>
        )}
        {pdfError && (
          <Alert variant="destructive" className="m-2">
            <AlertTitle>Şablon görüntülenemedi</AlertTitle>
            <AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        )}
        <canvas
          ref={canvasRef}
          className="absolute left-0 top-0 z-0"
          style={{ width: size.w, height: size.h }}
        />
        {!loadingPdf && !pdfError &&
          fields.map((f, i) => (
            <Rnd
              key={`${f.fieldType}-${i}`}
              size={{ width: f.width * size.w, height: f.height * size.h }}
              position={{ x: f.x * size.w, y: f.y * size.h }}
              bounds="parent"
              onDragStop={(_, d) =>
                setFields((list) =>
                  list.map((item, idx) =>
                    idx === i ? { ...item, x: d.x / size.w, y: d.y / size.h } : item,
                  ),
                )
              }
              onResizeStop={(_, __, refEl, ___, pos) =>
                setFields((list) =>
                  list.map((item, idx) =>
                    idx === i
                      ? {
                          ...item,
                          x: pos.x / size.w,
                          y: pos.y / size.h,
                          width: refEl.offsetWidth / size.w,
                          height: refEl.offsetHeight / size.h,
                        }
                      : item,
                  ),
                )
              }
              style={{
                boxSizing: 'border-box',
                outline: i === selected ? '2px solid #1677ff' : '1px dashed #999',
                outlineOffset: 0,
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  f.align === 'left'
                    ? 'flex-start'
                    : f.align === 'right'
                      ? 'flex-end'
                      : 'center',
                padding: IMAGE_FIELD_TYPES.has(f.fieldType) ? 0 : '0 2px',
                fontSize: scaledFontSize(f),
                lineHeight: 1.2,
                textAlign: f.align as 'left' | 'center' | 'right',
                cursor: 'move',
                zIndex: 1,
                overflow: 'hidden',
              }}
              onMouseDown={() => setSelected(i)}
            >
              {f.fieldType === 'SIGNATURE' && signatureImageUrl ? (
                <img
                  src={signatureImageUrl}
                  alt="İmza"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                />
              ) : f.fieldType === 'SIGNATURE' ? (
                <span className="pointer-events-none text-[11px] text-muted-foreground">
                  İmza yükle
                </span>
              ) : (
                labelFor(f)
              )}
            </Rnd>
          ))}
      </div>
      </div>
      <div
        style={{
          flex: '0 0 248px',
          width: 248,
          flexShrink: 0,
          minWidth: 0,
          maxHeight: 'calc(100vh - 220px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Seçili alan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
        {!current ? (
          <p className="text-sm text-muted-foreground">
            PDF üzerinde bir alan seçin veya sol panelden yeni alan ekleyin.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <p className="font-medium">{current.fieldType.replace(/_/g, ' ')}</p>
            <Select value={current.align} onValueChange={(v) => updateSelected({ align: v ?? 'center' })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Konum ve boyut (önizleme pikseli, tuval {size.w}×{Math.round(size.h)} px)
            </p>
            <PxNumberInput
              inputKey={`${selected}-x`}
              label="X (px)"
              valuePx={current.x * size.w}
              onCommit={(v) => setAxisPx('x', v)}
            />
            <PxNumberInput
              inputKey={`${selected}-y`}
              label="Y (px)"
              valuePx={current.y * size.h}
              onCommit={(v) => setAxisPx('y', v)}
            />
            <PxNumberInput
              inputKey={`${selected}-w`}
              label="Yatay (px)"
              valuePx={current.width * size.w}
              onCommit={(v) => setAxisPx('width', v)}
            />
            <PxNumberInput
              inputKey={`${selected}-h`}
              label="Dikey (px)"
              valuePx={current.height * size.h}
              onCommit={(v) => setAxisPx('height', v)}
            />
            {current.fieldType === 'SIGNATURE' && onUploadSignature && (
              <div className="flex w-full flex-col gap-2">
                {!hasSignature && (
                  <Alert>
                    <AlertTitle>Henüz imza görseli yok</AlertTitle>
                    <AlertDescription>PNG veya JPEG (en fazla 1 MB). Sertifikada bu alana basılır.</AlertDescription>
                  </Alert>
                )}
                <FilePicker
                  accept="image/png,image/jpeg"
                  maxCount={1}
                  onChange={(f) => f instanceof File && onUploadSignature(f)}
                  buttonLabel={hasSignature ? 'İmzayı değiştir' : 'İmza yükle'}
                />
              </div>
            )}
            {current.fieldType === 'STATIC_TEXT' && (
              <div className="w-full">
                <Label className="mb-1 block text-[11px] text-muted-foreground">Sabit metin</Label>
                <Input
                  value={current.staticText ?? ''}
                  onChange={(e) => updateSelected({ staticText: e.target.value })}
                />
              </div>
            )}
            {!IMAGE_FIELD_TYPES.has(current.fieldType) && (
              <>
                <IntFieldInput
                  inputKey={`${selected}-fontSize`}
                  label="Punto"
                  min={6}
                  max={120}
                  value={current.fontSize}
                  onCommit={(n) => updateSelected({ fontSize: n })}
                />
                <IntFieldInput
                  inputKey={`${selected}-minFontSize`}
                  label="Min punto"
                  min={4}
                  max={120}
                  value={current.minFontSize}
                  onCommit={(n) => updateSelected({ minFontSize: n })}
                />
                <p className="text-[11px] text-muted-foreground">
                  PDF metni kutuya sığmazsa punto küçülür; büyük punto için Dikey (px) artırın.
                </p>
              </>
            )}
            {!IMAGE_FIELD_TYPES.has(current.fieldType) && (
              <div className="w-full">
                <Label className="mb-1 block text-[11px] text-muted-foreground">Renk</Label>
                <Input
                  value={current.color}
                  onChange={(e) => updateSelected({ color: e.target.value })}
                />
              </div>
            )}
            {DATE_TYPES.has(current.fieldType) && (
              <Select
                value={current.dateFormat ?? 'DD.MM.YYYY'}
                onValueChange={(v) => updateSelected({ dateFormat: v ?? 'DD.MM.YYYY' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD.MM.YYYY">21.10.2026</SelectItem>
                  <SelectItem value="D MMMM YYYY">21 Ekim 2026</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="long-name"
                checked={longName}
                onCheckedChange={(c) => setLongName(c === true)}
              />
              <Label htmlFor="long-name">Uzun isimle dene</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="uppercase"
                checked={current.uppercase}
                onCheckedChange={(c) => updateSelected({ uppercase: c === true })}
              />
              <Label htmlFor="uppercase">Büyük harf</Label>
            </div>
            <Button type="button" variant="destructive" onClick={removeSelected}>Alanı sil</Button>
          </div>
        )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
});
