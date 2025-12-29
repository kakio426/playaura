import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface VideoModalProps {
    channelId: string | null;
    channelName: string;
    onClose: () => void;
}

export function VideoModal({ channelId, channelName, onClose }: VideoModalProps) {
    // 1. Convert Channel Id (UC...) to Uploads Playlist ID (UU...)
    // This trick allows embedding the latest video without using API quota to search
    const playlistId = channelId ? channelId.replace(/^UC/, "UU") : "";

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!channelId) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-white/10">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            Latest Upload: {channelName}
                        </h3>
                        <div className="flex items-center gap-2">
                            <a
                                href={`https://www.youtube.com/channel/${channelId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                                title="Open Channel"
                            >
                                <ExternalLink size={16} />
                            </a>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Player Container (16:9) */}
                    <div className="relative pt-[56.25%] bg-black">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={`https://www.youtube.com/embed?listType=playlist&list=${playlistId}&autoplay=1`}
                            title="YouTube Video Player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
