interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'font-semibold rounded-xl transition-opacity disabled:opacity-50';
  const variants = {
    primary: 'bg-earth text-cream hover:opacity-90',
    outline: 'border-2 border-earth text-earth hover:bg-earth hover:text-cream',
    ghost: 'text-earth-light hover:text-earth',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'w-full py-3 text-base' };
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
