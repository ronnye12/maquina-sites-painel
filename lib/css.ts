export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scrollbar-gutter:stable}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{color:inherit}
button{font-family:inherit}

@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{transform:translateX(-12px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes dot{0%,80%,100%{transform:scale(.45);opacity:.35}40%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}

.loading-screen{min-height:100vh;background:#f8fafc;display:flex;align-items:center;justify-content:center}
.dots{display:flex;gap:7px}
.dots span{width:10px;height:10px;border-radius:50%;background:#94a3b8;animation:dot 1.4s ease-in-out infinite}
.dots span:nth-child(2){animation-delay:.2s}
.dots span:nth-child(3){animation-delay:.4s}

/* ── App shell + Sidebar (Linear/Attio inspired) ── */
.app-shell{display:flex;min-height:100vh;background:#f8fafc}
.sidebar{
  width:268px;flex-shrink:0;
  background:linear-gradient(180deg,#0f172a 0%,#0b1222 55%,#0f172a 100%);
  border-right:1px solid rgba(255,255,255,.06);
  position:sticky;top:0;height:100vh;height:100dvh;
  display:flex;flex-direction:column;z-index:40;overflow:hidden;
}
.sidebar-brand{
  padding:20px 18px 16px;display:flex;align-items:center;gap:12px;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.sidebar-logo{
  width:36px;height:36px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,#3b82f6 0%,#2563eb 55%,#1d4ed8 100%);
  display:flex;align-items:center;justify-content:center;
  color:white;font-weight:800;font-size:13px;letter-spacing:-.04em;
  box-shadow:0 6px 18px rgba(37,99,235,.35), inset 0 1px 0 rgba(255,255,255,.18);
}
.sidebar-title{font-size:14px;font-weight:800;color:#f8fafc;letter-spacing:-.02em;line-height:1}
.sidebar-sub{font-size:11px;color:#64748b;font-weight:500;margin-top:2px}
.sidebar-nav{flex:1;overflow-y:auto;padding:16px 10px 14px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}
.sidebar-nav::-webkit-scrollbar{width:6px}
.sidebar-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:10px}
.sidebar-section{
  font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:#475569;margin:18px 10px 8px;
}
.sidebar-section:first-child{margin-top:4px}
.sidebar-item{
  width:100%;display:flex;align-items:center;gap:10px;
  padding:9px 10px;border-radius:10px;
  font-size:13px;font-weight:550;color:#94a3b8;
  background:transparent;border:1px solid transparent;cursor:pointer;text-align:left;
  transition:all .15s ease;position:relative;
}
.sidebar-item:hover{background:rgba(255,255,255,.06);color:#e2e8f0;border-color:rgba(255,255,255,.04);transform:translateX(1px)}
.sidebar-item--on{
  background:rgba(59,130,246,.14);color:#dbeafe;border-color:rgba(59,130,246,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 4px 14px rgba(37,99,235,.18);
}
.sidebar-item--on::before{
  content:'';position:absolute;left:-10px;top:50%;transform:translateY(-50%);
  width:3px;height:18px;border-radius:999px;background:#3b82f6;
}
.sidebar-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 3px currentColor;opacity:.95}
.sidebar-count{
  margin-left:auto;font-size:11px;font-weight:700;min-width:22px;text-align:center;
  padding:2px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.06);color:#cbd5e1;
}
.sidebar-item--on .sidebar-count{background:rgba(59,130,246,.22);border-color:rgba(59,130,246,.28);color:#bfdbfe}
.sidebar-foot{
  padding:14px;border-top:1px solid rgba(255,255,255,.06);
  display:flex;gap:8px;align-items:center;
}
.sidebar-foot-note{font-size:11px;color:#64748b;line-height:1.4}
.sidebar-foot b{color:#cbd5e1;font-weight:700}
.btn-sidebar-ghost{
  width:100%;font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:9px;
  border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#cbd5e1;cursor:pointer;
  transition:all .15s;
}
.btn-sidebar-ghost:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:white}

.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{
  position:sticky;top:0;z-index:30;
  background:rgba(255,255,255,.84);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);
  border-bottom:1px solid #e2e8f0;
  padding:14px 28px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;
}
.topbar-left{flex:1;min-width:220px;display:flex;flex-direction:column;gap:3px}
.topbar-title{font-size:18px;font-weight:800;letter-spacing:-.025em;color:#0f172a;line-height:1.1;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.topbar-sub{font-size:12.5px;color:#64748b;font-weight:500;line-height:1.4}
.topbar-badge{
  font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  padding:4px 8px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;
}
.topbar-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hamburger{
  display:none;width:38px;height:38px;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#0f172a;
  align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 2px rgba(15,23,42,.05)
}
.hamburger span{width:16px;height:2px;background:currentColor;border-radius:999px;display:block;position:relative}
.hamburger span::before,.hamburger span::after{content:'';position:absolute;left:0;width:16px;height:2px;background:currentColor;border-radius:999px}
.hamburger span::before{top:-5px}
.hamburger span::after{top:5px}
.content{padding:24px 28px 40px;max-width:1440px;width:100%;margin:0 auto;flex:1}
.content-wide{max-width:none}

/* Legacy .root/.header kept for compatibility */
.root{min-height:100vh;background:#f8fafc}
.header{
  position:sticky;top:0;z-index:30;background:rgba(255,255,255,0.92);
  backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);
  border-bottom:1px solid #e2e8f0;padding:0 28px;height:64px;
  display:flex;align-items:center;gap:20px;box-shadow:0 1px 3px rgba(15,23,42,0.04);
}
.header-brand{display:flex;align-items:center;gap:10px;flex-shrink:0}
.header-title{font-size:15.5px;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1}
.header-badge{font-size:9px;font-weight:800;letter-spacing:.11em;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border-radius:6px;padding:3px 8px;box-shadow:0 1px 4px rgba(37,99,235,0.3)}
.metrics{display:flex;gap:8px;align-items:center}
.metric{display:flex;flex-direction:column;gap:1px;padding:6px 14px;border-radius:10px;border:1px solid #e2e8f0;background:white;box-shadow:0 1px 2px rgba(15,23,42,0.04);min-width:110px}
.metric-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;font-weight:700}
.metric-value{font-size:14px;font-weight:800;letter-spacing:-.02em;line-height:1.3}
.header-actions{margin-left:auto;display:flex;gap:8px;align-items:center}
.btn-ghost{
  font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;
  border:1px solid #e2e8f0;border-radius:10px;padding:7px 14px;background:white;color:#475569;
  transition:all .15s ease;box-shadow:0 1px 2px rgba(15,23,42,0.04);
}
.btn-ghost:hover{background:#f8fafc;border-color:#cbd5e1;color:#0f172a;transform:translateY(-1px);box-shadow:0 2px 6px rgba(15,23,42,0.06)}
.btn-ghost:active{transform:translateY(0)}
.btn-ghost--primary{background:#0f172a;color:white;border-color:#0f172a;box-shadow:0 4px 12px rgba(15,23,42,.14)}
.btn-ghost--primary:hover{background:#1e293b;border-color:#1e293b;color:white}

/* Top metric strip (new premium) */
.metric-strip{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.metric-chip{
  display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;
  background:white;border:1px solid #e2e8f0;box-shadow:0 1px 2px rgba(15,23,42,.04);
  min-width:148px;
}
.metric-chip-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.metric-chip-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8}
.metric-chip-value{font-size:13px;font-weight:800;letter-spacing:-.02em;color:#0f172a;line-height:1}

/* Tabs fallback (when still rendered) */
.nav-tabs{display:flex;gap:2px;padding:0 28px;border-bottom:1px solid #e2e8f0;background:white;overflow-x:auto;scrollbar-width:none}
.nav-tabs::-webkit-scrollbar{display:none}
.nav-tab{font-size:13px;font-weight:600;font-family:inherit;padding:14px 16px 13px;color:#64748b;cursor:pointer;background:none;border:none;border-bottom:2.5px solid transparent;white-space:nowrap;position:relative;transition:color .15s,border-color .15s;margin-bottom:-1px}
.nav-tab:hover{color:#334155}
.nav-tab--on{color:#0f172a;border-bottom-color:#2563eb;font-weight:700}
.nav-tab .n{font-size:10px;font-weight:700;margin-left:7px;background:#f1f5f9;color:#64748b;border-radius:20px;padding:2px 8px;border:1px solid #e2e8f0;transition:all .15s}
.nav-tab--on .n{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}

/* ── Board / Kanban ── */
.board-scroll{overflow-x:auto;padding:18px 0 36px;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
.board-scroll::-webkit-scrollbar{height:6px}
.board-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
.board{display:flex;gap:14px;min-width:max-content;align-items:flex-start}
.column{
  width:296px;flex-shrink:0;
  background:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;
  padding:10px 10px 12px;box-shadow:0 1px 2px rgba(15,23,42,.04);
}
.col-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 6px 8px;border-bottom:1px solid #e2e8f0}
.col-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 4px currentColor;opacity:.9}
.col-label{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:#334155;flex:1;text-transform:uppercase}
.col-count{
  font-size:11px;font-weight:800;border-radius:999px;padding:2px 9px;
  border:1px solid transparent;min-width:26px;text-align:center;
}
.cards{display:flex;flex-direction:column;gap:10px;min-height:40px}
.card{
  background:white;border:1px solid #e2e8f0;border-radius:14px;padding:13px 13px 11px;
  box-shadow:0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
  animation:fadeUp .32s ease both;
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
  cursor:default;position:relative;overflow:hidden;
}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent}
.card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.06);border-color:#cbd5e1}
.card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.card-name{font-size:13.5px;font-weight:650;color:#0f172a;line-height:1.35;letter-spacing:-.01em}
.badge{font-size:9px;font-weight:800;letter-spacing:.07em;border-radius:999px;padding:3px 7px;white-space:nowrap;flex-shrink:0}
.badge--green{background:#dcfce7;color:#15803d;border:1px solid #bbf7d0}
.tags{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
.tag{font-size:10px;font-weight:650;border-radius:999px;padding:3px 8px;letter-spacing:.01em;border:1px solid transparent}
.tag--muted{background:#f8fafc;color:#94a3b8;border-color:#e2e8f0}
.pills{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.pill{
  display:inline-flex;align-items:center;gap:4px;
  font-size:11px;font-weight:600;font-family:inherit;
  border:1px solid #e2e8f0;border-radius:999px;
  padding:5px 10px;background:#f8fafc;color:#475569;
  text-decoration:none;cursor:default;line-height:1;transition:all .14s ease;
}
a.pill,button.pill,.pill--btn{cursor:pointer}
a.pill:hover,.pill--btn:hover{background:white;border-color:#cbd5e1;color:#334155;box-shadow:0 1px 3px rgba(15,23,42,0.06)}
.pill--dark{background:#0f172a;color:white;border-color:#0f172a;font-weight:700}
.pill--dark:hover{background:#1e293b !important;border-color:#1e293b !important;color:white !important}
.pill--green{background:#f0fdf4;color:#16a34a;border-color:#bbf7d0}
.pill--green:hover{background:#dcfce7 !important}
.pill--blue{color:#2563eb;border-color:#bfdbfe;background:#eff6ff}
.pill--blue:hover{background:#dbeafe !important;border-color:#93c5fd !important}
.pill--paid{color:#15803d;border-color:#bbf7d0;background:#f0fdf4}
.pill--danger{color:#dc2626;border-color:#fecaca;background:#fef2f2}
.pill--danger:hover{background:#fee2e2 !important;border-color:#fca5a5 !important}
.pill--danger:disabled{opacity:.4;cursor:default}
.card-footer{display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;flex-wrap:wrap}
.s-select{
  flex:1;font-size:11px;font-weight:600;font-family:inherit;
  background:white;border:1px solid #e2e8f0;border-radius:999px;
  padding:6px 10px;color:#475569;outline:none;cursor:pointer;
  transition:border-color .15s,box-shadow .15s;
}
.s-select:hover{border-color:#cbd5e1}
.s-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
.empty{
  font-size:12.5px;font-weight:500;color:#94a3b8;
  padding:22px 16px;text-align:center;
  border:1.5px dashed #e2e8f0;border-radius:14px;background:white;
}
.empty-state{
  padding:28px 18px;text-align:center;border:1.5px dashed #e2e8f0;border-radius:16px;background:white;
  display:flex;flex-direction:column;align-items:center;gap:10px;
}
.empty-state-icon{
  width:40px;height:40px;border-radius:12px;background:#f1f5f9;border:1px solid #e2e8f0;
  display:flex;align-items:center;justify-content:center;color:#94a3b8;font-weight:800;
}
.empty-state-title{font-size:13px;font-weight:700;color:#0f172a}
.empty-state-sub{font-size:12.5px;color:#64748b;max-width:520px;line-height:1.55}

/* ── Modal ── */
.overlay{
  position:fixed;inset:0;z-index:50;
  background:rgba(15,23,42,0.5);
  display:flex;align-items:center;justify-content:center;padding:20px;
  backdrop-filter:blur(8px);animation:fadeIn .2s ease;
}
.modal{
  background:white;border:1px solid #e2e8f0;
  border-radius:20px;width:100%;max-width:680px;
  max-height:88vh;overflow:auto;
  box-shadow:0 24px 48px rgba(15,23,42,0.16), 0 8px 16px rgba(15,23,42,0.08);
  animation:fadeUp .25s ease;
}
.modal-head{
  position:sticky;top:0;background:white;
  border-bottom:1px solid #f1f5f9;
  padding:18px 22px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
}
.modal-title{font-size:15px;font-weight:750;color:#0f172a;letter-spacing:-.01em}
.modal-sub{font-size:12px;color:#94a3b8;margin-top:2px}
.modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:16px}
.label-xs{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px}
.email-pre{
  font-size:13px;font-family:inherit;white-space:pre-wrap;
  line-height:1.7;color:#334155;
  background:#f8fafc;border:1px solid #e2e8f0;
  border-radius:12px;padding:16px 18px;
}

/* ── Dashboard ── */
.dash{padding:0;display:flex;flex-direction:column;gap:18px}
.dash-grid{display:grid;grid-template-columns:repeat(4, minmax(0,1fr));gap:14px}
@media (max-width:1200px){.dash-grid{grid-template-columns:repeat(2, minmax(0,1fr))}}
@media (max-width:560px){.dash-grid{grid-template-columns:1fr}}

.kpi{
  background:white;border:1px solid #e2e8f0;border-radius:16px;
  padding:16px 16px 14px;animation:fadeUp .35s ease both;
  box-shadow:0 1px 3px rgba(15,23,42,0.05);
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
  position:relative;overflow:hidden;
}
.kpi::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,#3b82f6,#06b6d4 55%,#10b981);
  opacity:0;transition:opacity .2s;
}
.kpi:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,0.07);border-color:#e2e8f0}
.kpi:hover::before{opacity:1}
.kpi-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.kpi-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;letter-spacing:-.02em;border:1px solid #e2e8f0;background:#f8fafc;color:#334155}
.kpi-trend{font-size:11px;font-weight:750;padding:3px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b}
.kpi-trend--up{background:#f0fdf4;border-color:#bbf7d0;color:#15803d}
.kpi-trend--down{background:#fef2f2;border-color:#fecaca;color:#dc2626}
.kpi-label{font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}
.kpi-value{font-size:26px;font-weight:850;color:#0f172a;margin-top:2px;letter-spacing:-.03em;line-height:1}
.kpi-sub{font-size:11.5px;color:#94a3b8;margin-top:6px;font-weight:500;line-height:1.4}
.kpi-sub b{color:#16a34a;font-weight:800}
.kpi-sub .down{color:#dc2626;font-weight:800}

.panel{
  background:white;border:1px solid #e2e8f0;border-radius:16px;
  padding:18px 18px 16px;box-shadow:0 1px 3px rgba(15,23,42,0.05);
  animation:fadeUp .35s ease both;
}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.panel-title{font-size:14px;font-weight:800;color:#0f172a;letter-spacing:-.015em;line-height:1.2}
.panel-sub{font-size:12.5px;color:#94a3b8;line-height:1.5;margin-top:3px}
.panel-cta{font-size:12px;font-weight:650;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:6px 10px;cursor:pointer;white-space:nowrap}
.panel-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:900px){.panel-grid2{grid-template-columns:1fr}}

.funnel-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.funnel-row:last-child{margin-bottom:0}
.funnel-label{font-size:11.5px;font-weight:650;color:#475569;width:108px;flex-shrink:0}
.funnel-bar-wrap{flex:1;height:26px;background:#f1f5f9;border-radius:999px;overflow:hidden;position:relative;border:1px solid #e2e8f0}
.funnel-bar{height:100%;border-radius:999px;transition:width .6s cubic-bezier(0.4,0,0.2,1);position:relative}
.funnel-bar::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent);
  background-size:200% 100%;animation:shimmer 2s ease-in-out infinite;opacity:0.55;
}
.funnel-nums{font-size:12px;font-weight:800;color:#0f172a;width:110px;text-align:right;flex-shrink:0;font-variant-numeric:tabular-nums}
.funnel-nums .pct{color:#64748b;font-weight:650;font-size:11px}

.table-wrap{overflow-x:auto;margin:0 -2px;border-radius:14px;border:1px solid #e2e8f0;background:white}
.table{width:100%;border-collapse:collapse;font-size:13px}
.table th{
  text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;
  letter-spacing:.07em;color:#64748b;padding:11px 14px;
  border-bottom:1px solid #e2e8f0;background:#f8fafc;white-space:nowrap;
}
.table td{padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#334155;font-weight:500}
.table tbody tr:last-child td{border-bottom:none}
.table tr:hover td{background:#f8fafc}
.table .num{text-align:right;font-variant-numeric:tabular-nums;font-weight:750;color:#0f172a}

.alerta{
  display:flex;gap:12px;align-items:flex-start;
  background:#fffbeb;border:1px solid #fde68a;border-radius:14px;
  padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6;
  box-shadow:0 1px 3px rgba(146,64,14,0.06);
}
.alerta--red{background:#fef2f2;border-color:#fecaca;color:#991b1b}
.alerta--green{background:#f0fdf4;border-color:#bbf7d0;color:#166534}

.textarea,.input{
  width:100%;font-size:13.5px;font-family:inherit;
  background:white;border:1.5px solid #e2e8f0;border-radius:12px;
  padding:10px 14px;color:#0f172a;outline:none;resize:vertical;
  transition:border-color .15s,box-shadow .15s;
}
.textarea::placeholder,.input::placeholder{color:#94a3b8}
.textarea:focus,.input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
.btn-primary{
  font-size:13px;font-weight:750;font-family:inherit;cursor:pointer;
  background:#0f172a;color:white;border:none;border-radius:999px;
  padding:10px 16px;transition:all .15s ease;
  box-shadow:0 4px 14px rgba(15,23,42,0.14);
}
.btn-primary:hover{background:#1e293b;transform:translateY(-1px);box-shadow:0 8px 20px rgba(15,23,42,0.18)}
.btn-primary:active{transform:translateY(0)}
.btn-primary:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}

/* ── Client page ── */
.cp-root{min-height:100vh;background:#f8fafc}
.cp-wrap{max-width:760px;margin:0 auto;padding:40px 20px 80px}
.cp-brand{font-size:12px;font-weight:800;letter-spacing:.14em;color:#94a3b8;text-transform:uppercase}
.cp-title{font-size:30px;font-weight:850;color:#0f172a;letter-spacing:-.03em;margin-top:10px;line-height:1.15}
.cp-sub{font-size:15px;color:#64748b;margin-top:10px;line-height:1.6}
.cp-shot{width:100%;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(15,23,42,0.1);margin-top:24px;display:block}
.cp-section{margin-top:36px}
.cp-h2{font-size:17px;font-weight:750;color:#0f172a;margin-bottom:6px;letter-spacing:-.015em}
.cp-p{font-size:13.5px;color:#64748b;line-height:1.65;margin-bottom:14px}
.cp-field{margin-bottom:14px}
.cp-label{font-size:12px;font-weight:650;color:#475569;margin-bottom:6px;display:block}
.cp-pay{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
@media (max-width:560px){.cp-pay{grid-template-columns:1fr}}
.cp-plan{background:white;border:1.5px solid #e2e8f0;border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:8px;transition:border-color .2s,transform .2s,box-shadow .2s}
.cp-plan:hover{border-color:#94a3b8;transform:translateY(-2px);box-shadow:0 12px 30px rgba(15,23,42,0.08)}
.cp-plan--hi{border-color:#0f172a;box-shadow:0 4px 16px rgba(15,23,42,0.08)}
.cp-plan-name{font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;color:#64748b}
.cp-plan-price{font-size:28px;font-weight:850;color:#0f172a;letter-spacing:-.03em}
.cp-plan-price small{font-size:13px;font-weight:600;color:#94a3b8}
.cp-plan-desc{font-size:12.5px;color:#64748b;line-height:1.55;flex:1}
.cp-plan-btn{display:block;text-align:center;text-decoration:none;font-size:13.5px;font-weight:750;font-family:inherit;cursor:pointer;background:#0f172a;color:white;border:none;border-radius:999px;padding:11px 16px;margin-top:6px;transition:background .15s}
.cp-plan-btn:hover{background:#1e293b}
.cp-ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:14px;padding:14px 18px;font-size:13.5px;line-height:1.6}
.cp-file{border:1.5px dashed #cbd5e1;border-radius:14px;padding:18px;text-align:center;font-size:12.5px;color:#64748b;cursor:pointer;transition:border-color .15s,background .15s;background:white}
.cp-file:hover{border-color:#3b82f6;background:#eff6ff}
.cp-anexos{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cp-req{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:10px}
.cp-req-top{display:flex;justify-content:space-between;gap:10px;align-items:center}
.cp-req-title{font-size:13.5px;font-weight:650;color:#0f172a}
.cp-req-desc{font-size:12.5px;color:#64748b;margin-top:6px;line-height:1.55;white-space:pre-wrap}
.cp-req-resp{font-size:12.5px;color:#166534;background:#f0fdf4;border-radius:10px;padding:8px 12px;margin-top:8px;border:1px solid #bbf7d0}
.cp-lang{position:absolute;top:20px;right:20px;display:flex;gap:4px}
.cp-lang button{font-size:11px;font-weight:750;font-family:inherit;cursor:pointer;border:1px solid #e2e8f0;background:white;color:#64748b;border-radius:999px;padding:4px 9px;transition:all .15s}
.cp-lang button:hover{border-color:#cbd5e1}
.cp-lang button.on{background:#0f172a;color:white;border-color:#0f172a}

/* Overlay for mobile sidebar */
.sidebar-overlay{position:fixed;inset:0;background:rgba(15,23,42,.44);backdrop-filter:blur(4px);z-index:39;display:none}
.sidebar-overlay--on{display:block;animation:fadeIn .18s ease}

/* ── Responsivo ── */
@media (max-width: 1100px){
  .topbar{padding:14px 18px}
  .content{padding:18px 18px 32px}
}
@media (max-width: 860px){
  .app-shell{flex-direction:column}
  .sidebar{
    position:fixed;left:0;top:0;bottom:0;transform:translateX(-100%);
    transition:transform .22s cubic-bezier(.32,.72,0,1);
    box-shadow:0 20px 60px rgba(15,23,42,.22);
  }
  .sidebar--open{transform:translateX(0)}
  .hamburger{display:inline-flex}
  .board{padding-bottom:6px}
}
@media (max-width: 560px){
  .topbar-title{font-size:16px}
  .metric-chip{min-width:0;flex:1}
}
`;
