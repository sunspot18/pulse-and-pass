<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/ticket">
    <xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;</xsl:text>
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Pulse &amp; Pass - <xsl:value-of select="event_title"/> Ticket</title>
        <style>
          :root {
            --ink: #0A0D14;
            --paper: #F8F9FA;
            --card-bg: #14171F;
            --border: #232733;
            --cyan: #00E5FF;
            --amber: #FFB300;
            --text-main: #EDEDED;
            --text-muted: #8E95A5;
            --font-mono: 'JetBrains Mono', 'Courier New', monospace;
            --font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            background-color: var(--ink);
            color: var(--text-main);
            font-family: var(--font-sans);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
          }

          .ticket-container {
            width: 100%;
            max-width: 680px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 229, 255, 0.05);
            display: flex;
            flex-direction: column;
            position: relative;
          }

          .ticket-header {
            background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(255, 179, 0, 0.06));
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .brand-logo {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .brand-badge {
            color: var(--cyan);
            font-size: 1rem;
          }

          .status-badge {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            text-transform: uppercase;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            background: rgba(0, 229, 255, 0.1);
            color: var(--cyan);
            border: 1px solid rgba(0, 229, 255, 0.3);
            font-weight: 600;
            letter-spacing: 0.05em;
          }

          .ticket-body {
            padding: 2rem;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 2rem;
          }

          .event-info {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .event-title {
            font-size: 1.75rem;
            font-weight: 700;
            line-height: 1.2;
            color: #FFFFFF;
            letter-spacing: -0.02em;
          }

          .detail-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }

          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .detail-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            font-weight: 600;
          }

          .detail-value {
            font-size: 0.95rem;
            color: var(--text-main);
            font-weight: 500;
          }

          .tier-highlight {
            color: var(--amber);
            font-weight: 700;
          }

          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #FFFFFF;
            padding: 1rem;
            border-radius: 12px;
            align-self: center;
          }

          .qr-image {
            width: 140px;
            height: 140px;
            display: block;
          }

          .qr-label {
            margin-top: 0.5rem;
            font-family: var(--font-mono);
            font-size: 0.65rem;
            color: #111111;
            letter-spacing: 0.05em;
            font-weight: 700;
          }

          /* Perforation Divider */
          .perforation {
            position: relative;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
          }

          .perforation-line {
            width: calc(100% - 48px);
            border-top: 2px dashed rgba(255, 255, 255, 0.15);
          }

          .perforation-notch-left,
          .perforation-notch-right {
            position: absolute;
            width: 24px;
            height: 24px;
            background-color: var(--ink);
            border-radius: 50%;
            top: 0;
          }

          .perforation-notch-left {
            left: -12px;
            box-shadow: inset -2px 0 0 var(--border);
          }

          .perforation-notch-right {
            right: -12px;
            box-shadow: inset 2px 0 0 var(--border);
          }

          .ticket-stub {
            padding: 1.5rem 2rem;
            background: rgba(10, 13, 20, 0.5);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: var(--font-mono);
            font-size: 0.8rem;
          }

          .code-block {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .ticket-code {
            color: var(--cyan);
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 0.05em;
          }

          .security-hash {
            font-size: 0.7rem;
            color: var(--text-muted);
            word-break: break-all;
          }

          .stamp {
            border: 2px solid var(--amber);
            color: var(--amber);
            padding: 0.4rem 0.8rem;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            transform: rotate(-3deg);
            border-radius: 4px;
            opacity: 0.85;
          }

          /* Print Overrides */
          @media print {
            body {
              background: #FFFFFF !important;
              color: #000000 !important;
              padding: 0;
            }

            .ticket-container {
              box-shadow: none !important;
              border: 2px solid #000000 !important;
              background: #FFFFFF !important;
              max-width: 100%;
            }

            .ticket-header {
              background: #F0F0F0 !important;
              border-bottom: 1px solid #000000 !important;
            }

            .brand-logo, .event-title, .detail-value {
              color: #000000 !important;
            }

            .status-badge {
              border: 1px solid #000000 !important;
              color: #000000 !important;
              background: transparent !important;
            }

            .tier-highlight {
              color: #000000 !important;
              font-weight: bold;
            }

            .ticket-stub {
              background: #FAFAFA !important;
              border-top: 1px solid #000000 !important;
            }

            .ticket-code {
              color: #000000 !important;
            }

            .stamp {
              border-color: #000000 !important;
              color: #000000 !important;
            }

            .perforation-notch-left,
            .perforation-notch-right {
              background: #FFFFFF !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <header class="ticket-header">
            <div class="brand-logo">
              <span class="brand-badge">⚡</span> PULSE &amp; PASS
            </div>
            <div class="status-badge">
              <xsl:value-of select="status"/>
            </div>
          </header>

          <main class="ticket-body">
            <div class="event-info">
              <h1 class="event-title">
                <xsl:value-of select="event_title"/>
              </h1>

              <div class="detail-group">
                <div class="detail-item">
                  <span class="detail-label">Date &amp; Time</span>
                  <span class="detail-value">
                    <xsl:value-of select="event_start_time"/>
                  </span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">Venue</span>
                  <span class="detail-value">
                    <xsl:value-of select="venue_name"/>, <xsl:value-of select="venue_city"/>
                  </span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">Attendee</span>
                  <span class="detail-value">
                    <xsl:value-of select="attendee_name"/>
                  </span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">Tier / Category</span>
                  <span class="detail-value tier-highlight">
                    <xsl:value-of select="tier_name"/>
                  </span>
                </div>
              </div>
            </div>

            <div class="qr-section">
              <img class="qr-image" src="{qr_code_data_url}" alt="Gate Turnstile QR Code"/>
              <span class="qr-label">SCAN FOR ADMISSION</span>
            </div>
          </main>

          <div class="perforation">
            <div class="perforation-notch-left"></div>
            <div class="perforation-line"></div>
            <div class="perforation-notch-right"></div>
          </div>

          <footer class="ticket-stub">
            <div class="code-block">
              <div class="ticket-code">
                <xsl:value-of select="ticket_code"/>
              </div>
              <div class="security-hash">
                HMAC: <xsl:value-of select="security_hash"/>
              </div>
            </div>

            <div class="stamp">
              VERIFIED PASS
            </div>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
