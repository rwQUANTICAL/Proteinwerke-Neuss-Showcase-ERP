"use client";

interface DateRangePickerProps {
  von: string;
  bis: string;
  onChange: (von: string, bis: string) => void;
  errorVon?: string;
  errorBis?: string;
}

export default function DateRangePicker({
  von,
  bis,
  onChange,
  errorVon,
  errorBis,
}: DateRangePickerProps) {
  const handleVonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVon = e.target.value;
    // If bis is before new von, auto-sync bis to von
    const newBis = bis < newVon ? newVon : bis;
    onChange(newVon, newBis);
  };

  const handleBisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(von, e.target.value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <fieldset className="fieldset flex-1">
        <legend className="fieldset-legend">Von</legend>
        <input
          type="date"
          className={`input input-bordered w-full ${errorVon ? "input-error" : ""}`}
          value={von}
          onChange={handleVonChange}
        />
        {errorVon && (
          <p className="text-error text-sm mt-1">{errorVon}</p>
        )}
      </fieldset>
      <fieldset className="fieldset flex-1">
        <legend className="fieldset-legend">Bis</legend>
        <input
          type="date"
          className={`input input-bordered w-full ${errorBis ? "input-error" : ""}`}
          value={bis}
          min={von}
          onChange={handleBisChange}
        />
        {errorBis && (
          <p className="text-error text-sm mt-1">{errorBis}</p>
        )}
      </fieldset>
    </div>
  );
}
