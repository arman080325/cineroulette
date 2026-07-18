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
    <div className="flex items-end gap-2">
      <span className="w-16 shrink-0 font-data text-[10px] uppercase tracking-widest text-brass">
        {label}
      </span>
      {value ? (
        <span className="flex-1 font-data text-[13px] text-gold">{value}</span>
      ) : (
        <span className="stub-rule" aria-hidden="true" />
      )}
      {!value && <span className="sr-only">not set</span>}
    </div>
  );
}

export function OrderStub({ mood, genre, language, minRating, serial }: OrderStubProps) {
  return (
    <div
      className="surface w-full max-w-[300px] px-5 py-4 shadow-lift"
      style={{ ["--ticket-bg" as string]: "#0a0605" }}
    >
      <p className="text-center font-data text-[10px] uppercase tracking-[0.35em] text-gold/70">
        Admit One
      </p>
      <div className="ticket-divider my-3" />
      <div className="flex flex-col gap-2.5">
        <Field label="Mood" value={mood} />
        <Field label="Genre" value={genre} />
        <Field label="Lang" value={language} />
        <Field label="Rating" value={minRating > 0 ? `${minRating}.0+` : null} />
      </div>
      <div className="ticket-divider my-3" />
      <p className="text-right font-data text-[10px] tracking-widest text-brass">
        no. {serial}
      </p>
    </div>
  );
}