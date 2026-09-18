"use client";

import { useEffect, useRef, useState } from "react";
import { IconVolume } from "@/components/ui/Icons";
import styles from "./PronunciationButton.module.css";

type PronunciationButtonProps = {
  text: string;
  ariaLabel?: string;
  onUnsupported?: () => void;
};

const preferredVoiceNames = [
  "Google US English",
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Alex",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Guy",
];

const noveltyVoiceNames = [
  "Albert",
  "Bad News",
  "Bahh",
  "Bells",
  "Boing",
  "Bubbles",
  "Cellos",
  "Good News",
  "Jester",
  "Organ",
  "Superstar",
  "Trinoids",
  "Whisper",
  "Wobble",
  "Zarvox",
];

function selectEnglishVoice(voices: SpeechSynthesisVoice[]) {
  const normalVoices = voices.filter(
    (voice) =>
      !noveltyVoiceNames.some((name) =>
        voice.name.toLowerCase().includes(name.toLowerCase()),
      ),
  );
  const americanVoices = normalVoices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en-us"),
  );
  const englishVoices = normalVoices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  const candidates =
    americanVoices.length > 0 ? americanVoices : englishVoices;

  for (const preferredName of preferredVoiceNames) {
    const preferredVoice = candidates.find((voice) =>
      voice.name.toLowerCase().includes(preferredName.toLowerCase()),
    );
    if (preferredVoice) return preferredVoice;
  }

  return candidates.find((voice) => voice.default) ?? candidates[0];
}

export function PronunciationButton({
  text,
  ariaLabel,
  onUnsupported,
}: PronunciationButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  function handleClick() {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      onUnsupported?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = selectEnglishVoice(window.speechSynthesis.getVoices());
    utteranceRef.current = utterance;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.voice = voice ?? null;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setSpeaking(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${speaking ? styles.speaking : ""}`}
      aria-label={ariaLabel ?? `${text} 발음 듣기`}
      aria-pressed={speaking}
      title="발음 듣기"
      onClick={handleClick}
    >
      <IconVolume size={21} />
    </button>
  );
}
