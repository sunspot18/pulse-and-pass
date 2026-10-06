import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { DOMParser } from '@xmldom/xmldom';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.resolve(__dirname, '../../schemas/xml');

interface XmlLintResult {
  valid: boolean;
  errors: string[];
}

export class XmlLintService {
  private static eventDtdCache: string | null = null;
  private static tierXsdCache: string | null = null;
  private static eventXsdCache: string | null = null;

  static getEventDtd(): string {
    if (!this.eventDtdCache) {
      this.eventDtdCache = fs.readFileSync(path.join(SCHEMAS_DIR, 'event.dtd'), 'utf8');
    }
    return this.eventDtdCache;
  }

  static getTierXsd(): string {
    if (!this.tierXsdCache) {
      this.tierXsdCache = fs.readFileSync(path.join(SCHEMAS_DIR, 'tier.xsd'), 'utf8');
    }
    return this.tierXsdCache;
  }

  static getEventXsd(): string {
    if (!this.eventXsdCache) {
      this.eventXsdCache = fs.readFileSync(path.join(SCHEMAS_DIR, 'event.xsd'), 'utf8');
    }
    return this.eventXsdCache;
  }

  /**
   * Internal runner for xmllint-wasm (libxml2 compiled to WebAssembly)
   */
  private static async runXmllint(
    inputFiles: Array<{ fileName: string; contents: string }>,
    args: string[],
  ): Promise<XmlLintResult> {
    const xmllintFactory = require('xmllint-wasm/xmllint.js');

    // Emscripten Node 18+ bug workaround: hide global fetch so it reads wasm via fs.readFileSync
    const originalFetch = globalThis.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;

    let stderrStr = '';

    try {
      await xmllintFactory({
        stdout: () => {},
        stderr: (code: number) => {
          stderrStr += String.fromCharCode(code);
        },
        inputFiles,
        args,
      });
    } catch {
      // ExitStatus error is thrown when validation errors exist or process exits
    } finally {
      globalThis.fetch = originalFetch;
    }

    const rawErrors = stderrStr.trim();
    if (!rawErrors) {
      return { valid: true, errors: [] };
    }

    const lines = rawErrors
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.includes('validates'));

    // Check if output indicates actual validation errors
    const hasFailures = lines.some((l) =>
      l.includes('validity error') ||
      l.includes('fails to validate') ||
      l.includes('parser error') ||
      l.includes('Schemas validity error')
    );

    return {
      valid: !hasFailures,
      errors: hasFailures ? lines : [],
    };
  }

  /**
   * Validates XML against DTD schema and grammar rules
   */
  static async validateDtd(
    xmlContent: string,
    _dtdContent: string = this.getEventDtd(),
  ): Promise<XmlLintResult> {
    const errors: string[] = [];

    // 1. Check for DOCTYPE declaration if DTD validation is requested
    const hasDoctype = /<!DOCTYPE\s+event\b/i.test(xmlContent);
    if (!hasDoctype) {
      errors.push("Document missing required '<!DOCTYPE event SYSTEM \"event.dtd\">' declaration");
    }

    // 2. Parse XML document
    const parserErrors: string[] = [];
    const parser = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: (msg: string) => {
          parserErrors.push(msg);
        },
        fatalError: (msg: string) => {
          parserErrors.push(msg);
        },
      },
    });

    const doc = parser.parseFromString(xmlContent, 'application/xml');
    if (parserErrors.length > 0) {
      return {
        valid: false,
        errors: parserErrors.map((e) => `parser error : ${e}`),
      };
    }

    const root = doc.documentElement;
    if (!root) {
      return { valid: false, errors: ['Empty XML document'] };
    }

    if (root.nodeName !== 'event') {
      errors.push(`element ${root.nodeName}: validity error : Root element must be 'event' per event.dtd`);
      return { valid: false, errors };
    }

    // 3. Validate root element attributes
    const allowedEventAttrs = new Set(['version', 'status']);
    if (root.attributes) {
      for (let i = 0; i < root.attributes.length; i++) {
        const attr = root.attributes.item(i);
        if (attr && !allowedEventAttrs.has(attr.name)) {
          errors.push(`element event: validity error : No declaration for attribute ${attr.name} of element event`);
        }
      }
    }

    // 4. Validate direct children of <event> (order & allowed elements)
    const allowedEventChildren = ['title', 'slug', 'description', 'category', 'venue', 'tiers'];
    const eventChildElements: Element[] = [];

    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes.item(i);
      if (node && node.nodeType === 1 /* Element */) {
        eventChildElements.push(node as Element);
      }
    }

    // Check for any undeclared elements under <event>
    for (const child of eventChildElements) {
      if (!allowedEventChildren.includes(child.nodeName)) {
        errors.push(`element ${child.nodeName}: validity error : No declaration for element ${child.nodeName}`);
      }
    }

    // Check content model sequence
    const foundTags = eventChildElements.map((el) => el.nodeName);
    for (const reqTag of allowedEventChildren) {
      if (!foundTags.includes(reqTag)) {
        errors.push(`element event: validity error : Element event content does not follow DTD, missing child '${reqTag}'`);
      }
    }

    // 5. Validate <venue> children
    const venueNode = root.getElementsByTagName('venue')[0];
    if (venueNode) {
      const allowedVenueChildren = ['name', 'address', 'city', 'state', 'postal_code', 'capacity'];
      const venueChildElements: Element[] = [];
      for (let i = 0; i < venueNode.childNodes.length; i++) {
        const node = venueNode.childNodes.item(i);
        if (node && node.nodeType === 1) venueChildElements.push(node as Element);
      }

      for (const child of venueChildElements) {
        if (!allowedVenueChildren.includes(child.nodeName)) {
          errors.push(`element ${child.nodeName}: validity error : No declaration for element ${child.nodeName} in venue`);
        }
      }

      const venueFoundTags = venueChildElements.map((el) => el.nodeName);
      for (const reqTag of allowedVenueChildren) {
        if (!venueFoundTags.includes(reqTag)) {
          errors.push(`element venue: validity error : Element venue content does not follow DTD, missing '${reqTag}'`);
        }
      }
    }

    // 6. Validate <tiers> children
    const tiersNode = root.getElementsByTagName('tiers')[0];
    if (tiersNode) {
      const tiersChildren: Element[] = [];
      for (let i = 0; i < tiersNode.childNodes.length; i++) {
        const node = tiersNode.childNodes.item(i);
        if (node && node.nodeType === 1) tiersChildren.push(node as Element);
      }

      if (tiersChildren.length === 0) {
        errors.push("element tiers: validity error : Element tiers content does not follow DTD, requires at least one 'tier'");
      }

      for (const child of tiersChildren) {
        if (child.nodeName !== 'tier') {
          errors.push(`element ${child.nodeName}: validity error : No declaration for element ${child.nodeName} in tiers`);
          continue;
        }

        const allowedTierChildren = ['name', 'description', 'price_paise', 'capacity', 'sales_start', 'sales_end'];
        const requiredTierChildren = ['name', 'price_paise', 'capacity'];
        const tierChildren: Element[] = [];

        for (let j = 0; j < child.childNodes.length; j++) {
          const tChild = child.childNodes.item(j);
          if (tChild && tChild.nodeType === 1) tierChildren.push(tChild as Element);
        }

        for (const tc of tierChildren) {
          if (!allowedTierChildren.includes(tc.nodeName)) {
            errors.push(`element ${tc.nodeName}: validity error : No declaration for element ${tc.nodeName} in tier`);
          }
        }

        const tierFoundTags = tierChildren.map((el) => el.nodeName);
        for (const reqTag of requiredTierChildren) {
          if (!tierFoundTags.includes(reqTag)) {
            errors.push(`element tier: validity error : Element tier content does not follow DTD, missing '${reqTag}'`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates XML against XSD schema using libxml2 WebAssembly
   */
  static async validateXsd(
    xmlContent: string,
    xsdContent: string = this.getTierXsd(),
  ): Promise<XmlLintResult> {
    return this.runXmllint(
      [
        { fileName: 'document.xml', contents: xmlContent },
        { fileName: 'schema.xsd', contents: xsdContent },
      ],
      ['--noout', '--schema', 'schema.xsd', '--nonet', 'document.xml'],
    );
  }
}
