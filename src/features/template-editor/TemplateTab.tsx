'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { errorFromResponse, getApiErrorMessage } from '../../api/errors';
import { TemplateEditor, type TemplateEditorHandle } from './TemplateEditor';
import { serializeTemplateFields } from './serializeFields';
import { FilePicker } from '@/components/FilePicker';
import { Spinner } from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function TemplateTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const editorRef = useRef<TemplateEditorHandle>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [signatureVersion, setSignatureVersion] = useState(0);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['template', courseId],
    queryFn: () =>
      api<{
        fields: unknown[];
        pageWidth: number;
        pageHeight: number;
        signatureStorageKey?: string | null;
      }>(`/api/courses/${courseId}/template/fields`),
    retry: false,
  });

  const hasSignature = Boolean(data?.signatureStorageKey);
  const signatureImageUrl = hasSignature
    ? `/api/courses/${courseId}/template/signature?v=${signatureVersion}`
    : null;

  const uploadSignature = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/courses/${courseId}/template/signature`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error(getApiErrorMessage(await errorFromResponse(res)));
      return;
    }
    toast.success('Yetkili imza yüklendi');
    setSignatureVersion((v) => v + 1);
    await refetch();
  };

  const saveFields = async (fields: EditorField[]) => {
    if (!fields.length) {
      toast.warning('Kaydetmek için en az bir alan ekleyin');
      return;
    }
    setSaving(true);
    try {
      await api(`/api/courses/${courseId}/template/fields`, {
        method: 'PUT',
        json: { fields: serializeTemplateFields(fields) },
      });
      toast.success('Alan yerleşimi kaydedildi');
      await refetch();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/template/preview`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(getApiErrorMessage(await errorFromResponse(res)));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const uploadTemplate = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/courses/${courseId}/template`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error((body as { message?: string }).message ?? 'Şablon yüklenemedi');
      return;
    }
    toast.success('Şablon yüklendi');
    await qc.invalidateQueries({ queryKey: ['template', courseId] });
    setEditorKey((k) => k + 1);
  };

  if (isLoading) return <Spinner className="mx-auto my-8" />;

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-4">
        <Alert>
          <AlertTitle>Henüz şablon yok veya yüklenemedi</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message ??
              'Kurs oluştururken PDF yüklemediyseniz veya yükleme başarısız olduysa buradan tekrar yükleyin.'}
          </AlertDescription>
        </Alert>
        <FilePicker
          accept=".pdf"
          maxCount={1}
          onChange={(f) => f instanceof File && uploadTemplate(f)}
          buttonLabel="PDF Şablon Yükle"
        />
      </div>
    );
  }

  const mapFields = (data?.fields ?? []) as Array<Record<string, unknown>>;
  const initialFields: EditorField[] = mapFields.map((f) => ({
    fieldType: String(f.fieldType),
    x: Number(f.x),
    y: Number(f.y),
    width: Number(f.width),
    height: Number(f.height),
    fontKey: String(f.fontKey),
    fontSize: Number(f.fontSize),
    minFontSize: Math.min(Number(f.minFontSize), Number(f.fontSize)),
    color: String(f.color),
    align: String(f.align),
    dateFormat: f.dateFormat ? String(f.dateFormat) : undefined,
    staticText: f.staticText ? String(f.staticText) : undefined,
    uppercase: Boolean(f.uppercase),
  }));

  return (
    <div className="flex w-full max-w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving} onClick={() => editorRef.current?.save()}>
          Yerleşimi Kaydet
        </Button>
        <Button type="button" variant="outline" onClick={preview}>Örnek Sertifika Önizle</Button>
        <FilePicker
          accept=".pdf"
          maxCount={1}
          onChange={(f) => f instanceof File && uploadTemplate(f)}
          buttonLabel="Şablonu Değiştir (PDF)"
        />
        <FilePicker
          accept="image/png,image/jpeg"
          maxCount={1}
          onChange={(f) => f instanceof File && uploadSignature(f)}
          buttonLabel={hasSignature ? 'Yetkili imzayı değiştir' : 'Yetkili imza yükle'}
        />
      </div>
      <Alert>
        <AlertTitle>Alan yerleşimi</AlertTitle>
        <AlertDescription>
          Sol panelden alan ekleyin (Yetkili imza için önce imza görseli yükleyin), konumlandırın ve Yerleşimi Kaydet ile kaydedin.
        </AlertDescription>
      </Alert>
      <TemplateEditor
        ref={editorRef}
        key={editorKey}
        courseId={courseId}
        pageWidth={data?.pageWidth ?? 595}
        pageHeight={data?.pageHeight ?? 842}
        initialFields={initialFields}
        onSave={saveFields}
        hasSignature={hasSignature}
        signatureImageUrl={signatureImageUrl}
        onUploadSignature={uploadSignature}
      />
    </div>
  );
}

export interface EditorField {
  fieldType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontKey: string;
  fontSize: number;
  minFontSize: number;
  color: string;
  align: string;
  dateFormat?: string;
  staticText?: string;
  uppercase?: boolean;
}
