export const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes dot {
  0%,80%,100% { transform: scale(0.4); opacity: 0.3; }
  40%          { transform: scale(1);   opacity: 1;   }
}

.loading-screen {
  min-height: 100vh; background: #f5f3ef;
  display: flex; align-items: center; justify-content: center;
}
.dots { display: flex; gap: 6px; }
.dots span {
  width: 9px; height: 9px; border-radius: 50%; background: #94a3b8;
  animation: dot 1.4s ease-in-out infinite;
}
.dots span:nth-child(2) { animation-delay: .2s; }
.dots span:nth-child(3) { animation-delay: .4s; }

.root { min-height: 100vh; background: #f5f3ef; }

/* Header */
.header {
  position: sticky; top: 0; z-index: 30;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.07);
  padding: 0 24px; height: 62px;
  display: flex; align-items: center; gap: 18px;
}
.header-brand { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.header-title { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -.025em; }
.header-badge {
  font-size: 10px; font-weight: 800; letter-spacing: .1em;
  background: #3b82f6; color: white; border-radius: 5px; padding: 2px 8px;
}
.metrics { display: flex; gap: 8px; }
.metric {
  display: flex; flex-direction: column; gap: 1px;
  padding: 5px 12px; border-radius: 9px;
  border: 1px solid rgba(0,0,0,0.05);
}
.metric-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 600; }
.metric-value { font-size: 13.5px; font-weight: 700; }
.header-actions { margin-left: auto; display: flex; gap: 8px; }
.btn-ghost {
  font-size: 12.5px; font-family: inherit; cursor: pointer;
  border: 1px solid #e2e8f0; border-radius: 9px;
  padding: 6px 14px; background: white; color: #475569;
  transition: background .15s, border-color .15s, transform .1s;
}
.btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }

/* Tabs de navegacao */
.nav-tabs {
  display: flex; gap: 4px; padding: 14px 24px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.6);
  overflow-x: auto;
}
.nav-tab {
  font-size: 13px; font-weight: 600; font-family: inherit;
  padding: 9px 16px 11px; color: #94a3b8; cursor: pointer;
  background: none; border: none; border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color .15s, border-color .15s;
}
.nav-tab:hover { color: #475569; }
.nav-tab--on { color: #0f172a; border-bottom-color: #0f172a; }
.nav-tab .n {
  font-size: 10px; font-weight: 700; margin-left: 6px;
  background: #f1f5f9; color: #64748b; border-radius: 10px; padding: 1px 7px;
}

/* Board */
.board-scroll { overflow-x: auto; padding: 24px 20px 52px; }
.board { display: flex; gap: 14px; min-width: max-content; align-items: flex-start; }

/* Column */
.column { width: 276px; flex-shrink: 0; }
.col-header {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 11px; padding: 0 2px;
}
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-label { font-size: 10.5px; font-weight: 700; letter-spacing: .09em; color: #475569; flex: 1; }
.col-count { font-size: 11px; font-weight: 700; border-radius: 20px; padding: 1px 9px; }

/* Cards */
.cards { display: flex; flex-direction: column; gap: 9px; }
.card {
  background: white;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 13px;
  padding: 13px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 8px rgba(0,0,0,0.03);
  animation: fadeUp .3s ease both;
  transition: transform .18s ease, box-shadow .18s ease;
  cursor: default;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05);
}
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.card-name { font-size: 13px; font-weight: 500; color: #0f172a; line-height: 1.4; }

.badge {
  font-size: 9px; font-weight: 700; letter-spacing: .07em;
  border-radius: 4px; padding: 2px 6px; white-space: nowrap; flex-shrink: 0;
}
.badge--green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

.tags { display: flex; gap: 5px; margin-top: 7px; flex-wrap: wrap; }
.tag { font-size: 10px; font-weight: 500; border-radius: 5px; padding: 2px 7px; }
.tag--muted { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }

.pills { display: flex; gap: 6px; margin-top: 9px; flex-wrap: wrap; }
.pill {
  display: inline-flex; align-items: center;
  font-size: 11px; font-family: inherit;
  border: 1px solid #e2e8f0; border-radius: 7px;
  padding: 3px 10px; background: #f8fafc; color: #64748b;
  text-decoration: none; cursor: default;
  transition: background .14s, border-color .14s;
}
a.pill, button.pill, .pill--btn { cursor: pointer; }
a.pill:hover, .pill--btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.pill--dark { background: #0f172a; color: white; border-color: #0f172a; font-weight: 600; }
.pill--dark:hover { background: #1e293b !important; }
.pill--green { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.pill--green:hover { background: #dcfce7 !important; }
.pill--blue { color: #2563eb; border-color: #bfdbfe; }
.pill--blue:hover { background: #eff6ff !important; }
.pill--paid { color: #15803d; border-color: #bbf7d0; background: #f0fdf4; }
.pill--danger { color: #dc2626; border-color: #fecaca; }
.pill--danger:hover { background: #fef2f2 !important; }
.pill--danger:disabled { opacity: .4; cursor: default; }

.card-footer {
  display: flex; align-items: center; gap: 6px;
  margin-top: 9px; padding-top: 9px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.s-select {
  flex: 1; font-size: 11px; font-family: inherit;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px;
  padding: 4px 6px; color: #475569; outline: none; cursor: pointer;
  transition: border-color .15s;
}
.s-select:focus { border-color: #3b82f6; }

.empty {
  font-size: 12px; color: #cbd5e1;
  padding: 22px; text-align: center;
  border: 1.5px dashed #e2e8f0; border-radius: 12px;
  background: rgba(255,255,255,0.55);
}

/* Modal */
.overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(15,23,42,0.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
  backdrop-filter: blur(5px);
  animation: fadeIn .2s ease;
}
.modal {
  background: white; border: 1px solid rgba(0,0,0,0.07);
  border-radius: 18px; width: 100%; max-width: 640px;
  max-height: 88vh; overflow: auto;
  box-shadow: 0 32px 64px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.07);
  animation: fadeUp .2s ease;
}
.modal-head {
  position: sticky; top: 0; background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 15px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.modal-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.modal-sub   { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.modal-body  { padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }

.label-xs {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: #94a3b8; margin-bottom: 6px;
}
.email-pre {
  font-size: 13px; font-family: inherit; white-space: pre-wrap;
  line-height: 1.7; color: #374151;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 14px 16px;
}

/* ── Dashboard ── */
.dash { padding: 24px; max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.kpi {
  background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px;
  padding: 16px 18px; animation: fadeUp .3s ease both;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.kpi-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; }
.kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px; letter-spacing: -.02em; }
.kpi-sub { font-size: 11.5px; color: #94a3b8; margin-top: 3px; }
.kpi-sub b { color: #16a34a; font-weight: 700; }
.kpi-sub .down { color: #dc2626; font-weight: 700; }

.panel {
  background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px;
  padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  animation: fadeUp .3s ease both;
}
.panel-title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.panel-sub { font-size: 12px; color: #94a3b8; margin-bottom: 14px; }

.funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.funnel-label { font-size: 11.5px; font-weight: 600; color: #475569; width: 110px; flex-shrink: 0; }
.funnel-bar-wrap { flex: 1; height: 22px; background: #f8fafc; border-radius: 6px; overflow: hidden; position: relative; }
.funnel-bar { height: 100%; border-radius: 6px; transition: width .5s ease; }
.funnel-nums { font-size: 11px; font-weight: 700; color: #334155; width: 120px; text-align: right; flex-shrink: 0; }
.funnel-nums .pct { color: #94a3b8; font-weight: 600; }

.table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.table th {
  text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: #94a3b8; padding: 8px 10px; border-bottom: 1px solid #f1f5f9;
}
.table td { padding: 9px 10px; border-bottom: 1px solid #f8fafc; color: #334155; }
.table tr:hover td { background: #fafaf9; }
.table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }

.alerta {
  display: flex; gap: 10px; align-items: flex-start;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
  padding: 12px 16px; font-size: 12.5px; color: #92400e; line-height: 1.6;
}
.alerta--red { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.alerta--green { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }

.textarea, .input {
  width: 100%; font-size: 13px; font-family: inherit;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 10px 12px; color: #0f172a; outline: none; resize: vertical;
  transition: border-color .15s, background .15s;
}
.textarea:focus, .input:focus { border-color: #3b82f6; background: white; }
.btn-primary {
  font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
  background: #0f172a; color: white; border: none; border-radius: 10px;
  padding: 10px 20px; transition: background .15s, transform .1s;
}
.btn-primary:hover { background: #1e293b; transform: translateY(-1px); }
.btn-primary:disabled { opacity: .5; cursor: default; transform: none; }

/* ── Client page ── */
.cp-root { min-height: 100vh; background: #f5f3ef; }
.cp-wrap { max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }
.cp-brand { font-size: 13px; font-weight: 800; letter-spacing: .12em; color: #94a3b8; text-transform: uppercase; }
.cp-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -.03em; margin-top: 10px; line-height: 1.2; }
.cp-sub { font-size: 15px; color: #64748b; margin-top: 8px; line-height: 1.6; }
.cp-shot {
  width: 100%; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 20px 50px rgba(0,0,0,0.12); margin-top: 24px; display: block;
}
.cp-section { margin-top: 36px; }
.cp-h2 { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
.cp-p { font-size: 13.5px; color: #64748b; line-height: 1.65; margin-bottom: 14px; }
.cp-field { margin-bottom: 14px; }
.cp-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
.cp-pay {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px;
}
@media (max-width: 560px) { .cp-pay { grid-template-columns: 1fr; } }
.cp-plan {
  background: white; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 16px;
  padding: 20px; display: flex; flex-direction: column; gap: 8px;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.cp-plan:hover { border-color: #0f172a; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
.cp-plan--hi { border-color: #0f172a; }
.cp-plan-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748b; }
.cp-plan-price { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -.02em; }
.cp-plan-price small { font-size: 13px; font-weight: 600; color: #94a3b8; }
.cp-plan-desc { font-size: 12.5px; color: #64748b; line-height: 1.55; flex: 1; }
.cp-plan-btn {
  display: block; text-align: center; text-decoration: none;
  font-size: 13.5px; font-weight: 700; font-family: inherit; cursor: pointer;
  background: #0f172a; color: white; border: none; border-radius: 10px;
  padding: 11px 16px; margin-top: 6px; transition: background .15s;
}
.cp-plan-btn:hover { background: #1e293b; }
.cp-ok {
  background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;
  border-radius: 12px; padding: 14px 18px; font-size: 13.5px; line-height: 1.6;
}
.cp-file {
  border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 18px;
  text-align: center; font-size: 12.5px; color: #64748b; cursor: pointer;
  transition: border-color .15s, background .15s; background: rgba(255,255,255,0.6);
}
.cp-file:hover { border-color: #3b82f6; background: #eff6ff; }
.cp-anexos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.cp-req {
  background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px;
  padding: 14px 16px; margin-bottom: 10px;
}
.cp-req-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
.cp-req-title { font-size: 13.5px; font-weight: 600; color: #0f172a; }
.cp-req-desc { font-size: 12.5px; color: #64748b; margin-top: 6px; line-height: 1.55; white-space: pre-wrap; }
.cp-req-resp { font-size: 12.5px; color: #166534; background: #f0fdf4; border-radius: 8px; padding: 8px 12px; margin-top: 8px; }
.cp-lang { position: absolute; top: 20px; right: 20px; display: flex; gap: 4px; }
.cp-lang button {
  font-size: 11px; font-weight: 700; font-family: inherit; cursor: pointer;
  border: 1px solid #e2e8f0; background: white; color: #64748b;
  border-radius: 7px; padding: 4px 9px;
}
.cp-lang button.on { background: #0f172a; color: white; border-color: #0f172a; }
`;
