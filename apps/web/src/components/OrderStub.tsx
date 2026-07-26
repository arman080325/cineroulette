"use client";

interface OrderStubProps {
  mood: string | null;
  genre: string | null;
  language: string | null;
  minRating: number;
  serial: string;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-3">
      <span className="font-data text-[10px] uppercase tracking-[0.2em] text-ash">
        {label}
      </span>
      {value ? (
        <span className="truncate font-data text-[13px] text-gold">{value}</span>
      ) : (
        <span className="h-[1px] w-full bg-[repeating-linear-gradient(90deg,rgba(58,65,102,0.7)_0_4px,transparent_4px_8px)]" aria-hidden="true" />
      )}
      {!value && <span className="sr-only">not set</span>}
    </div>
  );
}

export function OrderStub({ mood, genre, language, minRating, serial }: OrderStubProps) {
  return (
    <div
      className="surface glass-card w-full max-w-[380px] px-6 py-5 lg:max-w-none"
      style={{ ["--ticket-bg" as string]: "#080a14" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-data text-[10px] uppercase tracking-[0.35em] text-gold/80">
          Admit One
        </span>
        <span aria-hidden="true" className="text-sm">🎬</span>
      </div>

      <div className="ticket-divider mb-4" />

      <div className="flex flex-col gap-3">
        <Field label="Mood" value={mood} />
        <Field label="Genre" value={genre} />
        <Field label="Lang" value={language} />
        <Field label="Rating" value={minRating > 0 ? `${minRating}.0+` : null} />
      </div>

      <div className="ticket-divider my-4" />

      <p className="text-right font-data text-[10px] tracking-[0.2em] text-ash">
        no. {serial}
      </p>
    </div>
  );
}