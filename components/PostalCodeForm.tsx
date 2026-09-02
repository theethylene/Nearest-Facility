'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { validatePostalCode } from '@/lib/validatePostalCode';

type PostalCodeFormProps = {
  onSearch: (postalCode: string) => void;
  loading: boolean;
  errorMessage: string | null;
};

export default function PostalCodeForm({ onSearch, loading, errorMessage }: PostalCodeFormProps) {
  const [value, setValue] = useState('');
  const [formatError, setFormatError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Keep only digits, cap at 6 characters, so the field can never hold
    // something the validator would reject on shape alone.
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setValue(digitsOnly);
    if (formatError) setFormatError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validatePostalCode(value);
    if (!result.valid) {
      setFormatError(result.reason);
      return;
    }

    setFormatError(null);
    onSearch(result.value);
  };

  const displayedError = formatError ?? errorMessage;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="postalCode">Singapore postal code</label>
      <div className="input-row">
        <input
          id="postalCode"
          name="postalCode"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="e.g. 520610"
          maxLength={6}
          value={value}
          onChange={handleChange}
          aria-invalid={displayedError ? 'true' : 'false'}
          aria-describedby={displayedError ? 'postalCode-error' : undefined}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Find nearest post'}
        </button>
      </div>

      {/* aria-live announces validation and lookup errors to screen readers
          as soon as they appear, without moving keyboard focus. */}
      <p id="postalCode-error" className="error-message" role="status" aria-live="polite">
        {displayedError ?? ''}
      </p>
    </form>
  );
}
