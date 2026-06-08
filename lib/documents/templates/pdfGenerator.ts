import jsPDF from 'jspdf';
import { InvoiceTemplateClassic } from './InvoiceTemplateClassic';
import { InvoiceTemplateModern } from './InvoiceTemplateModern';
import { QuoteTemplateClassic } from './QuoteTemplateClassic';
import { QuoteTemplateModern } from './QuoteTemplateModern';

const formatCurrencyPdf = (amount: number, currencyCode: string = 'ZAR', currencySymbol: string = 'R') => {
  return `${currencySymbol}${amount.toFixed(2)}`;
};

export async function generateInvoicePDF(invoice: any, company: any, template: string = 'default'): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const currencySymbol = company?.currency?.symbol || (company?.currency?.code === 'ZAR' ? 'R' : '$');

  const formatCurrency = (amount: number) => formatCurrencyPdf(amount, company?.currency?.code, currencySymbol);

  if (template === 'modern') {
    // Modern template - dark header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo
    if (company?.branding?.logoUrl) {
      try {
        doc.addImage(company.branding.logoUrl, 'PNG', margin, 10, 30, 20);
      } catch (e) {
        // skip if logo fails
      }
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, 32);

    // Invoice number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber || '', pageWidth - margin, 25, { align: 'right' });

    // Company info on right
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'Company Name', pageWidth - margin, 12, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    if (company?.description) {
      doc.text(company.description, pageWidth - margin, 18, { align: 'right' });
    }

    // Client details
    let yPos = 55;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Bill To', margin, yPos);
    yPos += 5;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.clientName || '', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (invoice.clientCompany) {
      doc.text(invoice.clientCompany, margin, yPos);
      yPos += 4;
    }
    if (invoice.clientEmail) {
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.clientEmail, margin, yPos);
      yPos += 4;
    }
    if (invoice.clientPhone) {
      doc.text(invoice.clientPhone, margin, yPos);
      yPos += 4;
    }

    // Dates on right side
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    const dateX = pageWidth - margin;
    let rightY = 55;
    doc.text(`Issue Date: ${invoice.issueDate || ''}`, dateX, rightY, { align: 'right' });
    rightY += 5;
    doc.text(`Due Date: ${invoice.dueDate || ''}`, dateX, rightY, { align: 'right' });
    rightY += 5;
    const statusColors: any = { paid: [34, 197, 94], sent: [59, 130, 246], draft: [100, 100, 100], overdue: [239, 68, 68] };
    const statusColor = statusColors[invoice.status] || [100, 100, 100];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text((invoice.status || 'draft').toUpperCase(), dateX, rightY, { align: 'right' });

    // Items table
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 140, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });

    yPos += 5;
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (const item of (invoice.items || [])) {
      const itemY = yPos + 6;
      doc.text(item.description || '', margin, itemY);
      doc.text(String(item.quantity || 0), 120, itemY);
      doc.text(formatCurrency(item.unitPrice || 0), 140, itemY);
      doc.text(formatCurrency(item.total || 0), pageWidth - margin, itemY, { align: 'right' });
      yPos += 10;
    }

    // Totals section
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const totalsX = pageWidth - 70;

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', totalsX, yPos);
    doc.setTextColor(40, 40, 40);
    doc.text(formatCurrency(invoice.subtotal || 0), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if ((invoice.taxRate || 0) > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${invoice.taxRate}%)`, totalsX, yPos);
      doc.setTextColor(40, 40, 40);
      doc.text(formatCurrency(invoice.taxAmount || 0), pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    // Total box
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(totalsX - 5, yPos - 3, pageWidth - totalsX - margin + 5, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', margin + 2, yPos + 5);
    doc.text(formatCurrency(invoice.total || 0), pageWidth - margin - 5, yPos + 5, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPos += 25;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 20, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Notes', margin + 5, yPos);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2 - 10);
      doc.text(noteLines, margin + 5, yPos + 6);
    }

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });
    if (company?.email) {
      doc.text(company.email, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

  } else {
    // Classic template
    // Header
    if (company?.branding?.logoUrl) {
      try {
        doc.addImage(company.branding.logoUrl, 'PNG', margin, 10, 40, 25);
      } catch (e) {
        // skip
      }
    }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, 50);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.invoiceNumber || '', margin, 57);

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'Company Name', pageWidth - margin, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    if (company?.description) {
      doc.text(company.description, pageWidth - margin, 21, { align: 'right' });
    }
    if (company?.address) {
      doc.text(company.address, pageWidth - margin, 27, { align: 'right' });
    }

    // Bill to
    let yPos = 70;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Bill To:', margin, yPos);
    yPos += 5;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.clientName || '', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (invoice.clientCompany) {
      doc.text(invoice.clientCompany, margin, yPos);
      yPos += 4;
    }
    if (invoice.clientEmail) {
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.clientEmail, margin, yPos);
      yPos += 4;
    }
    if (invoice.clientPhone) {
      doc.text(invoice.clientPhone, margin, yPos);
      yPos += 4;
    }

    // Dates
    doc.setTextColor(100, 100, 100);
    doc.text(`Issue Date:`, pageWidth - 60, 70);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.issueDate || '', pageWidth - margin, 70, { align: 'right' });
    doc.setTextColor(100, 100, 100);
    doc.text(`Due Date:`, pageWidth - 60, 76);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.dueDate || '', pageWidth - margin, 76, { align: 'right' });

    // Table
    yPos = 95;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 145, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (const item of (invoice.items || [])) {
      const itemY = yPos + 7;
      doc.text(item.description || '', margin, itemY);
      doc.text(String(item.quantity || 0), 120, itemY);
      doc.text(formatCurrency(item.unitPrice || 0), 145, itemY);
      doc.text(formatCurrency(item.total || 0), pageWidth - margin, itemY, { align: 'right' });
      yPos += 10;
    }

    // Totals
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const totalsX = pageWidth - 70;

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', totalsX, yPos);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCurrency(invoice.subtotal || 0), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if ((invoice.taxRate || 0) > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${invoice.taxRate}%)`, totalsX, yPos);
      doc.setTextColor(30, 30, 30);
      doc.text(formatCurrency(invoice.taxAmount || 0), pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 3;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.line(totalsX, yPos, pageWidth - margin, yPos);
    yPos += 7;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, yPos);
    doc.setFontSize(14);
    doc.text(formatCurrency(invoice.total || 0), pageWidth - margin, yPos, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 18, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Notes', margin + 5, yPos);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2 - 10);
      doc.text(noteLines, margin + 5, yPos + 5);
    }

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });
    if (company?.email) {
      doc.text(company.email, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  return doc;
}

export async function generateQuotePDF(quote: any, company: any, template: string = 'default'): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const currencySymbol = company?.currency?.symbol || (company?.currency?.code === 'ZAR' ? 'R' : '$');

  const formatCurrency = (amount: number) => formatCurrencyPdf(amount, company?.currency?.code, currencySymbol);

  if (template === 'modern') {
    // Modern template - dark header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 45, 'F');

    if (company?.branding?.logoUrl) {
      try {
        doc.addImage(company.branding.logoUrl, 'PNG', margin, 10, 30, 20);
      } catch (e) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTE', margin, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.quoteNumber || '', pageWidth - margin, 25, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'Company Name', pageWidth - margin, 12, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    if (company?.description) {
      doc.text(company.description, pageWidth - margin, 18, { align: 'right' });
    }

    let yPos = 55;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Prepared For', margin, yPos);
    yPos += 5;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.clientName || '', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (quote.clientCompany) {
      doc.text(quote.clientCompany, margin, yPos);
      yPos += 4;
    }
    if (quote.clientEmail) {
      doc.setTextColor(100, 100, 100);
      doc.text(quote.clientEmail, margin, yPos);
      yPos += 4;
    }
    if (quote.clientPhone) {
      doc.text(quote.clientPhone, margin, yPos);
      yPos += 4;
    }

    const dateX = pageWidth - margin;
    let rightY = 55;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Date: ${quote.createdAt || ''}`, dateX, rightY, { align: 'right' });
    rightY += 5;
    if (quote.validUntil) {
      doc.text(`Valid Until: ${quote.validUntil}`, dateX, rightY, { align: 'right' });
      rightY += 5;
    }
    const statusColors: any = { accepted: [34, 197, 94], rejected: [239, 68, 68], expired: [245, 158, 11], draft: [100, 100, 100], sent: [59, 130, 246] };
    const statusColor = statusColors[quote.status] || [100, 100, 100];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text((quote.status || 'draft').toUpperCase(), dateX, rightY, { align: 'right' });

    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 140, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });

    yPos += 5;
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (const item of (quote.items || [])) {
      const itemY = yPos + 6;
      doc.text(item.description || '', margin, itemY);
      doc.text(String(item.quantity || 0), 120, itemY);
      doc.text(formatCurrency(item.unitPrice || 0), 140, itemY);
      doc.text(formatCurrency(item.total || 0), pageWidth - margin, itemY, { align: 'right' });
      yPos += 10;
    }

    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const totalsX = pageWidth - 70;

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', totalsX, yPos);
    doc.setTextColor(40, 40, 40);
    doc.text(formatCurrency(quote.subtotal || 0), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if ((quote.taxRate || 0) > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${quote.taxRate}%)`, totalsX, yPos);
      doc.setTextColor(40, 40, 40);
      doc.text(formatCurrency(quote.taxAmount || 0), pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(totalsX - 5, yPos - 3, pageWidth - totalsX - margin + 5, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', margin + 2, yPos + 5);
    doc.text(formatCurrency(quote.total || 0), pageWidth - margin - 5, yPos + 5, { align: 'right' });

    if (quote.notes) {
      yPos += 25;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 20, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Notes', margin + 5, yPos);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(quote.notes, pageWidth - margin * 2 - 10);
      doc.text(noteLines, margin + 5, yPos + 6);
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('This quote is valid for 30 days from the date of issue.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    if (company?.email) {
      doc.text(company.email, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

  } else {
    // Classic template
    if (company?.branding?.logoUrl) {
      try {
        doc.addImage(company.branding.logoUrl, 'PNG', margin, 10, 40, 25);
      } catch (e) {}
    }

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', margin, 50);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(quote.quoteNumber || '', margin, 57);

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'Company Name', pageWidth - margin, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    if (company?.description) {
      doc.text(company.description, pageWidth - margin, 21, { align: 'right' });
    }
    if (company?.address) {
      doc.text(company.address, pageWidth - margin, 27, { align: 'right' });
    }

    let yPos = 70;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Prepared For:', margin, yPos);
    yPos += 5;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.clientName || '', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (quote.clientCompany) {
      doc.text(quote.clientCompany, margin, yPos);
      yPos += 4;
    }
    if (quote.clientEmail) {
      doc.setTextColor(100, 100, 100);
      doc.text(quote.clientEmail, margin, yPos);
      yPos += 4;
    }
    if (quote.clientPhone) {
      doc.text(quote.clientPhone, margin, yPos);
      yPos += 4;
    }

    doc.setTextColor(100, 100, 100);
    doc.text(`Date:`, pageWidth - 60, 70);
    doc.setTextColor(30, 30, 30);
    doc.text(quote.createdAt || '', pageWidth - margin, 70, { align: 'right' });
    if (quote.validUntil) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Valid Until:`, pageWidth - 60, 76);
      doc.setTextColor(30, 30, 30);
      doc.text(quote.validUntil, pageWidth - margin, 76, { align: 'right' });
    }

    yPos = 95;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Unit Price', 145, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (const item of (quote.items || [])) {
      const itemY = yPos + 7;
      doc.text(item.description || '', margin, itemY);
      doc.text(String(item.quantity || 0), 120, itemY);
      doc.text(formatCurrency(item.unitPrice || 0), 145, itemY);
      doc.text(formatCurrency(item.total || 0), pageWidth - margin, itemY, { align: 'right' });
      yPos += 10;
    }

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    const totalsX = pageWidth - 70;

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', totalsX, yPos);
    doc.setTextColor(30, 30, 30);
    doc.text(formatCurrency(quote.subtotal || 0), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if ((quote.taxRate || 0) > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${quote.taxRate}%)`, totalsX, yPos);
      doc.setTextColor(30, 30, 30);
      doc.text(formatCurrency(quote.taxAmount || 0), pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    yPos += 3;
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(1);
    doc.line(totalsX, yPos, pageWidth - margin, yPos);
    yPos += 7;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, yPos);
    doc.setFontSize(14);
    doc.text(formatCurrency(quote.total || 0), pageWidth - margin, yPos, { align: 'right' });

    if (quote.notes) {
      yPos += 20;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos - 5, pageWidth - margin * 2, 18, 3, 3, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Notes', margin + 5, yPos);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(quote.notes, pageWidth - margin * 2 - 10);
      doc.text(noteLines, margin + 5, yPos + 5);
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('This quote is valid for 30 days from the date of issue.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    if (company?.email) {
      doc.text(company.email, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  return doc;
}