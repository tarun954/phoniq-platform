"use client";
import { useEffect, useState } from "react";

const words = [
  "answer every call",
  "capture every lead",
  "schedule more jobs",
  "follow up automatically",
];

export default function TypingText() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    const complete = text === word;
    const empty = text === "";

    const timer = setTimeout(() => {
      if (!deleting) {
        if (!complete) setText(word.slice(0, text.length + 1));
        else setDeleting(true);
      } else {
        if (!empty) setText(word.slice(0, text.length - 1));
        else {
          setDeleting(false);
          setIndex((index + 1) % words.length);
        }
      }
    }, complete && !deleting ? 1200 : deleting ? 45 : 75);

    return () => clearTimeout(timer);
  }, [index, text, deleting]);

  return <span className="phoniq-caret text-blue-600">{text}</span>;
}
