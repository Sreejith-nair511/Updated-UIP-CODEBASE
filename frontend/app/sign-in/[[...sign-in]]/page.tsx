import { SignIn } from "@clerk/nextjs";
import { Droplets, Waves } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8f9fc" }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Digital Stethoscope</p>
            <p className="text-indigo-200 text-xs mt-0.5">Leak Detection AI</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Listen to your<br />pipes. Save water.
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              AI-powered acoustic leak detection for water infrastructure.
              Real-time monitoring, instant alerts.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "93.6%", label: "ML Accuracy" },
              { value: "<200ms", label: "Inference" },
              { value: "4-Class", label: "Detection" },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-white text-xl font-bold">{s.value}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-indigo-300 text-sm">
            Built for Unisys Innovation Program 2026
          </p>
        </div>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">Digital Stethoscope</p>
            <p className="text-gray-500 text-xs mt-0.5">Leak Detection AI</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your dashboard</p>
          </div>

          <SignIn
            appearance={{
              layout: {
                showOptionalFields: false,
                socialButtonsVariant: "blockButton",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 text-xs",
                formFieldLabel: "text-xs font-semibold text-gray-600 uppercase tracking-wide",
                formFieldInput:
                  "rounded-xl border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all",
                formButtonPrimary:
                  "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-indigo-500/30",
                footerActionLink: "text-indigo-600 hover:text-indigo-700 font-semibold",
                footerActionText: "text-gray-500 text-sm",
                identityPreviewText: "text-gray-700",
                identityPreviewEditButton: "text-indigo-600",
                formResendCodeLink: "text-indigo-600",
                otpCodeFieldInput: "rounded-xl border-gray-200 text-gray-900",
                alertText: "text-red-600 text-sm",
                formFieldErrorText: "text-red-500 text-xs",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
