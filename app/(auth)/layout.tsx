export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F4] px-4 py-12">
      {children}
    </div>
  );
}
