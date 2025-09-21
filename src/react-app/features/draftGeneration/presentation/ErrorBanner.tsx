export type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}
