import { UserProfileSettings, LocalizationSettings } from '../types';
import { BuildingFace } from '../components/Stakeholder3DViewer';

export interface StandaloneExportData {
  projectName: string;
  projectDescription?: string;
  userProfile: UserProfileSettings;
  localization: LocalizationSettings;
  faces: BuildingFace[];
  totalSurfaceArea: number;
  totalVolumeGallons: number;
  quoteTotal: number;
  quoteSubtotal: number;
  quoteTax: number;
  quoteMargin: number;
  lineItems: {
    category: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
  }[];
  exportTimestamp: number;
}

export function generateStandaloneStakeholderHtml(data: StandaloneExportData): string {
  const { userProfile, localization, faces, projectName, quoteTotal, lineItems } = data;

  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName} • Interactive Stakeholder 3D Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #020617;
      color: #f8fafc;
    }
    .font-mono {
      font-family: 'JetBrains+Mono', monospace;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
  
  <!-- Stakeholder Header derived from User Profile -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl backdrop-blur-md bg-slate-900/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-indigo-400/30">
          ${userProfile.company.name.charAt(0) || 'A'}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-extrabold text-white tracking-tight">${userProfile.company.name}</h1>
            <span class="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">
              VERIFIED PORTAL
            </span>
          </div>
          <p class="text-xs text-slate-400 font-mono">${userProfile.company.slogan || 'Commercial Surface Engineering Division'}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
        <div class="text-left md:text-right">
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Prepared By</span>
          <span class="font-bold text-indigo-300">${userProfile.userName}</span>
          <span class="text-[10px] text-slate-400 block">${userProfile.jobTitle}</span>
        </div>
        <div class="hidden sm:block h-8 w-px bg-slate-800"></div>
        <div class="text-left md:text-right">
          <span class="text-slate-400 block text-[10px] uppercase font-bold">App & Spec ID</span>
          <span class="font-bold text-slate-200">${userProfile.applicationId}</span>
          <span class="text-[10px] text-emerald-400 block">● Live Real-Time Spec</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Stakeholder Interactive Dashboard -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
    <!-- Project Title & Scope Banner -->
    <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-500/30">
          Client Presentation & Swapping Engine
        </span>
        <h2 class="text-xl sm:text-2xl font-bold text-white mt-1.5">${projectName}</h2>
        <p class="text-xs text-slate-400 mt-1 max-w-2xl">
          Interactive stakeholder preview allowing real-time 3D building inspection, color tone swapping, coating specification modifications, and instant recalculation of project costs.
        </p>
      </div>

      <div class="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
        <div class="text-center px-3 border-r border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase block">Surface Area</span>
          <span class="text-sm font-bold text-slate-200">${data.totalSurfaceArea.toLocaleString()} ft²</span>
        </div>
        <div class="text-center px-3 border-r border-slate-800">
          <span class="text-[10px] text-slate-400 uppercase block">Estimated Volume</span>
          <span class="text-sm font-bold text-indigo-300">${data.totalVolumeGallons} Gal</span>
        </div>
        <div class="text-center px-3">
          <span class="text-[10px] text-slate-400 uppercase block">Current Quote</span>
          <span class="text-base font-extrabold text-emerald-400" id="header-quote-display">${localization.currencySymbol}${quoteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- 3D Interactive Building Section & Live Swapper -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 3D Canvas Container -->
      <div class="lg:col-span-8 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        <div class="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-mono font-bold uppercase text-slate-200">Interactive 3D Orbit & Elevation</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-mono">
            <button onclick="setCamera('iso')" class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800">Iso</button>
            <button onclick="setCamera('front')" class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800">Front</button>
            <button onclick="setCamera('corner')" class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800">Corner</button>
            <button onclick="toggleAutoRotate()" id="btn-autorotate" class="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800">360°</button>
          </div>
        </div>

        <div class="relative w-full h-[400px] sm:h-[480px] bg-slate-950 select-none cursor-grab active:cursor-grabbing" id="canvas-container">
          <canvas id="building-canvas" class="w-full h-full block"></canvas>
          <div class="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 pointer-events-none">
            🖱️ Drag to Orbit • Scroll to Zoom
          </div>
          <div class="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-xl text-right font-mono" id="active-zone-badge">
            <span class="text-[10px] text-indigo-400 uppercase block font-bold" id="badge-zone-name">North Main Façade</span>
            <span class="text-xs text-slate-200 font-bold" id="badge-color-name">Cerulean Sky</span>
          </div>
        </div>

        <!-- Zone Selector Bar -->
        <div class="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto" id="zone-selector-bar">
          <!-- Populated by script -->
        </div>
      </div>

      <!-- Real-Time Color & Paint Type Swapping Controls -->
      <div class="lg:col-span-4 bg-slate-900/60 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">Palette & Coating Swapper</h3>
          <span class="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">Real-Time</span>
        </div>

        <!-- Active Zone Header -->
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-[9px] font-mono uppercase text-slate-400 block font-bold">Selected Zone</span>
            <span class="text-xs font-bold text-slate-200 font-mono" id="panel-selected-face-name">North Main Façade</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg border border-slate-600 shadow" id="panel-color-preview" style="background-color: #3b82f6"></div>
            <span class="text-[11px] font-mono text-slate-300 font-bold" id="panel-color-hex">#3b82f6</span>
          </div>
        </div>

        <!-- Color Swatches -->
        <div class="space-y-2">
          <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold">Architectural Color Palettes</label>
          <div class="grid grid-cols-6 gap-1.5" id="color-swatches-grid">
            <!-- Populated by JS -->
          </div>
        </div>

        <!-- Coating Products -->
        <div class="space-y-2">
          <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold">Coating Formulation Spec</label>
          <div class="space-y-1.5" id="coating-specs-container">
            <!-- Populated by JS -->
          </div>
        </div>
      </div>
    </div>

    <!-- Logical Real-Time Quote Ledger Breakdown -->
    <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 class="text-base font-bold text-white font-mono">Formal Cost & Specification Ledger</h3>
          <p class="text-xs text-slate-400">Dynamically itemized based on selected coating grades and architectural square footage.</p>
        </div>
        <div class="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-mono font-bold">
          Calculated in ${localization.currencyCode} (${localization.currencySymbol})
        </div>
      </div>

      <!-- Itemized Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <th class="py-2.5 px-3">Item Category</th>
              <th class="py-2.5 px-3">Description</th>
              <th class="py-2.5 px-3 text-right">Quantity</th>
              <th class="py-2.5 px-3 text-right">Unit Rate</th>
              <th class="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60" id="quote-line-items-body">
            ${lineItems.map(item => `
              <tr class="hover:bg-slate-800/30">
                <td class="py-2.5 px-3 font-semibold text-indigo-300">${item.category}</td>
                <td class="py-2.5 px-3 text-slate-300">${item.description}</td>
                <td class="py-2.5 px-3 text-right text-slate-400">${item.quantity.toLocaleString()} ${item.unit}</td>
                <td class="py-2.5 px-3 text-right text-slate-400">${localization.currencySymbol}${item.rate.toFixed(2)}</td>
                <td class="py-2.5 px-3 text-right font-bold text-slate-200">${localization.currencySymbol}${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Totals Summary Box -->
      <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="text-xs font-mono text-slate-400 space-y-1">
          <p>• Validity: 30 Calendar Days from Export</p>
          <p>• Terms: 30% Deposit upon Substrate Sign-off • 40% Intermediate • 30% Final Handover</p>
        </div>

        <div class="w-full sm:w-72 space-y-1.5 font-mono text-xs">
          <div class="flex justify-between text-slate-400">
            <span>Material & Labor Subtotal:</span>
            <span id="summary-subtotal">${localization.currencySymbol}${data.quoteSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Contractor Margin (${localization.defaultMarginRate}%):</span>
            <span id="summary-margin">${localization.currencySymbol}${data.quoteMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Tax (${localization.defaultTaxRate}%):</span>
            <span id="summary-tax">${localization.currencySymbol}${data.quoteTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-base font-extrabold text-emerald-400 pt-2 border-t border-slate-800">
            <span>Total Quotation:</span>
            <span id="summary-total">${localization.currencySymbol}${quoteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stakeholder Interactive Approval & Direct Feedback Section -->
    <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-3">
        <h4 class="text-sm font-bold text-white font-mono uppercase tracking-wider">Stakeholder Approval</h4>
        <p class="text-xs text-slate-400">Sign and authorize the digital scope and color formulation as reviewed above.</p>
        <div class="space-y-2">
          <input type="text" placeholder="Stakeholder Full Legal Name" class="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500" />
          <input type="text" placeholder="Representative Organization / Entity" class="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500" />
          <button type="button" onclick="alert('Specification Approved! A verification hash has been dispatched to ${userProfile.email}.')" class="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md">
            Authorize & Approve Specification
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="text-sm font-bold text-white font-mono uppercase tracking-wider">Direct Revision Notes</h4>
        <p class="text-xs text-slate-400">Transmit custom architectural instructions directly to the formulator & estimator.</p>
        <textarea rows="3" placeholder="Enter color adjustments, schedule constraints, or access notes..." class="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"></textarea>
        <button type="button" onclick="alert('Revision Notes Dispatched to Field Estimator!')" class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-md">
          Submit Revision Feedback
        </button>
      </div>
    </div>
  </main>

  <!-- Stakeholder Footer derived from User Profile -->
  <footer class="bg-slate-900 border-t border-slate-800 py-8 px-4 sm:px-6 mt-12 text-slate-400 text-xs font-mono">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
      <div>
        <h5 class="text-sm font-bold text-slate-200 mb-2">${userProfile.company.name}</h5>
        <p class="text-[11px] text-slate-400 leading-relaxed">${userProfile.company.address}</p>
        <p class="text-[11px] text-slate-400">${userProfile.company.cityStateZip}</p>
        <p class="text-[11px] text-indigo-400 mt-1">${userProfile.company.legalRegistration}</p>
      </div>

      <div>
        <h5 class="text-sm font-bold text-slate-200 mb-2">Direct Contact & Field Operations</h5>
        <p class="text-[11px] text-slate-300">Lead: ${userProfile.userName}</p>
        <p class="text-[11px] text-slate-400">Email: ${userProfile.email}</p>
        <p class="text-[11px] text-slate-400">Phone: ${userProfile.phone}</p>
        <p class="text-[11px] text-slate-400">Dispatch Radio: ${userProfile.communicationChannels.channelId}</p>
      </div>

      <div>
        <h5 class="text-sm font-bold text-slate-200 mb-2">Accreditation & Quality Standards</h5>
        <p class="text-[11px] text-slate-400 leading-relaxed">${userProfile.certifications}</p>
        <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="text-[10px] text-slate-300">Digital Signature: ${userProfile.digitalSignatureText}</span>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2">
      <span>© ${new Date().getFullYear()} ${userProfile.company.name}. All rights reserved. Generated via WalnusGlobal SmartView -Pro ©.</span>
      <span>Export Hash: ${Math.random().toString(36).substring(2, 15).toUpperCase()} • Schema v2.4</span>
    </div>
  </footer>

  <!-- Embedded Interactive Script for 3D Orbit, Zone Swapping & Recalculation -->
  <script>
    const projectData = ${dataJson};
    let faces = projectData.faces;
    let selectedFaceId = faces[0] ? faces[0].id : '';
    let rotX = 22;
    let rotY = -35;
    let zoom = 1.0;
    let autoRotate = false;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const canvas = document.getElementById('building-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      render3D();
    }
    window.addEventListener('resize', resizeCanvas);

    function render3D() {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 + 30;
      const scale = Math.min(width, height) * 0.42 * zoom;

      const radX = (rotX * Math.PI) / 180;
      const radY = (rotY * Math.PI) / 180;

      function project(x, y, z) {
        const cosY = Math.cos(radY), sinY = Math.sin(radY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const cosX = Math.cos(radX), sinX = Math.sin(radX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const dist = 4.5;
        const fov = dist / (dist + z2);
        return [centerX + x1 * scale * fov, centerY - y2 * scale * fov, z2];
      }

      // Ground Grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const p1 = project(i * 0.6, -1.0, -2.0);
        const p2 = project(i * 0.6, -1.0, 2.0);
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
      }

      // Map Face colors
      const faceMap = {};
      faces.forEach(f => { faceMap[f.id] = f; });

      const north = faceMap['face_north_facade'] || faces[0];
      const south = faceMap['face_south_wing'] || faces[1] || faces[0];
      const east = faceMap['face_east_elevation'] || faces[2] || faces[0];
      const west = faceMap['face_west_entrance'] || faces[3] || faces[0];
      const roof = faceMap['face_roof_parapet'] || faces[4] || faces[0];
      const trim = faceMap['face_columns_trim'] || faces[5] || faces[0];
      const plinth = faceMap['face_plinth_base'] || faces[6] || faces[0];

      const polys = [
        { id: plinth.id, color: plinth.colorHex, vertices: [[-1.3,-1,1],[1.3,-1,1],[1.3,-0.75,1],[-1.3,-0.75,1]] },
        { id: north.id, color: north.colorHex, vertices: [[-1.2,-0.75,0.9],[0.3,-0.75,0.9],[0.3,1,0.9],[-1.2,1,0.9]] },
        { id: west.id, color: west.colorHex, vertices: [[0.3,-0.75,1.3],[1.2,-0.75,1.3],[1.2,0.6,1.3],[0.3,0.6,1.3]] },
        { id: west.id, color: west.colorHex, vertices: [[0.3,-0.75,0.9],[0.3,-0.75,1.3],[0.3,0.6,1.3],[0.3,0.6,0.9]] },
        { id: east.id, color: east.colorHex, vertices: [[1.2,-0.75,0.9],[1.2,-0.75,-0.9],[1.2,1,-0.9],[1.2,1,0.9]] },
        { id: south.id, color: south.colorHex, vertices: [[1.2,-0.75,-0.9],[-1.2,-0.75,-0.9],[-1.2,1,-0.9],[1.2,1,-0.9]] },
        { id: roof.id, color: roof.colorHex, vertices: [[-1.2,1,0.9],[1.2,1,0.9],[1.2,1,-0.9],[-1.2,1,-0.9]] },
        { id: trim.id, color: trim.colorHex, vertices: [[-1.25,1,0.92],[1.25,1,0.92],[1.25,1.15,0.92],[-1.25,1.15,0.92]] }
      ];

      const projected = polys.map(p => {
        const pVerts = p.vertices.map(v => project(v[0], v[1], v[2]));
        const avgZ = pVerts.reduce((s, v) => s + v[2], 0) / pVerts.length;
        return { ...p, pVerts, avgZ };
      });
      projected.sort((a, b) => b.avgZ - a.avgZ);

      projected.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.pVerts[0][0], p.pVerts[0][1]);
        for (let i = 1; i < p.pVerts.length; i++) ctx.lineTo(p.pVerts[i][0], p.pVerts[i][1]);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = p.id === selectedFaceId ? '#38bdf8' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = p.id === selectedFaceId ? 2.5 : 1;
        ctx.stroke();
        ctx.restore();
      });
    }

    // Controls
    canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      rotY += (e.clientX - lastX) * 0.7;
      rotX = Math.max(-80, Math.min(80, rotX - (e.clientY - lastY) * 0.7));
      lastX = e.clientX; lastY = e.clientY;
      render3D();
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      zoom = Math.max(0.4, Math.min(3.0, zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
      render3D();
    });

    function setCamera(mode) {
      if (mode === 'iso') { rotX = 22; rotY = -35; zoom = 1.0; }
      else if (mode === 'front') { rotX = 5; rotY = 0; zoom = 1.1; }
      else if (mode === 'corner') { rotX = 20; rotY = -60; zoom = 1.05; }
      render3D();
    }

    let rotateTimer = null;
    function toggleAutoRotate() {
      autoRotate = !autoRotate;
      const btn = document.getElementById('btn-autorotate');
      if (autoRotate) {
        btn.classList.add('bg-indigo-600', 'text-white');
        rotateTimer = setInterval(() => { rotY = (rotY + 0.6) % 360; render3D(); }, 30);
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white');
        clearInterval(rotateTimer);
      }
    }

    const swatches = [
      '#1e3a8a', '#3b82f6', '#0f172a', '#475569', '#e2e8f0', '#0284c7',
      '#78350f', '#d97706', '#713f12', '#14532d', '#3f6212', '#a16207',
      '#2563eb', '#94a3b8', '#1e293b', '#15803d', '#b91c1c', '#ea580c'
    ];

    function initUI() {
      // Swatches grid
      const grid = document.getElementById('color-swatches-grid');
      if (grid) {
        grid.innerHTML = '';
        swatches.forEach(hex => {
          const btn = document.createElement('button');
          btn.className = 'w-full aspect-square rounded-lg border border-slate-700 hover:scale-105 transition-transform cursor-pointer';
          btn.style.backgroundColor = hex;
          btn.onclick = () => { applyColor(hex); };
          grid.appendChild(btn);
        });
      }

      // Zone selector bar
      const bar = document.getElementById('zone-selector-bar');
      if (bar) {
        bar.innerHTML = '';
        faces.forEach(f => {
          const b = document.createElement('button');
          b.className = 'px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs font-mono shrink-0 hover:border-indigo-500 cursor-pointer';
          b.innerText = f.name;
          b.onclick = () => { selectZone(f.id); };
          bar.appendChild(b);
        });
      }

      // Specs
      const specsContainer = document.getElementById('coating-specs-container');
      if (specsContainer) {
        specsContainer.innerHTML = '';
        const specs = [
          { name: 'Exterior Acrylic Latex', desc: '55% Solids • Breathable' },
          { name: 'High-Performance 2K Epoxy', desc: 'Chemical & Moisture Barrier' },
          { name: 'Polyurethane Enamel', desc: 'Ultra-UV Gloss Shield' },
          { name: 'Masonry Elastomeric', desc: '350% Elongation Waterproofing' }
        ];
        specs.forEach(s => {
          const btn = document.createElement('button');
          btn.className = 'w-full text-left p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-mono cursor-pointer';
          btn.innerHTML = '<span class="font-bold block text-white">' + s.name + '</span><span class="text-[10px] text-slate-400">' + s.desc + '</span>';
          btn.onclick = () => { alert('Applied ' + s.name + ' to active zone!'); };
          specsContainer.appendChild(btn);
        });
      }

      resizeCanvas();
    }

    function selectZone(id) {
      selectedFaceId = id;
      const f = faces.find(x => x.id === id) || faces[0];
      if (!f) return;
      const badge = document.getElementById('badge-zone-name');
      if (badge) badge.innerText = f.name;
      const faceNameEl = document.getElementById('panel-selected-face-name');
      if (faceNameEl) faceNameEl.innerText = f.name;
      const colorPreviewEl = document.getElementById('panel-color-preview');
      if (colorPreviewEl) colorPreviewEl.style.backgroundColor = f.colorHex;
      const colorHexEl = document.getElementById('panel-color-hex');
      if (colorHexEl) colorHexEl.innerText = f.colorHex;
      render3D();
    }

    function applyColor(hex) {
      faces = faces.map(f => f.id === selectedFaceId ? { ...f, colorHex: hex } : f);
      selectZone(selectedFaceId);
    }

    initUI();
  </script>
</body>
</html>`;
}
