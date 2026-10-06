declare module 'xslt-processor' {
  export class XmlParser {
    xmlParse(xml: string): unknown;
  }

  export class Xslt {
    xsltProcess(xmlDoc: unknown, xsltDoc: unknown): Promise<string>;
  }

  export function xmlEscapeText(text: string): string;
  export function xmlTransformedText(text: string): string;
}
