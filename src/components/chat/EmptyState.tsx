const PROMPTS = [
  "Explain the difference between mitosis and meiosis",
  "Help me outline an essay on climate policy",
  "Walk me through solving a quadratic equation",
  "Quiz me on World War II key events",
];

export default function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl2 bg-amber-500 font-display text-2xl font-bold text-ink-950">
        S
      </div>
      <h1 className="font-display text-2xl font-semibold text-parchment-100">
        What are you studying today?
      </h1>
      <p className="mt-2 max-w-sm text-sm text-parchment-200/60">
        Ask a question, paste your notes, or work through a problem step by step.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="rounded-xl2 border border-ink-700 bg-ink-800/60 px-4 py-3 text-left text-sm text-parchment-200/80 transition-colors hover:border-amber-500/40 hover:bg-ink-800"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
