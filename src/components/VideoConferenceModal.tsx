import React, { useState, useEffect, useRef } from 'react';
import { SiteContact, VideoConferenceSettings } from '../types';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Radio,
  Monitor,
  Activity,
  Sparkles,
  Camera,
  Layers,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Wifi,
  Sliders,
  X,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from '../lib/soundUtils';

interface VideoConferenceModalProps {
  isOpen: boolean;
  contact: SiteContact | null;
  settings?: VideoConferenceSettings;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function VideoConferenceModal({
  isOpen,
  contact,
  settings,
  onClose,
  onOpenSettings,
}: VideoConferenceModalProps) {
  // Call States
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPiPMode, setIsPiPMode] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRecordingSnapshot, setIsRecordingSnapshot] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  // Audio level meters
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  // Local media stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Resolution & Stream Metrics
  const resolutionLabel = settings?.resolution || '720p HD';
  const frameRateTarget = settings?.frameRate || 30;
  const codecLabel = settings?.preferredCodec || 'VP9';
  const duplexMode = settings?.fullDuplexAudio ? 'Full Duplex 48kHz' : 'Standard 16kHz';

  // Initialize Call & Media
  useEffect(() => {
    if (isOpen && contact) {
      setCallStatus('connecting');
      setCallDuration(0);
      setIsPiPMode(false);
      setInCallMessages([
        {
          sender: contact.name,
          text: `Connected to ${contact.siteLocation}. Video stream synchronized.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Connect after brief ring
      const connectTimer = setTimeout(() => {
        setCallStatus('connected');
      }, 1200);

      // Start local camera stream
      startLocalMedia();

      return () => {
        clearTimeout(connectTimer);
        stopLocalMedia();
      };
    }
  }, [isOpen, contact]);

  // Duration Timer
  useEffect(() => {
    let timer: any = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // Remote & Local Video Simulation Animation Loop (renders high-fidelity realistic contact & jobsite stream)
  useEffect(() => {
    if (!isOpen || !contact) return;

    let time = 0;
    const renderSimulation = () => {
      time += 0.05;

      // 1. Draw Remote Video Stream on Canvas (Remote Full-Duplex Contact)
      if (remoteCanvasRef.current) {
        const canvas = remoteCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Background based on role
          const grad = ctx.createLinearGradient(0, 0, width, height);
          if (contact.role === 'Engineer') {
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.5, '#1e293b');
            grad.addColorStop(1, '#0284c7');
          } else if (contact.role === 'Painter') {
            grad.addColorStop(0, '#064e3b');
            grad.addColorStop(0.5, '#047857');
            grad.addColorStop(1, '#0f172a');
          } else if (contact.role === 'Manager') {
            grad.addColorStop(0, '#312e81');
            grad.addColorStop(0.5, '#4338ca');
            grad.addColorStop(1, '#0f172a');
          } else {
            grad.addColorStop(0, '#78350f');
            grad.addColorStop(0.5, '#b45309');
            grad.addColorStop(1, '#0f172a');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Jobsite grid / geometric overlay
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Subtle moving scanning wave
          const scanY = (Math.sin(time * 0.8) * 0.5 + 0.5) * height;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(width, scanY);
          ctx.stroke();

          // Contact Avatar Portrait Silhouette in 3D center
          const centerX = width / 2;
          const centerY = height / 2 - 15;
          const headRadius = 48 + Math.sin(time * 2) * 1.5;

          // Dynamic aura based on speech
          const speechVol = Math.abs(Math.sin(time * 3)) * (isSpeakerMuted ? 0 : 0.8);
          setRemoteAudioLevel(Math.min(100, Math.round(speechVol * 100)));

          ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + speechVol * 0.3})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, headRadius + 18 * speechVol, 0, Math.PI * 2);
          ctx.fill();

          // Avatar head circle
          const avatarGrad = ctx.createLinearGradient(
            centerX - headRadius,
            centerY - headRadius,
            centerX + headRadius,
            centerY + headRadius
          );
          avatarGrad.addColorStop(0, '#38bdf8');
          avatarGrad.addColorStop(1, '#6366f1');
          ctx.fillStyle = avatarGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
          ctx.fill();

          // Initials
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(contact.initials, centerX, centerY);

          // Body shoulders
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + headRadius + 60, 90, 45, 0, 0, Math.PI * 2);
          ctx.fill();

          // Live audio waveform bars on remote stream
          const barCount = 18;
          const barWidth = 4;
          const startX = centerX - (barCount * (barWidth + 3)) / 2;
          for (let i = 0; i < barCount; i++) {
            const h = Math.abs(Math.sin(time * 4 + i * 0.5)) * 26 * (isSpeakerMuted ? 0.05 : 1);
            ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#818cf8';
            ctx.fillRect(startX + i * 7, height - 35 - h / 2, barWidth, Math.max(4, h));
          }
        }
      }

      // 2. Draw Local Video Stream Canvas Fallback (if real camera is muted or not available)
      if (localCanvasRef.current && (!localStreamRef.current || isVideoMuted)) {
        const lCanvas = localCanvasRef.current;
        const lCtx = lCanvas.getContext('2d');
        if (lCtx) {
          const lW = lCanvas.width;
          const lH = lCanvas.height;

          lCtx.fillStyle = '#0f172a';
          lCtx.fillRect(0, 0, lW, lH);

          if (isVideoMuted) {
            lCtx.fillStyle = '#64748b';
            lCtx.font = 'bold 12px monospace';
            lCtx.textAlign = 'center';
            lCtx.fillText('Camera Off', lW / 2, lH / 2);
          } else {
            // Local user virtual site camera simulation
            const lGrad = lCtx.createRadialGradient(lW / 2, lH / 2, 10, lW / 2, lH / 2, lW / 2);
            lGrad.addColorStop(0, '#1e1b4b');
            lGrad.addColorStop(1, '#020617');
            lCtx.fillStyle = lGrad;
            lCtx.fillRect(0, 0, lW, lH);

            lCtx.fillStyle = '#a5b4fc';
            lCtx.beginPath();
            lCtx.arc(lW / 2, lH / 2 - 8, 24, 0, Math.PI * 2);
            lCtx.fill();

            lCtx.fillStyle = '#0f172a';
            lCtx.font = 'bold 16px monospace';
            lCtx.textAlign = 'center';
            lCtx.textBaseline = 'middle';
            lCtx.fillText('YOU', lW / 2, lH / 2 - 8);

            // Local audio level calculation
            const localVol = isMicMuted ? 0 : Math.abs(Math.sin(time * 2.5)) * 0.7;
            setLocalAudioLevel(Math.round(localVol * 100));
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderSimulation);
    };

    animationFrameRef.current = requestAnimationFrame(renderSimulation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, contact, isSpeakerMuted, isMicMuted, isVideoMuted]);

  // Acquire user media
  const startLocalMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: settings?.resolution === '1080p' ? 1920 : 1280 },
            height: { ideal: settings?.resolution === '1080p' ? 1080 : 720 },
            frameRate: { ideal: frameRateTarget },
            deviceId: settings?.videoInputDeviceId ? { exact: settings.videoInputDeviceId } : undefined,
          },
          audio: {
            echoCancellation: settings?.echoCancellation ?? true,
            noiseSuppression: settings?.noiseSuppression ?? true,
            autoGainControl: settings?.autoGainControl ?? true,
            deviceId: settings?.audioInputDeviceId ? { exact: settings.audioInputDeviceId } : undefined,
          },
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.info('Local webcam access prompt or fallback active:', err);
      // Clean fallback continues via simulated canvas
    }
  };

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const toggleVideo = () => {
    setIsVideoMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      startLocalMedia();
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          localStreamRef.current = displayStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = displayStream;
            localVideoRef.current.play().catch(() => {});
          }
          setIsScreenSharing(true);

          displayStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            startLocalMedia();
          };
        } else {
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.warn('Screen share cancelled or not available:', err);
      }
    }
  };

  const handleCaptureSnapshot = () => {
    setIsRecordingSnapshot(true);
    setTimeout(() => {
      setIsRecordingSnapshot(false);
      setSnapshotSuccess(true);
    }, 400);
  };

  const handleSendInCallChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setInCallMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    stopLocalMedia();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !contact) return null;

  // Floating Picture-in-Picture Mini Video Feed Mode
  if (isPiPMode) {
    return (
      <div className="fixed bottom-16 right-4 z-50 w-72 bg-slate-900 border-2 border-indigo-500/80 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200 animate-in slide-in-from-bottom-5">
        <div className="px-3 py-2 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold font-mono text-white truncate">{contact.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">({formatDuration(callDuration)})</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPiPMode(false)}
            title="Expand Full Duplex Video Window"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          <canvas ref={remoteCanvasRef} width={320} height={180} className="w-full h-full object-cover" />

          {/* Mini Self View in Corner */}
          <div className="absolute bottom-2 right-2 w-20 aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
            {localStreamRef.current && !isVideoMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <canvas ref={localCanvasRef} width={80} height={45} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="p-2 bg-slate-950 flex items-center justify-between gap-1 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-1.5 rounded-lg text-xs ${
                isMicMuted ? 'bg-rose-900/80 text-rose-300' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-1.5 rounded-lg text-xs ${
                isVideoMuted ? 'bg-rose-900/80 text-rose-300' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleEndCall}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-mono font-bold uppercase flex items-center gap-1"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End</span>
          </button>
        </div>
      </div>
    );
  }

  // Full Screen / Standard Modal Video Conference View
  return (
    <div className="fixed top-[86px] inset-x-0 bottom-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        
        {/* Conference Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-white font-bold font-mono text-sm shadow-md`}>
                {contact.initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-mono">{contact.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {contact.role}
                </span>
                <span className="hidden sm:inline text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>Full Duplex HD</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {contact.roleCaption} • {contact.siteLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call Duration Chip */}
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{formatDuration(callDuration)}</span>
            </div>

            {/* Picture-in-Picture Minimize Button */}
            <button
              type="button"
              onClick={() => setIsPiPMode(true)}
              title="Minimize to Floating Window (continue using app while calling)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors hidden sm:flex"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Quick Settings Hook */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Configure Video Conference Settings"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
              </button>
            )}

            <button
              type="button"
              onClick={handleEndCall}
              title="Close Conference"
              className="p-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage & Main Interface */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-black relative overflow-hidden">
          
          {/* Primary Remote Video Area */}
          <div className="flex-1 flex flex-col min-h-0 relative items-center justify-center bg-slate-950">
            
            {/* Main Remote Canvas Video Feed */}
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
              <canvas
                ref={remoteCanvasRef}
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />

              {/* Status Banner when connecting */}
              {callStatus === 'connecting' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 animate-pulse text-indigo-400">
                    <PhoneCall className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-bold font-mono text-white">Establishing P2P WebRTC Link...</div>
                  <div className="text-xs text-slate-400 font-mono">Negotiating {codecLabel} SDP & ICE Handshake with {contact.name}</div>
                </div>
              )}

              {/* Snapshot confirmation flash */}
              <AnimatePresence>
                {snapshotSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      y: -12,
                      scale: 0.92,
                      transition: { duration: 0.22, ease: 'easeInOut' },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 18,
                      mass: 0.8,
                    }}
                    onClick={() => {
                      playClickSound();
                      setSnapshotSuccess(false);
                    }}
                    className="absolute top-4 right-4 z-20 bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-mono flex items-center justify-between gap-2.5 shadow-xl cursor-pointer select-none transition-transform active:scale-[0.99] hover:bg-emerald-900/90"
                    title="Tap notification to dismiss"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Snapshot captured & attached to project log</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] text-emerald-300 font-bold uppercase hidden sm:inline bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        Tap to dismiss
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setSnapshotSuccess(false);
                        }}
                        className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-800/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Telemetry Overlay */}
              {showTelemetry && callStatus === 'connected' && (
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 space-y-1 shadow-lg pointer-events-none">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Activity className="w-3 h-3" />
                    <span>FULL DUPLEX STREAM ACTIVE</span>
                  </div>
                  <div className="text-slate-400">Resolution: <span className="text-slate-200">{resolutionLabel} @ {frameRateTarget}fps</span></div>
                  <div className="text-slate-400">Codec: <span className="text-slate-200">{codecLabel} / Opus ({duplexMode})</span></div>
                  <div className="text-slate-400">Bitrate: <span className="text-slate-200">2,420 kbps (Jitter: 1.2ms)</span></div>
                  <div className="text-slate-400">AEC / Noise Suppression: <span className="text-emerald-400 font-semibold">Active</span></div>
                </div>
              )}

              {/* Remote Participant Bottom Label */}
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-xs border border-slate-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono text-white shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">{contact.name}</span>
                <span className="text-slate-400">({contact.role})</span>
                {/* Remote Audio Activity Waveform */}
                <div className="flex items-center gap-0.5 ml-2">
                  <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${Math.max(4, remoteAudioLevel * 0.16)}px` }} />
                  <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${Math.max(4, remoteAudioLevel * 0.22)}px` }} />
                  <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${Math.max(4, remoteAudioLevel * 0.12)}px` }} />
                </div>
              </div>

              {/* Self Video (Picture-in-Picture on main stage) */}
              <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-indigo-500/80 bg-slate-950 shadow-2xl">
                {localStreamRef.current && !isVideoMuted ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <canvas ref={localCanvasRef} width={192} height={108} className="w-full h-full object-cover" />
                )}

                <div className="absolute bottom-1 left-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 flex items-center gap-1">
                  <span>You (Site)</span>
                  {isMicMuted && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                </div>
              </div>
            </div>
          </div>

          {/* Right Drawer: In-Call Collaboration Chat & Jobsite Specs */}
          {showInCallChat && (
            <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 h-64 md:h-auto">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-200 uppercase">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>In-Call Notes & Dispatches</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInCallChat(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono">
                {inCallMessages.map((msg, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-indigo-300">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-slate-200 text-[11px] leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendInCallChat} className="p-2 border-t border-slate-800 flex gap-2 bg-slate-900">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send live in-call note..."
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Call Control Center Bottom Bar */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Audio & Telemetry Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              title={isSpeakerMuted ? 'Unmute Speaker Output' : 'Mute Speaker Output'}
              className={`p-2.5 rounded-xl text-xs font-mono transition-colors border ${
                isSpeakerMuted
                  ? 'bg-rose-950 border-rose-700 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowTelemetry(!showTelemetry)}
              title="Toggle WebRTC Telemetry HUD"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-colors ${
                showTelemetry
                  ? 'bg-indigo-950/80 border-indigo-600/50 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>
          </div>

          {/* Primary Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Microphone Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isMicMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Camera Toggle */}
            <button
              type="button"
              onClick={toggleVideo}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isVideoMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Sharing Toggle */}
            <button
              type="button"
              onClick={handleScreenShare}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen / CAD Schematics'}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isScreenSharing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Snapshot Grabber */}
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              title="Capture Inspection Frame"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-md"
            >
              <Camera className="w-5 h-5 text-indigo-400" />
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>

          {/* Right In-Call Drawer Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInCallChat(!showInCallChat)}
              title="Open In-Call Chat & Dispatch Notes"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-colors ${
                showInCallChat
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
              {inCallMessages.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center font-bold">
                  {inCallMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
