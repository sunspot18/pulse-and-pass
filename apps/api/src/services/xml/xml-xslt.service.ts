import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Xslt, XmlParser } from 'xslt-processor';
import { AppError } from '../../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.resolve(__dirname, '../../schemas/xml');

export class XmlXsltService {
  private static stylesheetCache: string | null = null;

  static getTicketXslt(): string {
    if (!this.stylesheetCache) {
      const xsltPath = path.join(SCHEMAS_DIR, 'ticket.xslt');
      this.stylesheetCache = fs.readFileSync(xsltPath, 'utf8');
    }
    return this.stylesheetCache;
  }

  /**
   * Transforms ticket XML to styled HTML using XSLT 1.0 template
   */
  static async transformTicketXml(
    ticketXml: string,
    xsltStylesheet: string = this.getTicketXslt(),
  ): Promise<string> {
    try {
      const parser = new XmlParser();
      const xmlDoc = parser.xmlParse(ticketXml);
      const xsltDoc = parser.xmlParse(xsltStylesheet);

      const xsltEngine = new Xslt();
      const htmlResult = await xsltEngine.xsltProcess(xmlDoc, xsltDoc);

      return htmlResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new AppError(`Failed to transform ticket via XSLT: ${message}`, 500, 'XSLT_TRANSFORMATION_FAILED');
    }
  }
}
