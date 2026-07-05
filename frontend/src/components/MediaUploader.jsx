import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CloudArrowUp, X, PlayCircle } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND = process.env.REACT_APP_BACKEND_URL;

/**
 * Resolve stored URLs. Backend-uploaded assets come back as "/api/files/{id}" —
 * we prefix REACT_APP_BACKEND_URL. External URLs (http/https) are used as-is.
 */
export const resolveMediaUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/api/")) return `${BACKEND}${u}`;
  return u;
};

const ACCEPT_MAP = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  any: "image/*,video/*",
};

export default function MediaUploader({
  kind = "any",           // "image" | "video" | "any"
  value = "",              // current URL (single mode)
  values = null,           // array (multi mode) — pass values + onChangeMulti to enable gallery mode
  onChange,                // (url) => void — single mode
  onChangeMulti,           // (urls[]) => void — multi mode
  label,
  testId = "media-upload",
  compact = false,
}) {
  const multi = Array.isArray(values);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const upload = useCallback(async (file) => {
    setUploading(true); setProgress(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await axios.post(`${API}/uploads`, fd, {
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
      });
      if (multi) onChangeMulti([...(values || []), data.url]);
      else onChange(data.url);
      toast.success("Uploaded");
    } catch (e) {
      const d = e?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Upload failed");
    } finally { setUploading(false); setProgress(0); }
  }, [multi, onChange, onChangeMulti, values]);

  const handleFiles = useCallback((files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    if (multi) list.forEach(f => upload(f));
    else upload(list[0]);
  }, [multi, upload]);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const clearOne = (idx) => {
    if (multi) onChangeMulti(values.filter((_, i) => i !== idx));
    else onChange("");
  };

  const previews = multi ? (values || []) : (value ? [value] : []);

  return (
    <div className="space-y-2" data-testid={testId}>
      {label && <label className="text-xs font-semibold text-muted2 uppercase tracking-widest">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        data-testid={`${testId}-dropzone`}
        className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors ${dragOver ? "border-forest bg-cream2" : "border-edge hover:border-forest"} ${compact ? "p-4" : "p-6"} text-center bg-white`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[kind]}
          multiple={multi}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid={`${testId}-input`}
        />
        <CloudArrowUp size={compact ? 24 : 32} weight="duotone" className="text-terracotta mx-auto" />
        <p className="text-sm text-ink mt-2">
          <span className="font-semibold">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-muted2 mt-1">
          {kind === "image" && "PNG, JPG, WebP up to 10 MB"}
          {kind === "video" && "MP4, WebM up to 60 MB"}
          {kind === "any" && "Images (10 MB) or videos (60 MB)"}
        </p>
        {uploading && (
          <div className="mt-3 h-1.5 bg-cream2 rounded-full overflow-hidden">
            <div className="h-full bg-forest transition-all" style={{ width: `${progress}%` }} data-testid={`${testId}-progress`} />
          </div>
        )}
      </div>

      {previews.length > 0 && (
        <div className={`grid gap-2 ${multi ? "grid-cols-3" : "grid-cols-1"}`}>
          {previews.map((url, idx) => {
            const src = resolveMediaUrl(url);
            const isVideo = url.includes("/api/files/") ? false : /\.(mp4|webm|mov)$/i.test(url);
            return (
              <div key={`${url}-${idx}`} className="relative group rounded-lg overflow-hidden border border-edge bg-cream2">
                {isVideo || kind === "video" ? (
                  <div className="aspect-video flex items-center justify-center bg-forest/10">
                    <PlayCircle size={32} weight="duotone" className="text-forest" />
                  </div>
                ) : (
                  <img src={src} alt="" className="w-full aspect-square object-cover" />
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearOne(idx); }}
                  data-testid={`${testId}-remove-${idx}`}
                  className="absolute top-1 right-1 bg-white/90 hover:bg-terracotta hover:text-white rounded-full p-1 shadow-sm"
                  aria-label="Remove"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
