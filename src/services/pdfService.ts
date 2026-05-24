import jsPDF from 'jspdf';
import { Report } from '../types';
export function exportReportPdf(report:Report){ const doc=new jsPDF(); doc.text('Property Comp Analyzer',10,10); doc.text(report.address,10,20); doc.text(`ARV: $${report.estimated_arv ?? 0}`,10,30); doc.save(`report-${report.id}.pdf`); }
