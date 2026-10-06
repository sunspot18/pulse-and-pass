import crypto from 'crypto';
import QRCode from 'qrcode';
import { ENV } from '../config/env.js';

export class TicketService {
  /**
   * Generates a tamper-proof HMAC-SHA256 signature for ticket and event
   */
  static generateSignature(ticketId: string, eventId: string): string {
    const payload = `${ticketId}:${eventId}`;
    return crypto
      .createHmac('sha256', ENV.HMAC_SECRET)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generates a readable unique ticket serial and token payload
   */
  static generateTicketCode(ticketId: string, eventId: string): {
    ticketCode: string;
    securityHash: string;
    qrPayload: string;
  } {
    const securityHash = this.generateSignature(ticketId, eventId);
    // Compact token format: PNP.<ticketId>.<securityHashPrefix16>
    const shortHash = securityHash.substring(0, 16);
    const ticketCode = `PNP-${ticketId.substring(0, 8).toUpperCase()}-${shortHash.toUpperCase()}`;

    // Full JSON payload encoded inside QR code for gate turnstiles
    const qrPayload = JSON.stringify({
      v: 1,
      tid: ticketId,
      eid: eventId,
      code: ticketCode,
      sig: securityHash,
    });

    return { ticketCode, securityHash, qrPayload };
  }

  /**
   * Verifies an incoming QR payload against the HMAC secret
   */
  static verifyPayload(qrPayloadString: string): {
    isValid: boolean;
    ticketId?: string;
    eventId?: string;
    ticketCode?: string;
    reason?: string;
  } {
    try {
      const data = JSON.parse(qrPayloadString);
      if (!data.tid || !data.eid || !data.sig) {
        return { isValid: false, reason: 'MALFORMED_PAYLOAD' };
      }

      const expectedSig = this.generateSignature(data.tid, data.eid);
      if (crypto.timingSafeEqual(Buffer.from(data.sig), Buffer.from(expectedSig))) {
        return {
          isValid: true,
          ticketId: data.tid,
          eventId: data.eid,
          ticketCode: data.code,
        };
      }

      return { isValid: false, reason: 'SIGNATURE_MISMATCH' };
    } catch {
      return { isValid: false, reason: 'INVALID_JSON' };
    }
  }

  /**
   * Renders QR Code as Base64 Data URL (PNG)
   */
  static async generateQrDataUrl(qrPayload: string): Promise<string> {
    return QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0F1012',
        light: '#F4F1EA',
      },
    });
  }
}
