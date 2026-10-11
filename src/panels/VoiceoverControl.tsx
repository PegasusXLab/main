"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { CURATED_VOICES, DEFAULT_VOICE, shortVoiceName } from "@/lib/elevenlabs/voices";
import { LiveRecorder } from "@/lib/audioRecorder";
import type { VoiceOverData } from "@/lib/schema/types";

export interface VoiceoverControlProps {
  value?: VoiceOverData;
  onChange: (val: VoiceOverData | undefined) => void;
  defaultText?: string;
  label?: string;
  /** When visitors hear it, e.g. "Plays each time a visitor walks into this room." */
  trigger?: string;
  className?: string;
}

type TabMode = "elevenlabs" | "record" | "upload";

export function VoiceoverControl({
  value,
  onChange,
  defaultText = "",
  label = "Audio Guide / Voiceover",
  trigger,
  className = "",
}: VoiceoverControlProps) {
  const [tab, setTab] = useState<TabMode>("elevenlabs");
  const [scriptText, setScriptText] = useState(value?.text || defaultText);
  const [voiceId, setVoiceId] = useState(value?.voiceId || DEFAULT_VOICE.id);
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Mic recording state
  const recorderRef = useRef<LiveRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [isUploadingRecord, setIsUploadingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Is ElevenLabs connected on the server? (null = still checking / unknown)
  const [elevenConfigured, setElevenConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/narration/generate")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { configured?: boolean } | null) => {
        if (!cancelled && d && typeof d.configured === "boolean") setElevenConfigured(d.configured);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The account's real voices (with previews), once ElevenLabs is connected; else the curated list.
  const [accountVoices, setAccountVoices] = useState<
    { id: string; name: string; category: string; description: string; previewUrl: string | null }[]
  >([]);
  useEffect(() => {
    if (!elevenConfigured) return;
    let cancelled = false;
    fetch("/api/narration/voices")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { voices?: typeof accountVoices } | null) => {
        if (!cancelled && d?.voices?.length) setAccountVoices(d.voices);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [elevenConfigured]);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewVoice = (url: string | null) => {
    if (!url || typeof Audio === "undefined") return;
    previewRef.current?.pause();
    previewRef.current = new Audio(url);
    void previewRef.current.play().catch(() => {});
  };

  // Does the attached audio actually have sound? Placeholders saved before ElevenLabs was
  // connected are tiny files with no length; never call those "Active".
  const [health, setHealth] = useState<{ url: string; status: "ok" | "silent" } | null>(null);
  const audioStatus: "checking" | "ok" | "silent" =
    value?.audioUrl && health?.url === value.audioUrl ? health.status : "checking";
  const checkAudio = (url: string, duration: number) =>
    setHealth({ url, status: Number.isFinite(duration) && duration > 0.3 ? "ok" : "silent" });

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync defaultText if scriptText is empty
  const handleUseDefaultText = () => {
    if (defaultText) setScriptText(defaultText);
  };

  // Generate via ElevenLabs API
  const handleGenerateElevenLabs = async () => {
    if (!scriptText.trim()) {
      setGenerateError("Please enter a script or description to speak.");
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);

    const effectiveVoiceId = voiceId === "custom" ? customVoiceId.trim() : voiceId;
    const accountVoice = accountVoices.find((v) => v.id === effectiveVoiceId);
    const voiceObj = CURATED_VOICES.find((v) => v.id === effectiveVoiceId);
    const voiceName = accountVoice
      ? shortVoiceName(accountVoice.name)
      : voiceObj
        ? voiceObj.name
        : "Custom Voice";

    try {
      const res = await fetch("/api/narration/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scriptText.trim(),
          voiceId: effectiveVoiceId,
          voiceName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Speech generation failed");
      }

      onChange({
        text: scriptText.trim(),
        audioUrl: data.url,
        voiceId: effectiveVoiceId,
        voiceName,
        source: "elevenlabs",
      });
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Live recording handlers
  const startRecording = async () => {
    setRecordError(null);
    setRecordedBlob(null);
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }

    try {
      const rec = new LiveRecorder();
      recorderRef.current = rec;
      await rec.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Microphone access denied");
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    try {
      if (recorderRef.current) {
        const wavBlob = await recorderRef.current.stop();
        setRecordedBlob(wavBlob);
        setRecordedPreviewUrl(URL.createObjectURL(wavBlob));
      }
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Recording failed");
    }
  };

  const saveRecordedVoiceover = async () => {
    if (!recordedBlob) return;
    setIsUploadingRecord(true);
    setRecordError(null);

    try {
      const form = new FormData();
      form.append("file", recordedBlob, "voiceover-recording.wav");

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audio upload failed");

      onChange({
        text: scriptText.trim() || defaultText || "Recorded voiceover",
        audioUrl: data.url,
        voiceName: "Microphone Recording",
        source: "recorded",
      });
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Failed to upload recording");
    } finally {
      setIsUploadingRecord(false);
    }
  };

  // Upload pre-recorded file handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      onChange({
        text: scriptText.trim() || defaultText || file.name,
        audioUrl: data.url,
        voiceName: file.name,
        source: "uploaded",
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setRecordedBlob(null);
    if (recordedPreviewUrl) {
      URL.revokeObjectURL(recordedPreviewUrl);
      setRecordedPreviewUrl(null);
    }
  };

  return (
    <div className={`flex flex-col gap-2 rounded-[2px] border border-hairline bg-plaster/40 p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-graphite">{label}</span>
        {value?.audioUrl ? (
          audioStatus === "silent" ? (
            <span
              data-testid="voiceover-status"
              className="inline-flex items-center gap-1 rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              Silent
            </span>
          ) : audioStatus === "ok" ? (
            <span
              data-testid="voiceover-status"
              className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span data-testid="voiceover-status" className="text-[10px] text-pencil">
              Checking…
            </span>
          )
        ) : (
          <span className="text-[10px] text-pencil">Optional</span>
        )}
      </div>

      {trigger ? (
        <p data-testid="voiceover-trigger" className="-mt-1 text-[10px] leading-snug text-pencil">
          {trigger}
        </p>
      ) : null}

      {/* Existing audio player preview */}
      {value?.audioUrl ? (
        <div className="flex flex-col gap-2 rounded border border-hairline bg-paper p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-graphite">
              {value.source === "elevenlabs"
                ? `🎙️ ${shortVoiceName(value.voiceName) || "ElevenLabs Docent"}`
                : value.source === "recorded"
                  ? "🎙️ Mic Recording"
                  : "🎵 Pre-recorded Audio"}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-danger hover:underline"
            >
              Remove
            </button>
          </div>

          <audio
            key={value.audioUrl}
            controls
            src={value.audioUrl}
            className="h-7 w-full"
            preload="metadata"
            onLoadedMetadata={(e) => checkAudio(value.audioUrl!, e.currentTarget.duration)}
            onError={() => checkAudio(value.audioUrl!, 0)}
          />

          {audioStatus === "silent" ? (
            <p role="alert" className="text-[10px] leading-snug text-danger">
              This voiceover has no sound (it was likely saved before ElevenLabs was connected).
              Remove it and generate or record it again.
            </p>
          ) : null}

          {value.text ? (
            <p className="line-clamp-2 text-[10px] text-pencil italic">
              &ldquo;{value.text}&rdquo;
            </p>
          ) : null}
        </div>
      ) : (
        /* Tabs for creating / uploading voiceover */
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-3 gap-1 rounded bg-pencil/10 p-0.5 text-center text-[11px]">
            <button
              type="button"
              onClick={() => setTab("elevenlabs")}
              className={`rounded py-1 font-medium transition-colors ${
                tab === "elevenlabs" ? "bg-paper text-graphite shadow-xs" : "text-pencil hover:text-graphite"
              }`}
            >
              ElevenLabs AI
            </button>
            <button
              type="button"
              onClick={() => setTab("record")}
              className={`rounded py-1 font-medium transition-colors ${
                tab === "record" ? "bg-paper text-graphite shadow-xs" : "text-pencil hover:text-graphite"
              }`}
            >
              Record Mic
            </button>
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`rounded py-1 font-medium transition-colors ${
                tab === "upload" ? "bg-paper text-graphite shadow-xs" : "text-pencil hover:text-graphite"
              }`}
            >
              Upload File
            </button>
          </div>

          {/* TAB 1: ElevenLabs AI Voice */}
          {tab === "elevenlabs" && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voiceover-persona-select" className="text-[10px]">Voice</Label>
                  {accountVoices.find((v) => v.id === voiceId)?.previewUrl ? (
                    <button
                      type="button"
                      data-testid="voiceover-preview"
                      onClick={() => previewVoice(accountVoices.find((v) => v.id === voiceId)?.previewUrl ?? null)}
                      className="text-[10px] text-accent hover:underline"
                    >
                      ▶ Preview voice
                    </button>
                  ) : null}
                </div>
                <Select
                  id="voiceover-persona-select"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  {accountVoices.length ? (
                    <>
                      {accountVoices.some((v) => v.category !== "premade") ? (
                        <optgroup label="Your voices">
                          {accountVoices
                            .filter((v) => v.category !== "premade")
                            .map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                        </optgroup>
                      ) : null}
                      <optgroup label="ElevenLabs library">
                        {accountVoices
                          .filter((v) => v.category === "premade")
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                              {v.description ? ` — ${v.description}` : ""}
                            </option>
                          ))}
                      </optgroup>
                    </>
                  ) : (
                    CURATED_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.persona}
                      </option>
                    ))
                  )}
                  {!accountVoices.some((v) => v.id === voiceId) &&
                  !CURATED_VOICES.some((v) => v.id === voiceId) &&
                  voiceId !== "custom" ? (
                    <option value={voiceId}>Current voice</option>
                  ) : null}
                  <option value="custom">Custom Voice ID…</option>
                </Select>
              </div>

              {voiceId === "custom" && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="custom-voice-id" className="text-[10px]">ElevenLabs Voice ID</Label>
                  <Input
                    id="custom-voice-id"
                    type="text"
                    value={customVoiceId}
                    onChange={(e) => setCustomVoiceId(e.target.value)}
                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voiceover-script" className="text-[10px]">Script to Speak</Label>
                  {defaultText && defaultText !== scriptText && (
                    <button
                      type="button"
                      onClick={handleUseDefaultText}
                      className="text-[10px] text-accent hover:underline"
                    >
                      Use description
                    </button>
                  )}
                </div>
                <textarea
                  id="voiceover-script"
                  rows={2}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Enter narration text for the audio guide..."
                  className="w-full rounded-[2px] border border-hairline bg-paper px-2 py-1 text-xs text-graphite placeholder:text-pencil focus-visible:outline-none focus-visible:border-accent"
                />
              </div>

              {elevenConfigured === false ? (
                <p
                  role="status"
                  data-testid="elevenlabs-not-connected"
                  className="rounded border border-hairline bg-paper px-2 py-1.5 text-[10px] leading-snug text-pencil"
                >
                  ElevenLabs isn&rsquo;t connected yet: the server needs an <code>ELEVENLABS_API_KEY</code>.
                  You can still <button type="button" className="text-accent hover:underline" onClick={() => setTab("record")}>record</button> or{" "}
                  <button type="button" className="text-accent hover:underline" onClick={() => setTab("upload")}>upload</button> a voiceover.
                </p>
              ) : null}

              {generateError && (
                <p role="alert" className="text-[10px] text-danger">{generateError}</p>
              )}

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isGenerating || !scriptText.trim() || elevenConfigured === false}
                onClick={handleGenerateElevenLabs}
                className="w-full"
              >
                {isGenerating ? "Generating audio with ElevenLabs…" : "Generate AI Audio Guide"}
              </Button>
            </div>
          )}

          {/* TAB 2: Record with Mic */}
          {tab === "record" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded border border-hairline bg-paper p-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isRecording ? "animate-pulse bg-red-500" : "bg-pencil/40"
                    }`}
                  />
                  <span className="text-xs font-mono text-graphite">
                    {isRecording
                      ? `Recording: ${recordSeconds}s`
                      : recordedBlob
                        ? `Recorded (${Math.round(recordedBlob.size / 1024)} KB)`
                        : "Ready to record"}
                  </span>
                </div>

                {!isRecording ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startRecording}
                  >
                    {recordedBlob ? "Re-record" : "Record Mic"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                  >
                    Stop
                  </Button>
                )}
              </div>

              {recordedPreviewUrl && !isRecording && (
                <div className="flex flex-col gap-2">
                  <audio controls src={recordedPreviewUrl} className="h-7 w-full" />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isUploadingRecord}
                    onClick={saveRecordedVoiceover}
                  >
                    {isUploadingRecord ? "Saving recording…" : "Save Recording as Voiceover"}
                  </Button>
                </div>
              )}

              {recordError && (
                <p role="alert" className="text-[10px] text-danger">{recordError}</p>
              )}
            </div>
          )}

          {/* TAB 3: Upload Pre-recorded File */}
          {tab === "upload" && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {isUploadingFile ? "Uploading…" : "Choose MP3, WAV, or M4A File"}
              </Button>
              <p className="text-[10px] text-pencil">
                Upload your own pre-recorded voice track or background audio guide.
              </p>
              {uploadError && (
                <p role="alert" className="text-[10px] text-danger">{uploadError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VoiceoverControl;
