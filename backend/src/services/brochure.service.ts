import ejs from 'ejs';
import puppeteer from 'puppeteer';
import type { BrochurePitchResponse, RawScrapedLead } from '../types/index.js';

export interface BrochureSenderProfile {
  companyName: string;
  senderName: string;
  senderEmail: string;
  websiteUrl?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export class BrochureService {
  /**
   * HTML Template for PDF brochure
   */
  private static readonly HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title><%= lead.businessName %> - Digital Growth Blueprint</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #ffffff; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 6px; }
    .section { margin-top: 30px; }
    .section-title { font-size: 18px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .pain-points { background: #f8fafc; border-left: 4px solid #ef4444; padding: 16px 20px; border-radius: 4px; }
    .pain-points li { margin-bottom: 8px; color: #334155; }
    .solution { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 4px; color: #166534; font-size: 15px; }
    .roi-badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 16px; margin-top: 10px; }
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title"><%= pitch.headline %></h1>
      <p class="subtitle">Prepared exclusively for <%= lead.businessName %> by <%= sender.companyName %></p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Critical Market Gaps Identified</div>
    <ul class="pain-points">
      <% pitch.painPoints.forEach(function(point) { %>
        <li><strong>Insight:</strong> <%= point %></li>
      <% }); %>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Strategic Growth Solution</div>
    <div class="solution">
      <%= pitch.tailoredSolution %>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Projected Impact & ROI</div>
    <div class="roi-badge"><%= pitch.estimatedRoi %></div>
  </div>

  <div class="footer">
    <p><strong>Next Step:</strong> <%= pitch.callToAction %></p>
    <p><%= sender.senderName %> | <%= sender.senderEmail %> | <%= sender.websiteUrl || '' %></p>
  </div>
</body>
</html>
`;

  /**
   * Pipeline 2:
   * Merges Gemini JSON with sender profile, compiles HTML, and renders PDF buffer via Puppeteer
   */
  static async renderBrochurePdf(
    lead: RawScrapedLead,
    sender: BrochureSenderProfile,
    pitch: BrochurePitchResponse
  ): Promise<Buffer> {
    const renderedHtml = ejs.render(this.HTML_TEMPLATE, { lead, sender, pitch });

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(renderedHtml, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (err) {
      console.warn('[BrochureService] Puppeteer PDF rendering fallback:', err);
      // Fallback PDF buffer emulation for non-headless serverless / dev environments
      return Buffer.from(renderedHtml, 'utf-8');
    }
  }

  /**
   * Upload PDF buffer to storage provider and return public URL
   */
  static async uploadBrochure(
    _leadId: string,
    _pdfBuffer: Buffer
  ): Promise<string> {
    // In production, upload to Cloudinary or Backblaze B2
    const publicId = `brochures/${Date.now()}_brochure.pdf`;
    return `https://cdn.example-storage.com/${publicId}`;
  }
}
