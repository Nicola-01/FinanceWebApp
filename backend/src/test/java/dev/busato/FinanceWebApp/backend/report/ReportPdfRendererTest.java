package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class ReportPdfRendererTest {

  private final ReportPdfRenderer renderer = new ReportPdfRenderer();

  private static final String XHTML =
      """
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head><title>t</title><style>body { font-family: sans-serif; }</style></head>
      <body><h1>Report</h1><p>hello</p></body>
      </html>
      """;

  @Test
  void render_ProducesNonEmptyPdfBytes() {
    byte[] pdf = renderer.render(XHTML);

    assertTrue(pdf.length > 500);
    assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
  }

  @Test
  void render_MalformedHtml_Throws() {
    assertThrows(IllegalStateException.class, () -> renderer.render("<html><p>unclosed"));
  }
}
