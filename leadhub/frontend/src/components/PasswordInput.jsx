import { useState } from 'react';

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  minLength,
  hint,
  id,
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="text-xs font-bold text-amber-400 uppercase tracking-wider block">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-400 font-mono focus:border-amber-500 outline-none transition-colors ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 p-1 focus:outline-none transition-colors"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a13.16 13.16 0 0 1-1.670 2.677" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.3 13.3 0 0 1-4.27 4.7" />
              <path d="M6.3 6.3a13.18 13.18 0 0 0-5.3 5.7s3 7 10 7a9.27 9.27 0 0 0 4.14-.94" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-300 font-medium mt-1">{hint}</p>}
    </div>
  );
}
