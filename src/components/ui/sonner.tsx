import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm popup-slide-in",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toast]:border-success/20 group-[.toast]:bg-success/5",
          error: "group-[.toast]:border-destructive/20 group-[.toast]:bg-destructive/5",
          warning: "group-[.toast]:border-warning/20 group-[.toast]:bg-warning/5",
          info: "group-[.toast]:border-info/20 group-[.toast]:bg-info/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
