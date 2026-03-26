import { jsPDF } from 'jspdf';
import { HistorySession, SessionState, Project, CURRENCY_SYMBOLS } from './types';

export const getDateKey = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
};

export const formatClock = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatTimeShort = (ms: number) => {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const exportPDF = (session: SessionState | HistorySession, dateStr: string, projects?: Project[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TimeLog", pageWidth / 2, 20, { align: "center" });
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Activity Report", pageWidth / 2, 28, { align: "center" });

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);

  // Date & Time
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(new Date(session.checkInTime || Date.now()))}`, pageWidth - 20, 45, { align: 'right' });
  doc.text(`Export time: ${formatTimeShort(Date.now())}`, pageWidth - 20, 52, { align: 'right' });

  // Project Info
  let projectName = 'None';
  let projectRate = 0;
  let projectCurrency = 'INR';
  if (session.projectId && projects) {
    const project = projects.find(p => p.id === session.projectId);
    if (project) {
      projectName = project.name;
      projectRate = project.rate;
      projectCurrency = project.currency;
    }
  }
  const currencySymbol = CURRENCY_SYMBOLS[projectCurrency];

  doc.setFont("helvetica", "bold");
  doc.text("Project Details", 20, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Client/Project: ${projectName}`, 20, 52);
  if (projectRate > 0) {
    doc.text(`Hourly Rate: ${currencySymbol}${projectRate.toFixed(2)}/hr`, 20, 59);
  }

  // Summary Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, 65, pageWidth - 40, 55, 3, 3, 'FD');
  
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 25, 73);
  
  doc.setFont("helvetica", "normal");
  const checkInStr = session.checkInTime ? formatTimeShort(session.checkInTime) : '-';
  const checkOutStr = session.checkOutTime ? formatTimeShort(session.checkOutTime) : '-';
  
  let totalSessionMs = 0;
  let totalBreakMs = 0;
  let effectiveMs = 0;
  let breakCount = session.breaks.length;
  let earnedValue = 0;

  if ('summary' in session) {
    totalSessionMs = session.summary.totalSession;
    totalBreakMs = session.summary.totalBreak;
    effectiveMs = session.summary.effectiveHours;
    earnedValue = session.summary.earnedValue || 0;
  } else {
    totalBreakMs = session.breaks.reduce((acc, b) => acc + ((b.end || Date.now()) - b.start), 0);
    totalSessionMs = session.checkInTime ? ((session.checkOutTime || Date.now()) - session.checkInTime) : 0;
    effectiveMs = Math.max(0, totalSessionMs - totalBreakMs);
    earnedValue = (effectiveMs / (1000 * 60 * 60)) * projectRate;
  }

  doc.text(`Check-in: ${checkInStr}`, 25, 83);
  doc.text(`Check-out: ${checkOutStr}`, 25, 90);
  doc.text(`Total session: ${formatDuration(totalSessionMs)}`, 25, 97);
  
  doc.text(`Break time: ${formatDuration(totalBreakMs)}`, pageWidth / 2, 83);
  doc.text(`Effective hours: ${formatDuration(effectiveMs)}`, pageWidth / 2, 90);
  doc.text(`Number of breaks: ${breakCount}`, pageWidth / 2, 97);

  if (earnedValue > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(`Subtotal: ${currencySymbol}${earnedValue.toFixed(2)}`, 25, 110);
    doc.setTextColor(17, 24, 39);
  }

  let currentY = 130;

  // Notes & Reflections
  if (session.dailyIntent || (session.reflections && (session.reflections.win || session.reflections.blocker))) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes & Reflections", 20, currentY);
    currentY += 8;
    
    doc.setFont("helvetica", "normal");
    if (session.dailyIntent) {
      doc.text(`Daily Intent: ${session.dailyIntent}`, 20, currentY);
      currentY += 7;
    }
    if (session.reflections?.win) {
      doc.text(`Biggest Win: ${session.reflections.win}`, 20, currentY);
      currentY += 7;
    }
    if (session.reflections?.blocker) {
      doc.text(`Blockers: ${session.reflections.blocker}`, 20, currentY);
      currentY += 7;
    }
    currentY += 5;
  }

  // Activity Log Table
  doc.setFont("helvetica", "bold");
  doc.text("Activity Log", 20, currentY);
  currentY += 5;
  
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, currentY, pageWidth - 40, 10, 'F');
  
  doc.setFontSize(10);
  doc.text("Time", 25, currentY + 7);
  doc.text("Event", 60, currentY + 7);
  doc.text("Duration", pageWidth - 45, currentY + 7);

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "normal");
  
  currentY += 17;
  session.logs.forEach((log, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, currentY - 6, pageWidth - 40, 10, 'F');
    }
    
    doc.text(formatTimeShort(log.time), 25, currentY);
    doc.text(log.event, 60, currentY);
    if (log.durationMs) {
      doc.text(formatDuration(log.durationMs), pageWidth - 45, currentY);
    }
    
    currentY += 10;
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(229, 231, 235);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text("Generated by TimeLog · Freelance Management Suite", pageWidth / 2, pageHeight - 12, { align: "center" });

  doc.save(`TimeLog_${dateStr}.pdf`);
};

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateInvoice = (session: HistorySession, projects: Project[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const project = projects.find(p => p.id === session.projectId);
  const projectName = project ? project.name : 'Unknown Project';
  const rate = project ? project.rate : 0;
  const currency = project ? project.currency : 'INR';
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const hours = session.summary.effectiveHours / (1000 * 60 * 60);
  const total = hours * rate;

  // Header
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, 30);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`Invoice Date: ${formatDate(new Date())}`, pageWidth - 20, 25, { align: 'right' });
  doc.text(`Service Date: ${formatDate(new Date(session.date))}`, pageWidth - 20, 32, { align: 'right' });
  doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, pageWidth - 20, 39, { align: 'right' });

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 50, pageWidth - 20, 50);

  // Bill To
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 65);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(projectName, 20, 72);

  // Table Header
  const startY = 100;
  doc.setFillColor(249, 250, 251);
  doc.rect(20, startY, pageWidth - 40, 12, 'F');
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("DESCRIPTION", 25, startY + 8);
  doc.text("HOURS", pageWidth - 80, startY + 8, { align: 'right' });
  doc.text("RATE", pageWidth - 50, startY + 8, { align: 'right' });
  doc.text("AMOUNT", pageWidth - 25, startY + 8, { align: 'right' });

  // Table Row
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "normal");
  doc.text(`Freelance Services - ${session.dateFormatted}`, 25, startY + 22);
  if (session.dailyIntent) {
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(session.dailyIntent, 25, startY + 28);
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
  }

  doc.text(hours.toFixed(2), pageWidth - 80, startY + 22, { align: 'right' });
  doc.text(`${currencySymbol}${rate.toFixed(2)}`, pageWidth - 50, startY + 22, { align: 'right' });
  doc.text(`${currencySymbol}${total.toFixed(2)}`, pageWidth - 25, startY + 22, { align: 'right' });

  doc.setDrawColor(229, 231, 235);
  doc.line(20, startY + 35, pageWidth - 20, startY + 35);

  // Totals
  doc.setFont("helvetica", "bold");
  doc.text("Total Due:", pageWidth - 60, startY + 50);
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`${currencySymbol}${total.toFixed(2)}`, pageWidth - 25, startY + 50, { align: 'right' });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(229, 231, 235);
  doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 20, { align: "center" });
  doc.text("Generated by TimeLog · Freelance Management Suite", pageWidth / 2, pageHeight - 14, { align: "center" });

  doc.save(`Invoice_${projectName.replace(/\s+/g, '_')}_${session.date}.pdf`);
};
