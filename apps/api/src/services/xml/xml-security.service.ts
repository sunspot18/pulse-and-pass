import { AppError } from '../../utils/errors.js';

export class XmlSecurityService {
  private static readonly MAX_XML_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_INTERNAL_ENTITIES = 5;

  /**
   * Validates XML input against XXE (XML External Entity) and Billion Laughs (entity expansion) attacks
   */
  static sanitizeAndValidate(rawXml: string): void {
    if (!rawXml || typeof rawXml !== 'string') {
      throw new AppError('XML payload must be a non-empty string', 400, 'VALIDATION_ERROR');
    }

    // 1. Guard against oversized payloads (DoS)
    const byteLength = Buffer.byteLength(rawXml, 'utf8');
    if (byteLength > this.MAX_XML_SIZE_BYTES) {
      throw new AppError(
        `XML payload exceeds maximum permitted size of ${this.MAX_XML_SIZE_BYTES / (1024 * 1024)}MB`,
        413,
        'PAYLOAD_TOO_LARGE',
      );
    }

    // 2. XXE Defense: Disallow external entities (SYSTEM or PUBLIC with URIs)
    const xxeSystemPattern = /<!ENTITY\s+[^>]*\bSYSTEM\b/i;
    const xxePublicPattern = /<!ENTITY\s+[^>]*\bPUBLIC\b/i;
    const dangerousProtocols = /\b(file|http|https|ftp|gopher|expect|php|data):/i;

    if (xxeSystemPattern.test(rawXml)) {
      throw new AppError(
        'XML entity with SYSTEM identifier is forbidden (XXE protection)',
        400,
        'XXE_INJECTION_DETECTED',
      );
    }

    if (xxePublicPattern.test(rawXml) && dangerousProtocols.test(rawXml)) {
      throw new AppError(
        'XML entity with external PUBLIC URI is forbidden (XXE protection)',
        400,
        'XXE_INJECTION_DETECTED',
      );
    }

    // 3. Billion Laughs / Quadratic Blowup Defense
    // Count all <!ENTITY declarations
    const entityMatches = rawXml.match(/<!ENTITY\s+/gi);
    if (entityMatches && entityMatches.length > this.MAX_INTERNAL_ENTITIES) {
      throw new AppError(
        `Too many entity declarations (${entityMatches.length} > ${this.MAX_INTERNAL_ENTITIES}). Potential Billion Laughs attack.`,
        400,
        'ENTITY_EXPANSION_DETECTED',
      );
    }

    // Reject recursive entity definitions (e.g. &lol1;&lol1; inside an ENTITY declaration)
    const entityDeclarationRegex = /<!ENTITY\s+(\w+)\s+["']([^"']*)["']\s*>/gi;
    let match: RegExpExecArray | null;
    let foundNestedEntity = false;

    while ((match = entityDeclarationRegex.exec(rawXml)) !== null) {
      const entityValue = match[2];
      if (entityValue && /&[a-zA-Z0-9_\-]+;/.test(entityValue)) {
        foundNestedEntity = true;
        break;
      }
    }

    if (foundNestedEntity) {
      throw new AppError(
        'Recursive entity expansion detected. Potential Billion Laughs denial of service attack.',
        400,
        'ENTITY_EXPANSION_DETECTED',
      );
    }
  }
}
