package dev.busato.FinanceWebApp.backend.report;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import org.springframework.stereotype.Component;

/** Renders well-formed XHTML (the report templates) to PDF bytes via openhtmltopdf. */
@Component
public class ReportPdfRenderer {

  public byte[] render(String xhtml) {
    try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.useFastMode();
      builder.withHtmlContent(xhtml, null);
      builder.toStream(out);
      builder.run();
      return out.toByteArray();
    } catch (Exception e) {
      throw new IllegalStateException("PDF rendering failed", e);
    }
  }
}
