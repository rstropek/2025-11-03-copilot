'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { importProducts, type ImportProductsState } from '@/lib/product-actions';

const initialState: ImportProductsState = {
  success: null,
  message: null,
  importedCount: 0,
};

export function ProductImport() {
  const [state, formAction] = useFormState(importProducts, initialState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success !== null && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [state.success]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = () => {
    if (fileInputRef.current?.files?.length) {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end" aria-live="polite">
      <form
        ref={formRef}
        action={formAction}
        encType="multipart/form-data"
        className="flex items-center justify-end"
      >
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <ImportButton onClick={handleButtonClick} />
      </form>
      {state.message ? (
        <p
          className={`text-sm ${
            state.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function ImportButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
    >
      {pending ? 'Importing...' : 'Import'}
    </button>
  );
}
