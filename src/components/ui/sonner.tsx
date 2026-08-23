import { Toaster as SonnerToaster } from 'sonner'

/** Application-wide shadcn Sonner toast host. */

function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      className="w-[86%]! min-[400px]:w-130!"
      toastOptions={{
        classNames: {
          toast: 'w-full! text-xl!',
          description: 'text-sm! sm:text-base!',
        },
      }}
    />
  )
}

export { Toaster }