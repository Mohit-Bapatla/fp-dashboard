import { getCurrentDemoAccount } from "@/lib/demo/demo-users";

export async function DemoModeBanner() {
  const demoAccount = await getCurrentDemoAccount();

  if (!demoAccount) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">Demo mode</p>
        <p>
          You are viewing clearly fake demo data for{" "}
          <span className="font-medium">{demoAccount.email}</span>. Demo mode
          never bypasses authentication or role permissions.
        </p>
      </div>
    </div>
  );
}
