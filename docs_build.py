import re
from fpdf import FPDF

FONT_REG = "C:/Windows/Fonts/calibri.ttf"
FONT_BOLD = "C:/Windows/Fonts/calibrib.ttf"

# Design colors (oriented on the original document)
TITLE_COLOR = (44, 62, 80)     # dark slate / navy
HEADER_COLOR = (93, 109, 126)  # muted blue-gray
BODY_COLOR = (44, 62, 80)      # dark slate
MUTED = (120, 130, 140)        # muted gray
RULE = (200, 205, 212)         # light gray rule


def strip_inline(s):
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', s)
    s = re.sub(r'`(.+?)`', r'\1', s)
    s = re.sub(r'\*(.+?)\*', r'\1', s)
    return s


def write_markdown_pdf(md_path, pdf_path):
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(True, margin=20)
    pdf.add_font("Calibri", "", FONT_REG)
    pdf.add_font("Calibri", "B", FONT_BOLD)
    pdf.set_margins(22, 22, 22)
    pdf.add_page()

    with open(md_path, encoding="utf-8") as f:
        lines = f.read().splitlines()

    W = pdf.w - pdf.l_margin - pdf.r_margin  # usable width
    i = 0
    n = len(lines)

    def bullet(x_indent, text):
        pdf.set_x(pdf.l_margin + x_indent)
        pdf.cell(4.5, 6, chr(0x2022))
        pdf.set_x(pdf.l_margin + x_indent + 4.5)
        pdf.multi_cell(W - x_indent - 4.5, 6, text, align="L")

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # Code block
        if stripped.startswith("```"):
            i += 1
            code = []
            while i < n and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1
            pdf.set_font("Calibri", "", 10.5)
            pdf.set_text_color(*MUTED)
            for cl in code:
                pdf.cell(0, 5.2, cl.rstrip(), new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(*BODY_COLOR)
            pdf.ln(2)
            continue

        # Title (H1)
        if stripped.startswith("# "):
            title = strip_inline(stripped[2:])
            pdf.set_font("Calibri", "B", 22)
            pdf.set_text_color(*TITLE_COLOR)
            pdf.multi_cell(W, 10.5, title, align="L")
            pdf.ln(1.5)
            pdf.set_draw_color(*RULE)
            y = pdf.get_y()
            pdf.line(pdf.l_margin, y, pdf.l_margin + W, y)
            pdf.ln(6)
            pdf.set_text_color(*BODY_COLOR)
            i += 1
            continue

        # Section header (H2)
        if stripped.startswith("## "):
            pdf.ln(4)
            pdf.set_font("Calibri", "B", 13.5)
            pdf.set_text_color(*HEADER_COLOR)
            pdf.multi_cell(W, 7.5, strip_inline(stripped[3:]), align="L")
            pdf.ln(1.5)
            pdf.set_text_color(*BODY_COLOR)
            i += 1
            continue

        # Sub header (H3)
        if stripped.startswith("### "):
            pdf.ln(2)
            pdf.set_font("Calibri", "B", 11.5)
            pdf.set_text_color(*HEADER_COLOR)
            pdf.multi_cell(W, 6.5, strip_inline(stripped[4:]), align="L")
            pdf.ln(1)
            pdf.set_text_color(*BODY_COLOR)
            i += 1
            continue

        # Blockquote
        if stripped.startswith("> "):
            quote = []
            while i < n and lines[i].strip().startswith("> "):
                quote.append(strip_inline(lines[i].strip()[2:]))
                i += 1
            pdf.set_font("Calibri", "", 10)
            pdf.set_text_color(*MUTED)
            pdf.set_x(pdf.l_margin + 5)
            pdf.multi_cell(W - 5, 5.2, " ".join(quote), align="L")
            pdf.set_text_color(*BODY_COLOR)
            pdf.ln(1)
            continue

        # Bullet list
        if stripped.startswith("- ") or stripped.startswith("* "):
            items = []
            while i < n and (lines[i].strip().startswith("- ")
                             or lines[i].strip().startswith("* ")):
                items.append(strip_inline(lines[i].strip()[2:]))
                i += 1
            pdf.set_font("Calibri", "", 11)
            for it in items:
                bullet(0, it)
            pdf.ln(1)
            continue

        # Paragraph
        para = [strip_inline(stripped)]
        i += 1
        while i < n:
            s2 = lines[i].strip()
            if (not s2 or s2.startswith("#") or s2.startswith("- ")
                    or s2.startswith("* ") or s2.startswith("> ")
                    or s2.startswith("```")):
                break
            para.append(strip_inline(s2))
            i += 1
        pdf.set_font("Calibri", "", 11)
        pdf.set_text_color(*BODY_COLOR)
        pdf.multi_cell(W, 5.8, " ".join(para), align="L")
        pdf.ln(2)

    pdf.output(pdf_path)
    print("Wrote", pdf_path)


if __name__ == "__main__":
    base = r"C:\Users\Kempter\Documents\Berufsschule\Binder\Ab Dashboard\Dashboard"
    write_markdown_pdf(
        base + r"\Begründung für die Implementierung (V3).md",
        base + r"\Begründung für die Implementierung (V3).pdf")
