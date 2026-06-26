"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerLow,
  TextAlignLeft,
  Copy,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, StatusKey } from "@/components/shared/StatusBadge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import api, { Brief, ScriptSegment, SERVER_URL } from "@/lib/api";
import { toast } from "sonner";

interface AudioPlayerProps {
  briefs: Brief[];
  isLoading: boolean;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export const AudioPlayer = ({ briefs, isLoading }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const saved = localStorage.getItem("inboxfm.playbackRate");
    const parsed = saved ? Number(saved) : 1;
    return SPEED_OPTIONS.includes(parsed) ? parsed : 1;
  });
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [detailScript, setDetailScript] = useState<ScriptSegment[] | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  const latestBrief = useMemo(() => {
    const delivered = briefs.find(
      (b) => b.status === "DELIVERED" && b.audioUrl,
    );
    return delivered || briefs[0] || null;
  }, [briefs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [latestBrief]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    localStorage.setItem("inboxfm.playbackRate", String(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      if (!latestBrief?.id) {
        setDetailScript(null);
        return;
      }
      if (latestBrief.scriptJson?.length) {
        setDetailScript(latestBrief.scriptJson);
        return;
      }
      try {
        const detail = await api.briefs.getById(latestBrief.id);
        if (!mounted) return;
        setDetailScript(detail.scriptJson || []);
      } catch {
        if (!mounted) return;
        setDetailScript([]);
      }
    };

    void loadDetail();
    return () => {
      mounted = false;
    };
  }, [latestBrief?.id, latestBrief?.scriptJson]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, duration),
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeekChange = (value: number[]) => {
    const newTime = value[0];
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChangeSlider = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const cyclePlaybackRate = () => {
    const currentIdx = SPEED_OPTIONS.findIndex((x) => x === playbackRate);
    const next = SPEED_OPTIONS[(currentIdx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
  };

  const audioUrl = latestBrief?.audioUrl
    ? latestBrief.audioUrl.startsWith("http")
      ? latestBrief.audioUrl
      : `${SERVER_URL}${latestBrief.audioUrl}`
    : null;

  const briefDate = latestBrief?.date
    ? new Date(latestBrief.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "No briefs yet";

  const briefDuration = latestBrief?.audioDuration
    ? `${Math.floor(latestBrief.audioDuration / 60)}:${(
        latestBrief.audioDuration % 60
      )
        .toString()
        .padStart(2, "0")}`
    : "--:--";

  const transcript = detailScript || [];
  const filteredTranscript = transcript.filter((segment) =>
    segment.text.toLowerCase().includes(transcriptSearch.toLowerCase()),
  );

  const copyTranscript = async () => {
    const text = transcript.map((s) => s.text).join("\n\n");
    if (!text) {
      toast.error("No transcript available");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Transcript copied");
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="p-8 flex items-center justify-center">
        <Spinner size={32} className="text-primary" />
      </Card>
    );
  }

  if (!latestBrief) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <p className="text-muted-foreground">
          No briefs available yet. Generate your first one!
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-6 relative overflow-hidden group">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full text-foreground fill-current">
          <path d="M0,20 L0,15 Q2.5,5 5,12 T10,8 T15,14 T20,6 T25,12 T30,10 T35,16 T40,4 T45,14 T50,8 T55,12 T60,6 T65,14 T70,10 T75,16 T80,4 T85,14 T90,8 T95,12 T100,6 L100,20 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 bg-muted/30 border-2 border-black dark:border-zinc-700 rounded-[var(--ds-radius-inner)] flex items-center justify-center text-foreground shadow-[var(--ds-shadow-card)] relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent" />
          {isPlaying ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Pause size={48} weight="bold" />
            </motion.div>
          ) : (
            <Play size={48} weight="bold" />
          )}
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-2xl font-black">{briefDate} Brief</h3>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                {latestBrief.status === "DELIVERED" && (
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
                {latestBrief.emailsProcessed} emails • {briefDuration}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-[var(--ds-radius-pill)] px-3 text-xs font-black"
                onClick={cyclePlaybackRate}
              >
                {playbackRate}×
              </Button>
              <StatusBadge status={latestBrief.status as StatusKey} dot />
            </div>
          </div>

          <div className="py-6">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={1}
              onValueChange={handleSeekChange}
              className="cursor-pointer"
              aria-label="Seek"
            />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-[var(--ds-radius-btn)]"
                onClick={() => skip(-15)}
                disabled={!audioUrl}
                aria-label="Rewind 15 seconds"
              >
                <SkipBack size={24} weight="fill" />
              </Button>
              <Button
                onClick={togglePlay}
                variant="secondary"
                className="w-14 h-14 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:text-background border-2 border-black dark:border-zinc-750 shadow-[var(--ds-shadow-card)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center shrink-0 transition-all"
                disabled={!audioUrl}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={28} weight="fill" />
                ) : (
                  <Play size={28} weight="fill" className="ml-1" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-[var(--ds-radius-btn)]"
                onClick={() => skip(15)}
                disabled={!audioUrl}
                aria-label="Skip forward 15 seconds"
              >
                <SkipForward size={24} weight="fill" />
              </Button>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground min-w-[120px] justify-end">
              <SpeakerLow size={20} />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChangeSlider}
                className="w-24"
                aria-label="Volume"
              />
              <SpeakerHigh size={20} />
            </div>
          </div>

          <div className="mt-6 border-t-2 border-dashed border-black/10 dark:border-white/10 pt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="rounded-[var(--ds-radius-btn)]"
                onClick={() => setShowTranscript((v) => !v)}
              >
                <TextAlignLeft size={16} className="mr-2" />
                {showTranscript ? "Hide Transcript" : "Read Transcript"}
              </Button>

              {showTranscript && (
                <Button variant="ghost" size="sm" onClick={copyTranscript} className="rounded-[var(--ds-radius-btn)]">
                  <Copy size={16} className="mr-2" />
                  Copy Transcript
                </Button>
              )}
            </div>

            {showTranscript && (
              <div className="mt-4 space-y-4">
                <Input
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Search transcript..."
                  className="font-bold"
                  aria-label="Search transcript"
                />

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {(transcriptSearch ? filteredTranscript : transcript).map(
                    (segment, idx) => (
                      <div
                        key={`${segment.type}-${idx}`}
                        className="rounded-[var(--ds-radius-inner)] border-2 border-black dark:border-zinc-700 bg-background/50 p-3"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                          {segment.type}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {segment.emphasis ? (
                            <strong>{segment.text}</strong>
                          ) : (
                            segment.text
                          )}
                        </p>
                      </div>
                    ),
                  )}
                  {transcript.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Transcript not available for this brief.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
