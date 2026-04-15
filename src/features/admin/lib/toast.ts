import { toast as sonnerToast } from "sonner"

type ToastOptions = Parameters<typeof sonnerToast>[1]

const POS = { position: "bottom-right" } as const

export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    sonnerToast.success(message, { ...POS, ...opts }),
  error: (message: string, opts?: ToastOptions) =>
    sonnerToast.error(message, { ...POS, ...opts }),
  info: (message: string, opts?: ToastOptions) =>
    sonnerToast.info(message, { ...POS, ...opts }),
  warning: (message: string, opts?: ToastOptions) =>
    sonnerToast.warning(message, { ...POS, ...opts }),
}
