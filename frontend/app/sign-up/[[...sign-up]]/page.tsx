import { SignUp } from "@clerk/nextjs";
import { Droplets } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8f9fc" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Digital Stethoscope</p>
            <p className="text-indigo-200 text-xs mt-0.5">Leak Detection AI</p>
          </div>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Start detecting<br />leaks today.
          </h1>
          <p className="text-indigo-200 text-lg">
            Deploy your first sensor in 30 minutes. Free to start, no credit card required.
          </p>
          <ul className="space-y-2">
            {[
              "Real-time acoustic monitoring",
              "ML-powered 4-class leak detection",
              "Instant push notifications",
              "Multi-zone pipe management",
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-indigo-100 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-indigo-300 text-sm">
          Built for Unisys Innovation Program 2026
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-gray-900 text-lg">Digital Stethoscope</p>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h2>
            <p className="text-gray-500 text-sm">Get started with leak detection</p>
          </div>

          <SignUp
            appearance={{
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
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
