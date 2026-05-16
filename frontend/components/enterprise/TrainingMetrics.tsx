"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const HISTORY = [
  { epoch:1,  acc:0.761, val_acc:0.877, loss:0.617, val_loss:0.355 },
  { epoch:2,  acc:0.881, val_acc:0.900, loss:0.357, val_loss:0.291 },
  { epoch:3,  acc:0.902, val_acc:0.911, loss:0.297, val_loss:0.261 },
  { epoch:4,  acc:0.904, val_acc:0.921, loss:0.283, val_loss:0.229 },
  { epoch:5,  acc:0.913, val_acc:0.921, loss:0.254, val_loss:0.245 },
  { epoch:6,  acc:0.916, val_acc:0.920, loss:0.249, val_loss:0.245 },
  { epoch:7,  acc:0.921, val_acc:0.926, loss:0.225, val_loss:0.236 },
  { epoch:8,  acc:0.931, val_acc:0.929, loss:0.190, val_loss:0.200 },
  { epoch:9,  acc:0.937, val_acc:0.928, loss:0.171, val_loss:0.202 },
  { epoch:10, acc:0.940, val_acc:0.925, loss:0.159, val_loss:0.205 },
  { epoch:11, acc:0.946, val_acc:0.935, loss:0.148, val_loss:0.181 },
  { epoch:12, acc:0.952, val_acc:0.932, loss:0.128, val_loss:0.194 },
  { epoch:13, acc:0.954, val_acc:0.940, loss:0.123, val_loss:0.187 },
  { epoch:14, acc:0.959, val_acc:0.936, loss:0.107, val_loss:0.195 },
  { epoch:15, acc:0.970, val_acc:0.935, loss:0.082, val_loss:0.208 },
  { epoch:16, acc:0.975, val_acc:0.938, loss:0.070, val_loss:0.211 },
  { epoch:17, acc:0.975, val_acc:0.933, loss:0.064, val_loss:0.266 },
  { epoch:18, acc:0.979, val_acc:0.938, loss:0.054, val_loss:0.210 },
];

export function TrainingMetrics() {
  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Training Metrics</h3>
        <span className="badge bg-brand-100 text-brand-700 border-brand-200 text-xs">18 epochs · EarlyStopping</span>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "rgb(var(--text-muted))" }}>Accuracy</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={HISTORY} margin={{ top:5, right:5, left:-25, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="epoch" tick={{ fontSize:9, fill:"#9ca3af" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize:9, fill:"#9ca3af" }} tickLine={false} axisLine={false} domain={[0.7,1]} tickFormatter={v=>`${(v*100).toFixed(0)}%`} />
            <Tooltip contentStyle={{ fontSize:"11px", borderRadius:"8px", background:"rgba(15,23,42,0.95)", border:"1px solid rgba(99,102,241,0.2)", color:"#e2e8f0" }} formatter={(v:number)=>[`${(v*100).toFixed(1)}%`]} />
            <Legend wrapperStyle={{ fontSize:"10px" }} iconType="circle" iconSize={7} />
            <Line type="monotone" dataKey="acc" name="Train Acc" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="val_acc" name="Val Acc" stroke="#06b6d4" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "rgb(var(--text-muted))" }}>Loss</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={HISTORY} margin={{ top:5, right:5, left:-25, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="epoch" tick={{ fontSize:9, fill:"#9ca3af" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize:9, fill:"#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize:"11px", borderRadius:"8px", background:"rgba(15,23,42,0.95)", border:"1px solid rgba(99,102,241,0.2)", color:"#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize:"10px" }} iconType="circle" iconSize={7} />
            <Line type="monotone" dataKey="loss" name="Train Loss" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}