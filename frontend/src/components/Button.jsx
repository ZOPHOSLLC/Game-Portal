const VARIANTS = {
  primary: 'bg-cyan text-ink shadow-sm hover:brightness-110',
  secondary: 'border border-line bg-surface text-fg hover:bg-surface-hover',
  ghost: 'text-muted hover:bg-surface hover:text-fg',
  danger: 'border border-line bg-surface text-red-400 hover:bg-red-500/10',
};

// md = 40px tall (default), sm = 32px tall. Same padding ratio at both sizes.
const SIZES = {
  md: 'h-10 px-4 text-sm leading-5',
  sm: 'h-8 px-3 text-xs leading-4',
};

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:pointer-events-none disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
