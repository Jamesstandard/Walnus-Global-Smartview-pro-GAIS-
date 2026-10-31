import { jsPDF } from 'jspdf';
import { DraftQuotation, PaintProject, UserProfileSettings, LocalizationSettings } from '../types';
import { getStoredUserProfile, getStoredLocalization, formatLocalizedCurrency, formatLocalizedArea, formatLocalizedVolume } from '../data/userProfileSettings';

export interface GeneratedPdfResult {
  doc: jsPDF;
  blobUrl: string;
  fileName: string;
  dataUri: string;
}

export function generateQuotationPdf(
  quotation: DraftQuotation,
  project?: PaintProject | null,
  customProfile?: UserProfileSettings | null,
  customLoc?: LocalizationSettings | null
): GeneratedPdfResult {
  const profile = customProfile || getStoredUserProfile();
  const loc = customLoc || getStoredLocalization();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Primary palette
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryHeader: [number, number, number] = [30, 41, 59]; // Slate 800
  const accentColor: [number, number, number] = [79, 70, 229]; // Indigo 600
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const mutedText: [number, number, number] = [100, 116, 139]; // Slate 500
  const darkText: [number, number, number] = [30, 41, 59]; // Slate 800

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent line
  doc.setFillColor(...accentColor);
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Company Name / Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const companyTitle = (profile.company.name || 'APEX INDUSTRIAL COATINGS LTD.').toUpperCase();
  doc.text(companyTitle, margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(profile.company.slogan || 'Commercial Surface Engineering & Autonomous Formulation Division', margin, 20);
  doc.text(`${profile.company.address} • ${profile.company.cityStateZip}`, margin, 25.5);
  doc.text(`${profile.company.legalRegistration} • Web: ${profile.company.website || 'paint-sync-pro.net'}`, margin, 31);
  doc.text(`App ID: ${profile.applicationId || 'PSP-IND-2026-X99'} • VHF: ${profile.communicationChannels.channelId || 'Ch-7'}`, margin, 36.5);

  // Document Badge on right
  const badgeWidth = 56;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - badgeWidth, 9, badgeWidth, 24, 2, 2, 'F');
  
  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL QUOTATION', pageWidth - margin - badgeWidth + 4, 15);

  doc.setTextColor(...primaryColor);
  doc.setFontSize(9.5);
  doc.text(quotation.quotationNumber, pageWidth - margin - badgeWidth + 4, 21.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(`Currency: ${loc.currencyCode} (${loc.currencySymbol})`, pageWidth - margin - badgeWidth + 4, 28);

  // 2. Organization / Preparer & Recipient Dual Metadata Grid
  let y = 49;
  const colWidth = (contentWidth - 6) / 2;

  // Left column: Prepared By (User Profile & Position)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text('PREPARED BY (ISSUING ENGINEER)', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkText);
  doc.text(profile.userName || 'Dr. Elena Rostova', margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`${profile.jobTitle || 'Lead Surface Engineer'}`, margin + 4, y + 18.5);
  doc.text(`Dept: ${profile.department || 'Field Formulations'}`, margin + 4, y + 23.5);
  doc.text(`Email: ${profile.email || 'dispatch@paint-sync.net'}`, margin + 4, y + 28.5);
  doc.text(`Direct: ${profile.phone || '+1 555-839-2041'} | Dispatch: ${profile.fieldDispatchPhone || '+1 555-839-4400'}`, margin + 4, y + 33.5);

  // Right column: Recipient & Project Info
  const rightX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, y, colWidth, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text('RECIPIENT & PROJECT SCOPE', rightX + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkText);
  doc.text(quotation.targetContact.name, rightX + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text(`Role: ${quotation.targetContact.role} (${quotation.targetContact.roleCaption}) • ${quotation.targetContact.department}`, rightX + 4, y + 18.5);
  doc.text(`Project: ${quotation.projectName}`, rightX + 4, y + 23.5);

  const formattedArea = formatLocalizedArea(project?.surfaceAreaSqFt || 2450, loc);
  const formattedVolume = formatLocalizedVolume(project?.volumeGallons || 7.0, loc);
  doc.text(`Surface: ${formattedArea} • Est. Volume: ${formattedVolume}`, rightX + 4, y + 28.5);

  const formattedDate = new Date(quotation.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Issue Date: ${formattedDate} • Validity: ${quotation.validityDays} Days • Terms: 30D NET`, rightX + 4, y + 33.5);

  y += 43;

  // 3. Autonomous Market Research Agent Verification Banner
  doc.setFillColor(240, 253, 244); // Emerald light
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'D');

  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('LIVE AGENT VERIFICATION & CERTIFICATION COMPLIANCE', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...darkText);
  doc.text(
    `Verified by ${profile.userName} (${profile.certifications || 'SSPC / NACE Level 3 Certified'}). Chemical raw material indices benchmarked against live regional depot spot rates.`,
    margin + 4,
    y + 9
  );

  y += 16;

  // 4. Line Items Table Header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 7.5, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CATEGORY', margin + 3, y + 5);
  doc.text('DESCRIPTION / SCOPE OF WORK', margin + 30, y + 5);
  doc.text('QTY', margin + 116, y + 5);
  doc.text('UNIT RATE', margin + 138, y + 5);
  doc.text('TOTAL', margin + 162, y + 5);

  y += 8.5;

  // 5. Line Item Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  quotation.lineItems.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 7.5, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    // Category badge
    doc.setTextColor(...accentColor);
    doc.setFont('helvetica', 'bold');
    doc.text(item.category.substring(0, 12), margin + 3, y + 4);

    // Description
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(item.description, 80);
    doc.text(splitDesc[0] || item.description, margin + 30, y + 4);

    // Quantity & Unit
    doc.text(`${item.quantity} ${item.unit}`, margin + 116, y + 4);

    // Unit rate
    doc.text(formatLocalizedCurrency(item.unitRate, loc), margin + 138, y + 4);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(formatLocalizedCurrency(item.total, loc), margin + 162, y + 4);

    y += 7.5;
  });

  y += 3;

  // 6. Financial Summary Box (Right aligned)
  const summaryWidth = 88;
  const summaryX = margin + contentWidth - summaryWidth;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, y, summaryWidth, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryWidth, 38, 2, 2, 'D');

  let sumY = y + 5.5;
  const printSumRow = (label: string, value: number, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...(isBold ? darkText : mutedText));
    doc.text(label, summaryX + 4, sumY);
    doc.text(formatLocalizedCurrency(value, loc), summaryX + summaryWidth - 4, sumY, { align: 'right' });
    sumY += 5;
  };

  printSumRow('Material & Labor Subtotal:', quotation.subtotal);
  printSumRow(`Contractor Margin (${quotation.contractorMarginPercent}%):`, quotation.marginAmount);
  printSumRow(`Site Contingency (${quotation.contingencyPercent}%):`, quotation.contingencyAmount);
  printSumRow(`Estimated Sales Tax (${quotation.taxRatePercent}%):`, quotation.taxAmount);

  // Grand Total Banner inside summary
  doc.setFillColor(...accentColor);
  doc.roundedRect(summaryX + 2, sumY - 1, summaryWidth - 4, 9, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`TOTAL (${loc.currencyCode})`, summaryX + 5, sumY + 5);
  doc.text(formatLocalizedCurrency(quotation.total, loc), summaryX + summaryWidth - 5, sumY + 5, { align: 'right' });

  // 7. Payment Terms & Organization Contact Box (Left side of summary)
  const termsWidth = contentWidth - summaryWidth - 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, termsWidth, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, termsWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  doc.text('PAYMENT SCHEDULE & LEGAL CLAUSES', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...darkText);
  const termsText = doc.splitTextToSize(quotation.paymentTerms, termsWidth - 8);
  doc.text(termsText, margin + 4, y + 10.5);

  doc.setTextColor(...mutedText);
  doc.setFontSize(6.5);
  doc.text(`• Direct Contact: ${profile.email} • Ph: ${profile.phone}`, margin + 4, y + 23);
  doc.text(`• Primary Comms: ${profile.communicationChannels.primaryChannel} (${profile.communicationChannels.channelId})`, margin + 4, y + 27.5);
  doc.text(`• Valid for ${quotation.validityDays} calendar days • ISO 9001:2015 & SSPC Standard Specification Compliant.`, margin + 4, y + 32);

  y += 43;

  // 8. Sign-off & Digital Signature Stamp
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkText);
  doc.text('OFFICIAL DISPATCH AUTHORIZATION & SIGNATURE SEAL', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(`Authorized Signer: ${profile.userName} (${profile.jobTitle})`, margin + 4, y + 11);
  doc.text(`Digital Seal Signature: [${profile.digitalSignatureText || profile.userName}] • Cert ID: ${profile.applicationId}`, margin + 4, y + 16.5);

  // Signature line on right
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 60, y + 15, pageWidth - margin - 5, y + 15);
  doc.setFontSize(6.5);
  doc.text('Stakeholder / Contact Signature & Date', pageWidth - margin - 60, y + 19);

  // 9. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedText);
  doc.text(
    `${profile.company.name} • ${profile.company.website} • App ID: ${profile.applicationId} • Confidential Document`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const dataUri = doc.output('datauristring');
  const fileName = `Quotation_${quotation.quotationNumber}_${profile.userName.replace(/\s+/g, '_')}_${quotation.targetContact.name.replace(/\s+/g, '_')}.pdf`;

  return {
    doc,
    blobUrl,
    fileName,
    dataUri,
  };
}
