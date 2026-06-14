import { LoaderCircle } from "lucide-react";

type InlineSpinnerProps = {
  className?: string;
};

export function InlineSpinner({ className = "h-4 w-4" }: InlineSpinnerProps) {
  return <LoaderCircle className={`${className} animate-spin`} aria-hidden="true" />;
}
