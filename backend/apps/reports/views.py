from __future__ import annotations

import csv
import io
import zipfile
from dataclasses import asdict, dataclass

from django.http import HttpResponse
from django.http import JsonResponse
from django.utils import timezone

from apps.notifications.models import Notification
from apps.organizations.models import Branch, Counter, Service
from apps.queues.models import QueueToken


@dataclass
class ExportRow:
    label: str
    value: str


def _csv_response(filename: str, rows: list[tuple[str, str]]) -> HttpResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["label", "value"])
    writer.writerows(rows)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def _xlsx_response(filename: str, rows: list[tuple[str, str]]) -> HttpResponse:
    sheet_rows = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        "<sheetData>",
    ]
    for index, row in enumerate((("label", "value"), *rows), start=1):
        sheet_rows.append(
            f'<row r="{index}">'
            f'<c r="A{index}" t="inlineStr"><is><t>{row[0]}</t></is></c>'
            f'<c r="B{index}" t="inlineStr"><is><t>{row[1]}</t></is></c>'
            f"</row>"
        )
    sheet_rows.append("</sheetData></worksheet>")
    sheet_xml = "".join(sheet_rows)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '</Types>',
        )
        archive.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            "</Relationships>",
        )
        archive.writestr(
            "xl/workbook.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>',
        )
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            "</Relationships>",
        )
        archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)

    response = HttpResponse(buffer.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def _pdf_response(filename: str, title: str, lines: list[str]) -> HttpResponse:
    content = [
        "%PDF-1.4",
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    ]
    text_lines = [f"BT /F1 16 Tf 50 790 Td ({title}) Tj ET"]
    y = 760
    for line in lines:
        safe = line.replace("(", "\\(").replace(")", "\\)")
        text_lines.append(f"BT /F1 10 Tf 50 {y} Td ({safe}) Tj ET")
        y -= 16
    stream = "\n".join(text_lines)
    content.append(f"4 0 obj << /Length {len(stream)} >> stream\n{stream}\nendstream endobj")
    content.append("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj")
    xref_offset = sum(len(chunk) + 1 for chunk in content) + len("%PDF-1.4\n")
    pdf = "\n".join(content) + f"\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n{xref_offset}\n%%EOF"
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def report_export_view(request):
    if not request.META.get("HTTP_AUTHORIZATION") and not getattr(request, "user", None).is_authenticated:
        return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)
    report_type = request.GET.get("type", "queue")
    format_name = request.GET.get("format", "csv")
    rows = [
        ("generated_at", timezone.now().isoformat()),
        ("tokens", str(QueueToken.objects.count())),
        ("branches", str(Branch.objects.count())),
        ("services", str(Service.objects.count())),
        ("counters", str(Counter.objects.count())),
        ("notifications", str(Notification.objects.count())),
    ]
    filename_base = f"{report_type}-report"
    if format_name == "xlsx":
        return _xlsx_response(f"{filename_base}.xlsx", rows)
    if format_name == "pdf":
        return _pdf_response(f"{filename_base}.pdf", f"{report_type.title()} Report", [f"{label}: {value}" for label, value in rows])
    return _csv_response(f"{filename_base}.csv", rows)
