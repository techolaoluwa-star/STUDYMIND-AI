export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-parchment-200/60" />
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-parchment-200/60 [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-parchment-200/60 [animation-delay:0.3s]" />
    </div>
  );
}
