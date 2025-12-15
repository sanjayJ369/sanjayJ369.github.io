import { useEffect, useRef } from "react";

import { isSoundEnabled } from "@/lib/sound";

export function useSound(path: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(path);
  }, [path]);

  const play = async () => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.volume = isSoundEnabled() ? 0.5 : 0.0;

    try {
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;

        // Wait until audio ends
        await new Promise<void>((resolve) => {
          audioRef.current?.addEventListener("ended", () => resolve(), {
            once: true,
          });
        });
      }
    } catch (err: unknown) {
      if ((err as Error).name == "NotAllowedError") {
        return;
      }
      console.warn("Failed to play click sound:", err);
    }
  };

  return { play };
}
