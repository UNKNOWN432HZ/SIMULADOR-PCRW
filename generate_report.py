# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def add_toc(paragraph):
    """Inserts a Table of Contents field in the paragraph."""
    r1 = paragraph.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    r1._r.append(fldChar1)
    
    r2 = paragraph.add_run()
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    r2._r.append(instrText)
    
    r3 = paragraph.add_run()
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    r3._r.append(fldChar2)
    
    r4 = paragraph.add_run()
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    r4._r.append(fldChar3)

def add_page_number(paragraph):
    """Inserts a PAGE number field in the paragraph."""
    r1 = paragraph.add_run()
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(10)
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    r1._r.append(fldChar1)
    
    r2 = paragraph.add_run()
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(10)
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = "PAGE"
    r2._r.append(instrText)
    
    r3 = paragraph.add_run()
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(10)
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    r3._r.append(fldChar2)
    
    r4 = paragraph.add_run()
    r4.font.name = 'Times New Roman'
    r4.font.size = Pt(10)
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    r4._r.append(fldChar3)

def set_cell_background(cell, fill_color):
    """Sets background shading of a cell to fill_color (hex string)."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_color)
    tcPr.append(shd)

def set_cell_borders(cell, top="D3D3D3", bottom="D3D3D3", left="D3D3D3", right="D3D3D3"):
    """Sets thin light gray borders on a cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for border_name, color in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        b = OxmlElement(f'w:{border_name}')
        b.set(qn('w:val'), 'single')
        b.set(qn('w:sz'), '4')  # 1/2 pt
        b.set(qn('w:space'), '0')
        b.set(qn('w:color'), color)
        tcBorders.append(b)
    tcPr.append(tcBorders)

def add_heading_1(doc, text):
    h = doc.add_paragraph(text, style='Heading 1')
    h.paragraph_format.space_before = Pt(20)
    h.paragraph_format.space_after = Pt(10)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(16)  # Font 16 for H1 (proportional to body 11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph(text, style='Heading 2')
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(8)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)  # Font 13 for H2
        r.font.bold = True
        r.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_heading_3(doc, text):
    h = doc.add_paragraph(text, style='Heading 3')
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    for r in h.runs:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)  # Font 11 for H3
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(0, 0, 0)
    return h

def add_body_paragraph(doc, text, alignment=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    p.alignment = alignment
    p_format = p.paragraph_format
    p_format.line_spacing = 1.5
    p_format.space_after = Pt(12)
    p_format.space_before = Pt(0)
    
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11)  # Font size changed to 11
    return p

def add_bullet_point(doc, bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.space_before = Pt(0)
    
    run_bold = p.add_run(bold_prefix)
    run_bold.font.name = 'Times New Roman'
    run_bold.font.size = Pt(11)  # Font size changed to 11
    run_bold.font.bold = True
    
    run_text = p.add_run(text)
    run_text.font.name = 'Times New Roman'
    run_text.font.size = Pt(11)  # Font size changed to 11
    return p

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    
    set_cell_background(cell, "F2F2F2")
    set_cell_borders(cell)
    
    p = cell.paragraphs[0]
    p_format = p.paragraph_format
    p_format.line_spacing = 1.15
    p_format.space_after = Pt(4)
    p_format.space_before = Pt(4)
    p_format.left_indent = Inches(0.1)
    p_format.right_indent = Inches(0.1)
    
    run = p.add_run(code_text)
    run.font.name = 'Courier New'
    run.font.size = Pt(9.0)

def add_image_placeholder(doc, figure_num, title, description):
    """Creates a beautifully bordered placeholder box representing figures/charts."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    
    set_cell_background(cell, "FAFAFA")
    set_cell_borders(cell, top="BFBFBF", bottom="BFBFBF", left="BFBFBF", right="BFBFBF")
    
    # Placeholder content
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_format = p.paragraph_format
    p_format.space_before = Pt(18)
    p_format.space_after = Pt(18)
    
    run_box = p.add_run("\n[ ESPACIO RESERVADO PARA ILUSTRACIÓN / GRÁFICO TÉCNICO ]\n")
    run_box.font.name = 'Times New Roman'
    run_box.font.size = Pt(11)
    run_box.font.bold = True
    run_box.font.color.rgb = RGBColor(128, 128, 128)
    
    # Figure caption (APA 7 format)
    p_caption = doc.add_paragraph()
    p_caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_caption_format = p_caption.paragraph_format
    p_caption_format.space_before = Pt(6)
    p_caption_format.space_after = Pt(18)
    
    run_fig = p_caption.add_run(f"Figura {figure_num}: {title}\n")
    run_fig.font.name = 'Times New Roman'
    run_fig.font.size = Pt(10)
    run_fig.font.bold = True
    
    run_desc = p_caption.add_run(description)
    run_desc.font.name = 'Times New Roman'
    run_desc.font.size = Pt(9.5)
    run_desc.font.italic = True

def add_custom_table(doc, headers, rows):
    tbl = doc.add_table(rows=1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.space_before = Pt(6)
        run = p.runs[0]
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10.5)
        run.font.bold = True
        set_cell_background(hdr_cells[i], "D9E1F2")
        set_cell_borders(hdr_cells[i], top="4F81BD", bottom="4F81BD", left="4F81BD", right="4F81BD")
        
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.add_row().cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            p = row_cells[c_idx].paragraphs[0]
            if c_idx > 0 and ("%" in str(val) or str(val).replace(".", "").isdigit() or "ms" in str(val) or "RPS" in str(val)):
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.space_before = Pt(6)
            run = p.runs[0]
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            
            fill = "F2F2F2" if r_idx % 2 == 1 else "FFFFFF"
            set_cell_background(row_cells[c_idx], fill)
            set_cell_borders(row_cells[c_idx])

def build_document():
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.page_width = Inches(8.27)   # A4 Width
        section.page_height = Inches(11.69)  # A4 Height
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Configure Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)  # Font size changed to 11
    normal_style.paragraph_format.line_spacing = 1.5
    normal_style.paragraph_format.space_after = Pt(12)
    
    # ----------------------------------------------------
    # SECTION 1: COVER PAGE & INDEX (no page numbering/headers)
    # ----------------------------------------------------
    p_logo_space = doc.add_paragraph()
    p_logo_space.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for _ in range(2):
        doc.add_paragraph()
        
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("INSTITUTO DE EDUCACIÓN SUPERIOR TECNOLÓGICO PÚBLICO\n\"HV4NTA\"\n")
    r_inst.font.bold = True
    r_inst.font.size = Pt(14)
    
    r_prog = p_inst.add_run("PROGRAMA DE ESTUDIOS: DISEÑO Y PROGRAMACIÓN WEB\nCURSO: PRUEBAS DE SOFTWARE")
    r_prog.font.bold = True
    r_prog.font.size = Pt(11)
    r_prog.font.color.rgb = RGBColor(80, 80, 80)
    
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.add_run("__________________________________________________________________")
    
    for _ in range(3):
        doc.add_paragraph()
        
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run(
        "INFORME ACADÉMICO ENTREGABLE Y PRÁCTICO:\n\n"
        "\"PRUEBAS DE CARGA Y RENDIMIENTO EN EL DESARROLLO DE PLATAFORMAS WEB Y EL ASEGURAMIENTO DE CALIDAD DE SOFTWARE\""
    )
    r_title.font.bold = True
    r_title.font.size = Pt(15)
    
    for _ in range(3):
        doc.add_paragraph()
        
    p_info = doc.add_paragraph()
    p_info.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_info = p_info.add_run(
        "DOCENTE DE LA ASIGNATURA:\n"
        "ING. ALEGRIA CORE, CRISTHIAN\n\n"
        "ÁMBITO ACADÉMICO:\n"
        "PRUEBAS DE SOFTWARE\n\n"
        "PRESENTADO POR:\n"
        "[Nombres y Apellidos del Estudiante]\n\n"
        "SEMESTRE ACADÉMICO / CICLO:\n"
        "[Ciclo Académico]"
    )
    r_info.font.size = Pt(11)
    
    for _ in range(3):
        doc.add_paragraph()
        
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_date = p_date.add_run("HUANTA - PERÚ\n2026")
    r_date.font.bold = True
    r_date.font.size = Pt(11)
    
    doc.add_page_break()
    
    # --- INDEX PAGE ---
    p_idx_h = doc.add_paragraph()
    r_idx_h = p_idx_h.add_run("ÍNDICE DE CONTENIDOS DEL INFORME")
    r_idx_h.font.bold = True
    r_idx_h.font.size = Pt(16)
    p_idx_h.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_idx_h.paragraph_format.space_before = Pt(12)
    p_idx_h.paragraph_format.space_after = Pt(12)
    
    p_idx_desc = doc.add_paragraph()
    r_idx_desc = p_idx_desc.add_run(
        "Instrucción para la visualización del índice automático: "
        "Este es un campo de índice estructurado conforme a los estilos Heading 1, Heading 2 y Heading 3 de Microsoft Word. "
        "Para visualizar los números de página actualizados y la estructura jerárquica del documento impreso, "
        "haga clic derecho sobre el espacio a continuación y seleccione 'Actualizar campos' (Update Field) "
        "seguido de 'Actualizar toda la tabla' (Update entire table) dentro de Microsoft Word."
    )
    r_idx_desc.font.italic = True
    r_idx_desc.font.size = Pt(10)
    p_idx_desc.paragraph_format.space_after = Pt(24)
    
    p_toc_p = doc.add_paragraph()
    add_toc(p_toc_p)
    
    doc.add_page_break()
    
    # ----------------------------------------------------
    # SECTION 2: MAIN REPORT BODY (Page 1 starts here, headers & footers active)
    # ----------------------------------------------------
    sec2 = doc.add_section()
    sec2.header.is_linked_to_previous = False
    sec2.footer.is_linked_to_previous = False
    
    # Reset page numbering to 1 for this section
    sec2_pr = sec2._sectPr
    pgNumType = OxmlElement('w:pgNumType')
    pgNumType.set(qn('w:start'), '1')
    sec2_pr.append(pgNumType)
    
    # Configure Header
    hdr = sec2.header
    p_hdr = hdr.paragraphs[0]
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr = p_hdr.add_run("Informe de Trabajo Final: Pruebas de Carga y Rendimiento | IES HV4NTA")
    r_hdr.font.name = 'Times New Roman'
    r_hdr.font.size = Pt(8.5)
    r_hdr.font.italic = True
    r_hdr.font.color.rgb = RGBColor(128, 128, 128)
    
    # Configure Footer
    ftr = sec2.footer
    p_ftr = ftr.paragraphs[0]
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_ftr_p = p_ftr.add_run("Página ")
    r_ftr_p.font.name = 'Times New Roman'
    r_ftr_p.font.size = Pt(10)
    add_page_number(p_ftr)
    
    # Enforce margins in Section 2
    sec2.top_margin = Inches(1)
    sec2.bottom_margin = Inches(1)
    sec2.left_margin = Inches(1)
    sec2.right_margin = Inches(1)
    
    # ==========================================
    # 1. INTRODUCCIÓN
    # ==========================================
    add_heading_1(doc, "1. INTRODUCCIÓN")
    
    add_body_paragraph(
        doc,
        "En la era contemporánea de la digitalización, las aplicaciones web se han constituido como la infraestructura central de interacción "
        "humana, comercial, gubernamental y educativa. Desde plataformas de comercio electrónico que procesan millones de transacciones por "
        "minuto, hasta sistemas de gestión del aprendizaje (LMS) y portales de matrícula académica en institutos tecnológicos y universidades, "
        "la disponibilidad, velocidad y robustez del software ya no son aspectos meramente complementarios; son atributos críticos para "
        "el éxito operativo y la retención del usuario. Históricamente, el desarrollo web y las pruebas de software se concentraron primordialmente "
        "en la validación funcional. Es decir, que los botones respondieran a los clics, que los formularios guardaran la información correcta "
        "en las bases de datos y que las interfaces visuales se renderizaran de forma estéticamente aceptable. Sin embargo, la experiencia "
        "operativa ha demostrado que un sistema funcionalmente impecable puede volverse completamente inútil si colapsa o se ralentiza "
        "inaceptablemente bajo condiciones de uso masivo simultáneo."
    )
    
    add_body_paragraph(
        doc,
        "Este fenómeno introduce la imperiosa necesidad de aplicar metodologías, herramientas y estándares orientados a la evaluación no "
        "funcional de los sistemas. Las pruebas de rendimiento (Performance Testing), que engloban disciplinas más específicas como las pruebas "
        "de carga (Load Testing) y las pruebas de estrés (Stress Testing), emergen como pilares fundamentales dentro de la Ingeniería de Calidad "
        "de Software (QA). Su propósito no es encontrar defectos lógicos en el código o errores de sintaxis en los scripts de diseño web, sino "
        "determinar la capacidad del software para operar de manera eficiente bajo escenarios de concurrencia previstos y extremos. Estas pruebas "
        "permiten caracterizar el comportamiento de la infraestructura tecnológica (servidores web, servidores de aplicaciones, balanceadores "
        "de carga, bases de datos y redes) y predecir con base científica si una aplicación podrá soportar eventos de alta demanda."
    )
    
    add_body_paragraph(
        doc,
        "En el contexto educativo y tecnológico del Instituto de Educación Superior Tecnológico Público HV4NTA, la formación de profesionales "
        "en Diseño y Programación Web y Pruebas de Software debe contemplar esta visión holística de la ingeniería. No basta con enseñar a "
        "codificar en HTML, CSS, JavaScript, PHP o Python, ni con estructurar bases de datos en MySQL o PostgreSQL. Resulta indispensable dotar "
        "al estudiante y futuro desarrollador de las capacidades analíticas y prácticas para diagnosticar y optimizar el rendimiento de sus "
        "despliegues. En este sentido, la velocidad de carga de un sitio web influye directamente en aspectos comerciales y técnicos cruciales. "
        "Por ejemplo, el algoritmo de posicionamiento de motores de búsqueda como Google prioriza páginas rápidas a través de métricas conocidas "
        "como Core Web Vitals, penalizando severamente a aquellos sitios con tiempos de respuesta elevados. En entornos transaccionales, se ha "
        "documentado que retrasos de tan solo un segundo en el procesamiento de una página de pago pueden reducir la tasa de conversión en "
        "hasta un 20%. En contextos educativos, la inestabilidad de las plataformas de matrícula o exámenes concurrentes genera una profunda "
        "frustración en la comunidad estudiantil, dañando la percepción institucional."
    )
    
    add_body_paragraph(
        doc,
        "Este informe final de trabajo tiene por finalidad estructurar un cuerpo doctrinal y práctico riguroso sobre las pruebas de carga y "
        "rendimiento. Se abordan las definiciones esenciales de estas pruebas, se desglosan sus diferencias conceptuales con el fin de disipar "
        "confusiones comunes en la industria, se analiza su importancia técnica e impacto estratégico, y se detallan las herramientas "
        "más extendidas del mercado (Apache JMeter, Grafana k6 y Locust). Asimismo, se establece un marco metodológico para la interpretación "
        "científica de los resultados y la identificación de cuellos de botella comunes (bottlenecks). Para consolidar el aprendizaje significativo "
        "y pragmático, el informe incluye ejemplos prácticos de desarrollo de scripts y un caso de estudio enfocado en la optimización de un "
        "sistema de matrícula académica del IES HV4NTA, demostrando cómo el diagnóstico mediante pruebas de rendimiento guía las acciones de "
        "remediación e infraestructura para alcanzar la excelencia operativa."
    )
    
    # ==========================================
    # 2. OBJETIVOS
    # ==========================================
    add_heading_1(doc, "2. OBJETIVOS")
    
    add_heading_2(doc, "2.1. Objetivo General")
    add_body_paragraph(
        doc,
        "El objetivo general del presente trabajo final es elaborar un informe técnico-pedagógico exhaustivo y práctico sobre las pruebas de "
        "carga y rendimiento en el ámbito de las pruebas de software y el desarrollo web, que sirva de guía de referencia para el diseño, "
        "ejecución, análisis y remediación de problemas de eficiencia y escalabilidad en sistemas de información concurrentes."
    )
    
    add_heading_2(doc, "2.2. Objetivos Específicos")
    add_bullet_point(
        doc,
        "Establecer un marco teórico sólido ",
        "que defina y delimite conceptualmente las pruebas de rendimiento, carga, estrés, resistencia y pico, eliminando las ambigüedades terminológicas recurrentes en la práctica profesional."
    )
    add_bullet_point(
        doc,
        "Identificar y analizar las métricas clave ",
        "de rendimiento de software y hardware (tiempo de respuesta, latencia, Throughput, tasas de error, concurrencia y uso de recursos de servidor) fundamentales para evaluar la calidad de servicio (QoS)."
    )
    add_bullet_point(
        doc,
        "Evaluar comparativamente las herramientas líderes ",
        "del sector tecnológico para la simulación de carga (Apache JMeter, Grafana k6 y Locust) detallando su arquitectura, idoneidad de uso, lenguajes de scripting y curva de aprendizaje."
    )
    add_bullet_point(
        doc,
        "Desarrollar ejemplos prácticos de codificación ",
        "de scripts de prueba unificados en una sola herramienta y lenguaje (Grafana k6 y JavaScript) para facilitar la compresión de la lógica de prueba por parte de los estudiantes."
    )
    add_bullet_point(
        doc,
        "Simular un caso de estudio real ",
        "aplicado a la Plataforma de Matrícula Académica Online del IES HV4NTA, diagnosticando un cuello de botella de base de datos e infraestructura y demostrando empíricamente las mejoras post-optimización."
    )
    add_bullet_point(
        doc,
        "Proponer un conjunto de recomendaciones metodológicas ",
        "y mejores prácticas de optimización para integrar las pruebas de rendimiento en el ciclo de vida del desarrollo de software mediante enfoques modernos de pruebas tempranas (Shift-Left Testing)."
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 3. DESARROLLO DEL TEMA
    # ==========================================
    add_heading_1(doc, "3. DESARROLLO DEL TEMA")
    
    add_heading_2(doc, "3.1. Definición de Pruebas de Rendimiento (Performance Testing)")
    add_body_paragraph(
        doc,
        "De manera formal, las pruebas de rendimiento (Performance Testing) constituyen una disciplina de control de calidad no funcional que "
        "consiste en evaluar cómo se comporta un sistema de software en términos de velocidad de procesamiento, estabilidad ante la concurrencia, "
        "escalabilidad arquitectónica y eficiencia en el uso de recursos bajo una carga de trabajo determinada. A diferencia de las pruebas "
        "funcionales, que buscan responder a la pregunta de si el software hace lo que se supone que debe hacer, las pruebas de rendimiento "
        "responden a la pregunta de cómo de rápido y de forma qué estable realiza el software sus tareas (Molyneaux, 2014)."
    )
    
    add_body_paragraph(
        doc,
        "En términos metodológicos, la norma internacional ISO/IEC 25010 para la calidad del producto de software categoriza esta área bajo la "
        "característica de 'Eficiencia de Desempeño' (Performance Efficiency). Esta característica se desglosa a su vez en tres subcaracteristicas "
        "fundamentales: comportamiento temporal (capacidad de respuesta y tiempos de espera), utilización de recursos (cantidades de hardware "
        "consumido para realizar las tareas) y capacidad (límites de almacenamiento, transacciones y usuarios). Las pruebas de rendimiento son, "
        "por lo tanto, el medio empírico mediante el cual estas subcaracterísticas se miden y validan. Estas pruebas requieren de entornos "
        "de ejecución controlados e instrumentación precisa, ya que buscan identificar variaciones sutiles causadas por configuraciones de red, "
        "compilaciones de código, indexación de bases de datos y la capacidad física de los servidores."
    )
    
    # Placeholder for general performance testing architecture
    add_image_placeholder(
        doc, 
        "1", 
        "Arquitectura General de un Entorno de Pruebas de Rendimiento", 
        "Esta ilustración muestra la distribución de componentes involucrados: la máquina controladora (Master), los agentes inyectores de carga (Workers) que simulan usuarios virtuales y los servidores bajo prueba (servidor web, base de datos y cache)."
    )
    
    add_heading_2(doc, "3.2. Diferencias entre Carga, Estrés, Rendimiento y Otros Tipos de Pruebas")
    add_body_paragraph(
        doc,
        "Uno de los errores más comunes en la práctica de pruebas de software es utilizar de forma indistinta y sin rigor técnico los conceptos de "
        "rendimiento, carga y estrés. Aunque todas estas pruebas comparten tecnologías de simulación y monitoreo similares, sus objetivos "
        "estratégicos, perfiles de carga y metodologías de diseño son fundamentalmente diferentes:"
    )
    
    add_heading_3(doc, "3.2.1. Pruebas de Rendimiento (Performance Testing)")
    add_body_paragraph(
        doc,
        "Es el concepto general que engloba a todas las demás variantes de pruebas orientadas a la eficiencia. Su fin primordial es establecer la "
        "línea base (baseline) del sistema, midiendo la velocidad, el tiempo de respuesta y el consumo de recursos de CPU y memoria en condiciones "
        "normales o ideales. Sirve para validar si la aplicación cumple con los acuerdos de nivel de servicio mínimos y los requisitos no funcionales "
        "definidos por el negocio o los arquitectos de software."
    )
    
    add_heading_3(doc, "3.2.2. Pruebas de Carga (Load Testing)")
    add_body_paragraph(
        doc,
        "Están diseñadas para evaluar el comportamiento del sistema cuando se le somete a la carga de trabajo máxima esperada en producción "
        "(por ejemplo, un volumen de transacciones u usuarios virtuales que los análisis estadísticos prevén para un día normal). El objetivo de las "
        "pruebas de carga es verificar que la aplicación responda dentro de los límites aceptables de tiempo de respuesta y que no se produzcan "
        "fallos de hardware o software bajo la demanda operativa proyectada. Se enfoca en la validación del rendimiento a niveles de diseño."
    )
    
    add_heading_3(doc, "3.2.3. Pruebas de Estrés (Stress Testing)")
    add_body_paragraph(
        doc,
        "Consisten en someter al sistema a condiciones que superan deliberadamente su capacidad operativa planificada, incrementando la concurrencia "
        "de usuarios o el volumen de transacciones hasta que el sistema falle o colapse (breaking point). El propósito de las pruebas de estrés "
        "no es medir el tiempo de respuesta rápido, sino responder a dos preguntas fundamentales: ¿En qué punto y de qué manera falla el sistema? "
        "y ¿Cómo se comporta tras el fallo? Es decir, si el sistema es capaz de recuperarse automáticamente una vez cesa la sobrecarga (resiliencia "
        "y elasticidad) o si requiere de intervención humana manual debido a la corrupción de la base de datos o caída permanente de servicios."
    )
    
    add_heading_3(doc, "3.2.4. Pruebas de Resistencia o Fatiga (Endurance / Soak Testing)")
    add_body_paragraph(
        doc,
        "Estas pruebas evalúan el comportamiento del sistema bajo una carga de trabajo constante e importante durante un intervalo de tiempo "
        "prolongado (horas, días o semanas). Su objetivo principal es detectar problemas silenciosos que no se manifiestan en pruebas cortas. Entre "
        "estos problemas destacan las fugas de memoria (memory leaks), donde el software asigna memoria RAM pero no la libera, el llenado paulatino "
        "de discos duros por logs de depuración excesivos, el agotamiento paulatino de los pools de conexión a la base de datos o la degradación "
        "de rendimiento debido a la fragmentación de datos."
    )
    
    add_heading_3(doc, "3.2.5. Pruebas de Pico (Spike Testing)")
    add_body_paragraph(
        doc,
        "Evalúan la capacidad del sistema para responder a cambios bruscos, repentinos e instantáneos en la carga de usuarios (por ejemplo, el paso "
        "de 10 usuarios concurrentes a 1,000 en cuestión de segundos, seguido de una disminución rápida). Estos escenarios son comunes cuando una "
        "institución envía una notificación masiva por SMS, correo electrónico, o durante eventos flash de ventas. Permite evaluar si los mecanismos "
        "de auto-escalado (auto-scaling) de la nube y los balanceadores de carga reaccionan lo suficientemente rápido sin denegar el servicio."
    )
    
    add_heading_3(doc, "3.2.6. Pruebas de Escalabilidad (Scalability Testing)")
    add_body_paragraph(
        doc,
        "Tienen como fin determinar la capacidad del software para crecer de forma proporcional a la adición de recursos físicos (escalamiento vertical: "
        "más CPU/RAM; o escalamiento horizontal: más nodos de servidores). Mide la eficiencia del sistema y busca predecir el coste económico del "
        "infraestructura a medida que crece el número de clientes."
    )
    
    add_body_paragraph(
        doc,
        "A continuación se presenta una tabla comparativa sintética para facilitar la asimilación conceptual de estas disciplinas por parte del estudiante:"
    )
    
    add_custom_table(
        doc,
        ["Tipo de Prueba", "Objetivo Principal", "Perfil de Carga", "Métrica Crítica a Evaluar"],
        [
            ["Rendimiento", "Establecer la línea base y verificar SLAs.", "Carga baja a moderada.", "Tiempos de respuesta óptimos."],
            ["Carga", "Validar el comportamiento con demanda máxima esperada.", "Carga esperada en producción.", "Tiempos de respuesta y Throughput bajo diseño."],
            ["Estrés", "Encontrar el punto de quiebre y evaluar recuperación.", "Carga incremental hasta el fallo.", "Punto de saturación y resiliencia del sistema."],
            ["Resistencia", "Detectar degradación de rendimiento y memory leaks.", "Carga constante prolongada.", "Consumo de memoria RAM y estabilidad a largo plazo."],
            ["Pico", "Evaluar la respuesta ante cambios drásticos de tráfico.", "Incrementos súbitos y masivos.", "Estabilidad de balanceadores y velocidad de escalado."]
        ]
    )
    
    add_heading_2(doc, "3.3. Importancia de las Pruebas de Rendimiento en el Diseño y Programación Web")
    add_body_paragraph(
        doc,
        "En el contexto actual de la programación web, la velocidad de una aplicación se ha convertido en un requisito de calidad de primer orden. "
        "Los usuarios modernos demuestran una tolerancia extremadamente baja a los retrasos. Diversos estudios empíricos conducidos por gigantes "
        "tecnológicos revelan la correlación directa entre el rendimiento de las páginas web y el comportamiento del usuario. Por ejemplo, "
        "Amazon documentó que cada 100 milisegundos de latencia adicional reducía sus ventas en un 1%, mientras que Google demostró que "
        "ralentizar los resultados de búsqueda en 500 milisegundos reducía el tráfico en un 20%. En la programación web moderna, el uso extensivo "
        "de frameworks complejos en el cliente (como React, Angular o Vue) y arquitecturas basadas en microservicios y APIs REST en el backend "
        "ha incrementado la superficie de fallos relacionados con la latencia y la concurrencia."
    )
    
    add_body_paragraph(
        doc,
        "Desde la perspectiva del diseño web, el rendimiento está intrínsecamente ligado al SEO (Search Engine Optimization) y a la conversión de "
        "usuarios. Google utiliza la velocidad de carga móvil como un factor determinante de posicionamiento orgánico. Sus métricas Core Web Vitals "
        "miden aspectos clave como el Largest Contentful Paint (LCP, que evalúa el tiempo que tarda en cargarse el contenido principal), el "
        "Interaction to Next Paint (INP, que mide la interactividad y la respuesta del navegador) y el Cumulative Layout Shift (CLS, que mide "
        "la estabilidad visual). Si los servidores web del backend tardan demasiado en responder (elevando el TTFB - Time to First Byte) debido a "
        "una falta de pruebas de carga que optimice la respuesta de la base de datos, el LCP se verá negativamente afectado y el sitio web descenderá "
        "en los motores de búsqueda. Por lo tanto, el diseño web no solo abarca tipografías y paletas de colores, sino la entrega rápida y fluida "
        "de los recursos en el navegador, lo que exige una constante coordinación con las pruebas de rendimiento."
    )
    
    add_heading_2(doc, "3.4. Casos de Uso Comunes")
    add_body_paragraph(
        doc,
        "Las pruebas de carga y rendimiento deben aplicarse de forma estratégica a lo largo del ciclo de vida del software, adaptándose a "
        "las necesidades de cada proyecto. Algunos de los casos de uso más destacados incluyen:"
    )
    add_bullet_point(
        doc,
        "Lanzamientos de Campañas Especiales: ",
        "Portales de e-commerce que lanzan promociones como el Black Friday o Cyber Monday. Estos eventos concentran miles de transacciones de compra y pago en lapsos muy reducidos, exigiendo pruebas de estrés previas para evitar pérdidas económicas millonarias."
    )
    add_bullet_point(
        doc,
        "Procesos Institucionales Masivos: ",
        "En el ámbito académico (como el IES HV4NTA), los sistemas de matrícula académica virtual o las plataformas de exámenes online representan escenarios clásicos de alta demanda. La concurrencia masiva de estudiantes en los primeros minutos de apertura del proceso suele tumbar sistemas mal optimizados."
    )
    add_bullet_point(
        doc,
        "Validación de Integración Continua (CI/CD): ",
        "En metodologías DevOps, la ejecución automatizada de pruebas de rendimiento a nivel de API tras cada nueva versión de código garantiza que no se introduzcan regresiones de velocidad en los microservicios clave."
    )
    add_bullet_point(
        doc,
        "Migraciones Arquitectónicas y de Nube: ",
        "Evaluar el rendimiento antes y después de migrar un sistema web desde servidores físicos dedicados (on-premises) hacia entornos de nube pública (AWS, Azure o GCP) para validar el correcto dimensionamiento (sizing) de las instancias configuradas."
    )
    
    add_heading_2(doc, "3.5. Métricas Clave de Rendimiento")
    add_body_paragraph(
        doc,
        "Para llevar a cabo un análisis científico del comportamiento de una aplicación web, no es suficiente indicar que la aplicación funciona "
        "'rápido' o 'lento'. Es imperativo trabajar con métricas estandarizadas, cuantificables y reproducibles:"
    )
    
    add_heading_3(doc, "3.5.1. Tiempo de Respuesta (Response Time) y Latencia")
    add_body_paragraph(
        doc,
        "El tiempo de respuesta es el tiempo transcurrido desde que un cliente envía una solicitud HTTP hasta que recibe la respuesta completa "
        "en el navegador. La latencia, por su parte, es el tiempo que tarda la solicitud en viajar al servidor más el tiempo que tarda el servidor "
        "en procesar y retornar el primer byte de información (Time to First Byte - TTFB). En el análisis de rendimiento es crucial evitar el "
        "uso del promedio matemático simple para los tiempos de respuesta. Los promedios tienden a enmascarar comportamientos anómalos o cuellos "
        "de botella que afectan a un porcentaje menor de usuarios. En su lugar, se utilizan los percentiles (p50, p90, p95, p99). Por ejemplo, un "
        "percentil 95 (p95) de 500ms significa que el 95% de todos los usuarios experimentaron un tiempo de respuesta de 500ms o menos, mientras "
        "que un 5% sufrió tiempos superiores. Esto permite identificar la experiencia real de los usuarios en los peores escenarios de carga."
    )
    
    add_heading_3(doc, "3.5.2. Throughput (Rendimiento o Tasa de Transferencia)")
    add_body_paragraph(
        doc,
        "Representa la cantidad de trabajo o transacciones que un sistema puede procesar por unidad de tiempo. En aplicaciones web, se mide "
        "habitualmente en solicitudes por segundo (Requests Per Second - RPS) o transacciones por segundo (Transactions Per Second - TPS). Un "
        "Throughput alto indica una excelente capacidad del sistema para despachar trabajo. Sin embargo, el Throughput debe analizarse de forma "
        "correlacionada con la concurrencia: si aumentamos los usuarios pero el Throughput se estanca y los tiempos de respuesta se disparan, el "
        "sistema ha alcanzado su límite de saturación."
    )
    
    add_heading_3(doc, "3.5.3. Concurrencia (Usuarios Virtuales - VUs)")
    add_body_paragraph(
        doc,
        "Es el número de clientes simulados que realizan solicitudes de forma simultánea al sistema de destino durante la prueba. Las herramientas "
        "de carga representan a estos usuarios como hilos de ejecución o procesos ligeros que ejecutan de forma repetida el flujo programado, "
        "incorporando tiempos de pensamiento (think time) para simular el comportamiento humano realista de navegación."
    )
    
    add_heading_3(doc, "3.5.4. Tasa de Error (Error Rate)")
    add_body_paragraph(
        doc,
        "Es el porcentaje de solicitudes fallidas con respecto al total de solicitudes enviadas. Los fallos pueden manifestarse como errores de "
        "red, tiempos de espera agotados (timeouts) o respuestas del servidor con códigos de estado HTTP de la serie 5xx (Internal Server Error, "
        "Bad Gateway, Gateway Timeout). También incluye fallas de aserción (por ejemplo, cuando el servidor retorna un código 200 OK pero la página "
        "devuelta contiene un mensaje de error o no muestra los datos esperados)."
    )
    
    add_heading_3(doc, "3.5.5. Utilización de Recursos del Servidor (Server Resource Utilization)")
    add_body_paragraph(
        doc,
        "Mide el desgaste físico de la infraestructura que soporta la aplicación. Las métricas críticas incluyen el porcentaje de uso de la CPU, "
        "el consumo de memoria RAM, la tasa de transferencia de datos en la interfaz de red (Network I/O) y el tiempo de lectura/escritura en el "
        "disco (Disk I/O). Un uso constante de CPU cercano al 100% en el servidor de base de datos indica un cuello de botella de procesamiento "
        "o la necesidad de optimizar consultas SQL."
    )
    
    add_heading_2(doc, "3.6. Herramientas de Pruebas de Rendimiento")
    add_body_paragraph(
        doc,
        "La simulación de cientos o miles de usuarios reales interactuando con un sistema requiere el uso de software especializado. "
        "A continuación se analizan las tres herramientas libres y de código abierto más extendidas en la industria del software:"
    )
    
    add_heading_3(doc, "3.6.1. Apache JMeter")
    add_body_paragraph(
        doc,
        "Es la herramienta de pruebas de carga pionera, desarrollada completamente en Java por la Apache Software Foundation. Su funcionamiento "
        "se basa en una interfaz gráfica de usuario (GUI) muy potente que permite diseñar planes de prueba complejos estructurados en forma de "
        "árbol de componentes. Soporta una enorme variedad de protocolos (HTTP, HTTPS, JDBC para bases de datos, SOAP/REST, FTP, LDAP). Sin embargo, "
        "posee un gran inconveniente: su arquitectura orientada a hilos (thread-per-user). Cada usuario virtual simulado por JMeter se mapea con "
        "un hilo del sistema operativo del generador de carga. Esto provoca un altísimo consumo de memoria RAM y CPU en la máquina que ejecuta las "
        "pruebas, limitando la cantidad de usuarios que se pueden simular sin recurrir a una infraestructura de pruebas distribuida y compleja. "
        "JMeter es ideal para pruebas empresariales corporativas y protocolos legacy."
    )
    
    add_heading_3(doc, "3.6.2. Grafana k6")
    add_body_paragraph(
        doc,
        "k6 es una herramienta moderna desarrollada en Go por Load Impact (adquirida posteriormente por Grafana Labs). Se caracteriza por ser "
        "CLI-first (interfaz de línea de comandos) y por utilizar JavaScript para la codificación de los scripts de prueba. Su arquitectura es "
        "altamente eficiente: en lugar de asignar un hilo del sistema operativo por usuario, Go utiliza corrutinas internas ligeras gestionadas por "
        "un bucle de eventos. Esto permite que una única máquina estándar simule miles de usuarios virtuales concurrentes con un consumo de recursos "
        "escasamente apreciable. k6 fue diseñada con una filosofía orientada a desarrolladores y DevOps, facilitando su integración en pipelines de CI/CD. "
        "Soporta aserciones de rendimiento sofisticadas (Thresholds) que fallan el build si los tiempos de respuesta exceden las métricas deseadas."
    )
    
    add_heading_3(doc, "3.6.3. Locust")
    add_body_paragraph(
        doc,
        "Locust es una herramienta de carga escrita y configurada completamente en Python puro. Destaca por su enfoque amigable con el desarrollador: "
        "no requiere de interfaces gráficas pesadas ni de archivos de configuración XML (como JMeter). Toda la lógica de comportamiento del usuario, "
        "desde la navegación hasta el envío de datos, se programa en clases de Python usando corrutinas del módulo gevent. Cuenta con una interfaz web "
        "muy intuitiva e interactiva que muestra gráficos en tiempo real sobre los tiempos de respuesta y solicitudes procesadas. Destaca por su facilidad "
        "para realizar pruebas distribuidas de forma masiva: levantar nodos esclavos (workers) y conectarlos a un nodo maestro requiere de una línea "
        "de comando simple."
    )
    
    add_body_paragraph(
        doc,
        "A continuación se presenta una tabla comparativa técnica detallada de las herramientas analizadas:"
    )
    
    add_custom_table(
        doc,
        ["Característica", "Apache JMeter", "Grafana k6", "Locust"],
        [
            ["Lenguaje de Scripting", "XML / GUI (soporta Groovy/JS)", "JavaScript (ES6)", "Python"],
            ["Consumo de Recursos", "Alto (arquitectura de hilos Java)", "Muy Bajo (arquitectura Go)", "Bajo (corrutinas gevent)"],
            ["Protocolos Soportados", "HTTP/S, JDBC, FTP, JMS, SOAP", "HTTP/S, WebSockets, gRPC", "HTTP/S (extensible mediante Python)"],
            ["Curva de Aprendizaje", "Media (GUI compleja)", "Baja-Media (conocimiento de JS)", "Baja (sintaxis Python amigable)"],
            ["Orientación CI/CD", "Media (mediante consola CLI)", "Excelente (diseñado para DevOps)", "Buena (ejecución sin GUI)"],
            ["Interfaz de Reportes", "Tablas y gráficos generados pos-test", "Consola, Grafana Cloud, archivos JSON", "Gráficos web interactivos en tiempo real"]
        ]
    )
    
    # Placeholder for k6 execution flow/architecture
    add_image_placeholder(
        doc, 
        "2", 
        "Arquitectura Interna y Ciclo de Ejecución de Grafana k6", 
        "Este diagrama ilustra cómo k6 gestiona la ejecución basada en VUs (Virtual Users) a través de instancias aisladas de motores de JavaScript (Goja), optimizando el uso de la memoria RAM del sistema inyector."
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 4. INTERPRETACIÓN DE RESULTADOS
    # ==========================================
    add_heading_1(doc, "4. INTERPRETACIÓN DE RESULTADOS Y DETECCIÓN DE CUELLOS DE BOTELLA")
    
    add_body_paragraph(
        doc,
        "La ejecución de una prueba de carga genera millones de puntos de datos que se consolidan en reportes estadísticos. La interpretación "
        "de estos resultados constituye la fase más crítica y compleja del proceso de pruebas de rendimiento. Un error común es asumir que si "
        "el software no colapsa, la prueba ha sido exitosa. Es necesario analizar sistemáticamente las curvas de comportamiento y correlacionar "
        "los datos de tráfico con el consumo de hardware."
    )
    
    add_heading_2(doc, "4.1. Correlación de Métricas y Punto de Saturación")
    add_body_paragraph(
        doc,
        "Durante una prueba de carga incremental (donde la concurrencia de usuarios virtuales sube progresivamente en rampa), el Throughput "
        "(RPS) y el Tiempo de Respuesta deben seguir un comportamiento predecible:"
    )
    add_bullet_point(
        doc,
        "Fase Lineal: ",
        "Al principio de la prueba, a medida que aumentan los usuarios concurrentes, el Throughput (solicitudes por segundo) sube de forma proporcional y lineal, mientras que el Tiempo de Respuesta se mantiene constante y bajo. El sistema opera holgadamente."
    )
    add_bullet_point(
        doc,
        "Fase de Saturación: ",
        "Llega un punto en el que los recursos físicos de los servidores (generalmente la CPU o el pool de hilos de conexión a base de datos) alcanzan su límite. A partir de este momento, aunque se sigan agregando usuarios concurrentes a la prueba, el Throughput deja de crecer y se aplana (meseta). Al mismo tiempo, el Tiempo de Respuesta comienza a aumentar de forma exponencial. Esto se explica por la teoría de colas: las nuevas peticiones no pueden procesarse de inmediato y deben esperar en cola."
    )
    add_bullet_point(
        doc,
        "Fase de Degradación y Colapso (Breaking Point): ",
        "Si la carga sigue aumentando más allá del punto de saturación, el Throughput caerá drásticamente y la tasa de errores de conexión o fallos internos HTTP 500/504 se disparará al 100%. El sistema ha colapsado. Identificar con precisión el punto exacto de saturación y colapso permite definir los límites operativos reales del software."
    )
    
    # Placeholder for load testing curves
    add_image_placeholder(
        doc, 
        "3", 
        "Gráfico Típico de Curva de Rendimiento: Usuarios Concurrentes vs Tiempos de Respuesta vs Throughput", 
        "El gráfico representa la intersección teórica del punto de saturación (Saturation Point) donde el tiempo de respuesta comienza a dispararse de manera exponencial mientras que el Throughput (RPS) se estanca en una meseta plana."
    )
    
    add_heading_2(doc, "4.2. Identificación de Cuellos de Botella (Bottlenecks)")
    add_body_paragraph(
        doc,
        "Un cuello de botella es un elemento de software o hardware que limita el rendimiento global del sistema, impidiendo que escale de forma "
        "eficiente. Los cuellos de botella más comunes se clasifican de la siguiente manera:"
    )
    
    add_heading_3(doc, "4.2.1. Cuellos de Botella en la Base de Datos (Database-bound)")
    add_body_paragraph(
        doc,
        "Es el cuello de botella más recurrente en aplicaciones web transaccionales. Se manifiesta cuando el servidor de base de datos presenta "
        "un uso de CPU del 100% mientras que el servidor web se encuentra con baja carga. Las causas principales son la ausencia de índices "
        "apropiados en las tablas SQL, lo que obliga al motor de base de datos a realizar escaneos completos de tablas (table scans) muy ineficientes, "
        "o la ejecución de consultas repetitivas dentro de bucles (problema de consultas N+1 en frameworks ORM como Laravel o Hibernate). También "
        "puede deberse a bloqueos de filas o tablas (row/table locking) prolongados por transacciones mal diseñadas."
    )
    
    add_heading_3(doc, "4.2.2. Cuellos de Botella en el Servidor de Aplicaciones (CPU/Memory-bound)")
    add_body_paragraph(
        doc,
        "Ocurre cuando el código de la aplicación realiza operaciones de cómputo ineficientes, como algoritmos de ordenamiento pesados, "
        "serializaciones de datos JSON/XML masivas, o procesos de cifrado de datos reiterativos. En sistemas basados en Java, un cuello de botella de memoria "
        "común es la recolección de basura (Garbage Collection) agresiva y frecuente. Si la memoria RAM del servidor de aplicaciones es "
        "insuficiente, la máquina virtual pasará más tiempo liberando memoria que ejecutando código útil, congelando las peticiones temporalmente "
        "y provocando picos de latencia elevados."
    )
    
    add_heading_3(doc, "4.2.3. Agotamiento de Pools de Conexión (Pool Exhaustion)")
    add_body_paragraph(
        doc,
        "Los servidores web (como Apache, Nginx o PHP-FPM) y los servidores de aplicaciones limitan la cantidad máxima de conexiones o procesos "
        "hijos concurrentes que pueden manejar simultáneamente (por ejemplo, el parámetro `pm.max_children` en PHP-FPM). Si la base de datos "
        "responde lentamente, las peticiones web se quedan retenidas ocupando un proceso del pool. Cuando el pool se agota por completo, las "
        "nuevas conexiones entrantes son rechazadas inmediatamente por el balanceador o por el servidor web frontal, arrojando errores "
        "como HTTP 504 Gateway Timeout o HTTP 502 Bad Gateway."
    )
    
    add_heading_2(doc, "4.3. Fundamentos Teóricos: Ley de Little y Ley de Amdahl")
    add_body_paragraph(
        doc,
        "El análisis cualitativo del rendimiento debe respaldarse en leyes matemáticas y físicas fundamentales de la informática:"
    )
    
    add_heading_3(doc, "4.3.1. Ley de Little")
    add_body_paragraph(
        doc,
        "Formulada por John Little en 1961, esta ley de la teoría de colas establece que el número promedio de elementos en un sistema de cola "
        "estacionario (L) es igual a la tasa promedio de llegada de dichos elementos (lambda) multiplicada por el tiempo promedio que un elemento "
        "pasa dentro del sistema (W):"
    )
    add_body_paragraph(
        doc,
        "L = lambda * W",
        alignment=WD_ALIGN_PARAGRAPH.CENTER
    )
    add_body_paragraph(
        doc,
        "En el contexto de las pruebas de rendimiento web, L representa el número de usuarios virtuales concurrentes interactuando con el "
        "sistema, lambda es el Throughput en solicitudes por segundo (RPS) y W es el tiempo de respuesta promedio. Esta ley demuestra que si "
        "el tiempo de respuesta (W) aumenta al doble, para mantener el mismo Throughput (lambda), el número de solicitudes en vuelo (concurrencia, "
        "L) en las colas del servidor debe duplicarse. Si el servidor no cuenta con capacidad física de encolado, la tasa de error se incrementará."
    )
    
    add_heading_3(doc, "4.3.2. Ley de Amdahl")
    add_body_paragraph(
        doc,
        "En la ingeniería de rendimiento, la Ley de Amdahl modela la mejora teórica máxima que puede experimentar un sistema informático completo "
        "cuando se optimiza únicamente una sección o parte específica del mismo. Si un programa realiza el 90% de sus tareas en consultas a la "
        "base de datos y solo el 10% en código del servidor web, optimizar al extremo el código del servidor web (haciéndolo 10 veces más rápido) "
        "apenas mejorará el rendimiento global de la aplicación en un 9%. Esta ley enseña al estudiante de pruebas de software que los esfuerzos "
        "de optimización deben dirigirse de manera matemática y empírica hacia las partes del sistema que concentran el mayor porcentaje del "
        "tiempo de ejecución global (los componentes secuenciales no paralelizables)."
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 5. EJEMPLOS PRÁCTICOS
    # ==========================================
    add_heading_1(doc, "5. EJEMPLOS PRÁCTICOS DE SCRIPTING UNIFICADOS EN GRAFANA k6")
    
    add_body_paragraph(
        doc,
        "Para consolidar el aprendizaje procedimental de manera clara y directa, se seleccionó a Grafana k6 como la herramienta única de "
        "scripting para todos los ejemplos y demostraciones del informe. Dado que los estudiantes del programa de Diseño y Programación Web "
        "poseen conocimientos sólidos en JavaScript, el uso de k6 evita la sobrecarga cognitiva de aprender múltiples lenguajes de programación "
        "(como Python para Locust) o estructuras jerárquicas complejas en XML (como Apache JMeter). Los scripts se escriben en JavaScript (ES6) "
        "estándar, lo que facilita enormemente la comprensión y asimilación de la lógica de las pruebas de carga."
    )
    
    add_heading_2(doc, "5.1. Ejemplo 1: Script de Validación Básica (Smoke Test)")
    add_body_paragraph(
        doc,
        "Este primer ejemplo muestra un script básico de un solo usuario virtual (VU) orientado a comprobar la salud general (Health Check) de un "
        "endpoint de API en el servidor web. Realiza una petición GET y valida mediante una aserción básica (check) que el estado de respuesta "
        "HTTP devuelto por el servidor sea 200 OK."
    )
    
    add_code_block(
        doc,
        "import http from 'k6/http';\n"
        "import { check, sleep } from 'k6';\n\n"
        "// Configuración de ejecución simple: 1 usuario virtual ejecutando 1 iteración\n"
        "export const options = {\n"
        "    vus: 1,\n"
        "    iterations: 1,\n"
        "};\n\n"
        "export default function () {\n"
        "    const url = 'https://api.ieshv4nta.edu.pe/v1/health';\n"
        "    \n"
        "    // Ejecutar petición HTTP GET\n"
        "    const res = http.get(url);\n\n"
        "    // Validar que el servidor web retorne un código de estado 200\n"
        "    check(res, {\n"
        "        'El estado de respuesta HTTP es 200': (r) => r.status === 200,\n"
        "        'El tiempo de respuesta es aceptable (<1s)': (r) => r.timings.duration < 1000,\n"
        "    });\n\n"
        "    // Tiempo de espera simulado (think time) de 1 segundo\n"
        "    sleep(1);\n"
        "}"
    )
    
    add_heading_2(doc, "5.2. Ejemplo 2: Script de Carga Incremental y SLAs (Load Test con Stages y Thresholds)")
    add_body_paragraph(
        doc,
        "El siguiente script implementa una prueba de carga formal. Define etapas de subida gradual de usuarios concurrentes (Ramp-up), "
        "sostenimiento en meseta (Plateau) y descenso (Ramp-down). Adicionalmente, incluye el concepto crítico de Acuerdos de Nivel de Servicio "
        "(SLAs) mediante la sección de 'thresholds', indicando que la prueba se considerará fallida si el 95% de las solicitudes superan "
        "los 500ms o si se excede el 1% de errores en las peticiones."
    )
    
    add_code_block(
        doc,
        "import http from 'k6/http';\n"
        "import { check, sleep } from 'k6';\n\n"
        "// Configuración del escenario de carga incremental y SLAs\n"
        "export const options = {\n"
        "    stages: [\n"
        "        { duration: '30s', target: 50 }, // Subida gradual a 50 usuarios virtuales\n"
        "        { duration: '1m', target: 50 },  // Mantener los 50 usuarios durante 1 minuto\n"
        "        { duration: '30s', target: 0 },  // Descenso gradual a 0 usuarios\n"
        "    ],\n"
        "    thresholds: {\n"
        "        http_req_duration: ['p(95)<500'], // El 95% de las solicitudes debe durar menos de 500ms\n"
        "        http_req_failed: ['rate<0.01'],    // La tasa de error debe ser menor al 1%\n"
        "    },\n"
        "};\n\n"
        "export default function () {\n"
        "    const url = 'https://api.ieshv4nta.edu.pe/v1/cursos';\n"
        "    const res = http.get(url);\n\n"
        "    // Validación del estado de respuesta\n"
        "    check(res, {\n"
        "        'Carga exitosa de asignaturas (200)': (r) => r.status === 200,\n"
        "    });\n\n"
        "    // Simular tiempo de lectura aleatorio entre 1 y 3 segundos\n"
        "    sleep(Math.random() * 2 + 1);\n"
        "}"
    )
    
    add_heading_2(doc, "5.3. Ejemplo 3: Script de Flujo Transaccional con Payload JSON (Prueba de API POST)")
    add_body_paragraph(
        doc,
        "Este tercer ejemplo ilustra cómo probar flujos interactivos de escritura de datos, comunes en el desarrollo web. Simula el envío de "
        "un formulario de matrícula a una API REST, configurando las cabeceras HTTP necesarias, serializando un payload JSON y validando tanto el "
        "código de estado como el contenido de la respuesta devuelta por el backend."
    )
    
    add_code_block(
        doc,
        "import http from 'k6/http';\n"
        "import { check, sleep } from 'k6';\n\n"
        "export const options = {\n"
        "    vus: 10,\n"
        "    duration: '30s',\n"
        "};\n\n"
        "export default function () {\n"
        "    const url = 'https://api.ieshv4nta.edu.pe/v1/matricula/guardar';\n"
        "    \n"
        "    // Datos del formulario serializados en formato JSON\n"
        "    const payload = JSON.stringify({\n"
        "        estudiante_id: 1024,\n"
        "        cursos_seleccionados: [101, 103, 105],\n"
        "        confirmacion_terminos: true\n"
        "    });\n\n"
        "    // Definir cabeceras HTTP para la transacción\n"
        "    const params = {\n"
        "        headers: {\n"
        "            'Content-Type': 'application/json',\n"
        "            'Authorization': 'Bearer token_simulado_estudiante_qa_123'\n"
        "        },\n"
        "    };\n\n"
        "    // Ejecutar petición POST de escritura\n"
        "    const res = http.post(url, payload, params);\n\n"
        "    // Comprobar respuesta de creación exitosa (HTTP 201 Created)\n"
        "    check(res, {\n"
        "        'Creación de matrícula exitosa (201)': (r) => r.status === 201,\n"
        "        'Retorna código de confirmación': (r) => r.body.includes('codigo_registro'),\n"
        "    });\n\n"
        "    sleep(2);\n"
        "}"
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 6. CASO DE ESTUDIO
    # ==========================================
    add_heading_1(doc, "6. CASO DE ESTUDIO: PLATAFORMA DE MATRÍCULA ONLINE DEL IES HV4NTA")
    
    add_body_paragraph(
        doc,
        "Para plasmar los conceptos teóricos y metodológicos descritos en un entorno práctico y real, se presenta el siguiente caso de estudio "
        "referido al proceso de remediación y optimización del portal web académico de matrícula del Instituto de Educación Superior Tecnológico "
        "Público HV4NTA."
    )
    
    add_heading_2(doc, "6.1. Planteamiento de la Problemática")
    add_body_paragraph(
        doc,
        "El IES HV4NTA cuenta con una aplicación web intranet de matrícula implementada bajo una arquitectura tradicional de tres capas: una "
        "interfaz de usuario web desarrollada en HTML5, CSS3 y vanilla JavaScript; un servidor de aplicaciones en Laravel (PHP 8.2) que ejecuta "
        "la lógica del negocio; y un servidor de bases de datos relacional MySQL 8.0. La infraestructura física se compone de un servidor privado "
        "virtual (VPS) en una nube comercial con 2 núcleos de CPU vCPU y 4 GB de memoria RAM de especificación media."
    )
    
    add_body_paragraph(
        doc,
        "Durante el proceso de matrícula académica correspondiente al semestre 2026-I, se programó la apertura de inscripciones para las "
        "carreras de Computación e Informática y Diseño y Programación Web de manera simultánea. Se estimaba que un grupo aproximado de 500 estudiantes "
        "intentarían acceder de forma inmediata y en un margen de 10 minutos para separar sus vacantes en las diferentes asignaturas del semestre. "
        "A los pocos minutos de abrir el portal, el sistema colapsó por completo: los estudiantes reportaron tiempos de espera que superaban "
        "los 15 segundos por pantalla, seguido de la aparición generalizada de errores HTTP 504 Gateway Timeout y HTTP 500 Internal Server Error. "
        "El portal debió ser apagado temporalmente y el proceso se pospuso, generando quejas masivas y una sobrecarga administrativa en el instituto."
    )
    
    add_heading_2(doc, "6.2. Diseño de la Prueba de Carga Inicial (Línea Base)")
    add_body_paragraph(
        doc,
        "El equipo técnico de desarrollo del instituto, encargado del aseguramiento de la calidad de software (QA), procedió a reproducir de forma "
        "controlada el fallo en un entorno clonado de pre-producción que replicaba con total exactitud las características de hardware y base de "
        "datos del servidor de producción. Para la simulación se utilizó la herramienta unificada Grafana k6."
    )
    
    add_body_paragraph(
        doc,
        "El perfil de carga diseñado en k6 consistió en una prueba de carga incremental (ramp-up) de 0 a 500 usuarios virtuales concurrentes durante "
        "un período de 5 minutos, seguida de una meseta (steady-state) de 5 minutos de duración con los 500 usuarios ejecutando transacciones "
        "continuas, finalizando con un descenso rápido (ramp-down) de 2 minutos. El flujo de navegación simulado para cada usuario constaba de "
        "tres pasos críticos:"
    )
    add_bullet_point(doc, "Paso 1: Autenticación. ", "Petición POST al endpoint `/api/auth/login` con credenciales de prueba.")
    add_bullet_point(
        doc,
        "Paso 2: Consulta de asignaturas. ",
        "Petición GET al endpoint `/api/matricula/cursos` para visualizar las asignaturas disponibles, sus semestres, horarios y vacantes actuales."
    )
    add_bullet_point(
        doc,
        "Paso 3: Envío de matrícula. ",
        "Petición POST al endpoint `/api/matricula/guardar` enviando el listado de 5 asignaturas seleccionadas por el alumno."
    )
    
    add_heading_2(doc, "6.3. Resultados de la Prueba Inicial y Diagnóstico de Cuellos de Botella")
    add_body_paragraph(
        doc,
        "Durante la ejecución de la prueba inicial, se monitoreó en tiempo real tanto el comportamiento de la aplicación web como el consumo de "
        "hardware en el VPS mediante herramientas del sistema (`top`, `htop`, `iostat` y logs de MySQL). La prueba debió interrumpirse en el minuto 6 "
        "debido a la saturación total del entorno. Los resultados obtenidos antes del colapso se resumen en la siguiente tabla:"
    )
    
    add_custom_table(
        doc,
        ["Métrica de Rendimiento", "Valor Registrado", "Estado y Diagnóstico"],
        [
            ["Usuarios Concurrentes Alcanzados", "210 VUs", "El sistema colapsó antes de llegar a los 500 previstos."],
            ["Tiempo de Respuesta Promedio (Paso 2)", "8,750 ms", "Inaceptable (SLA máximo definido en 1,500ms)."],
            ["Tiempo de Respuesta Percentil 95", "14,200 ms", "Los usuarios en el p95 experimentaban timeouts permanentes."],
            ["Throughput Máximo Establecido", "14.5 RPS", "Muy bajo para el volumen de peticiones simultáneas."],
            ["Tasa de Error Global", "34.5 %", "Errores masivos HTTP 504 (Nginx no recibe respuesta de PHP-FPM)."],
            ["Uso de CPU del Servidor de Base de Datos", "100.0 %", "CPU saturado completamente en procesos mysqld."],
            ["Uso de CPU del Servidor Web (PHP-FPM)", "22.0 %", "Bajo uso de CPU; el servidor web está inactivo esperando a la BD."],
            ["Conexiones Activas en MySQL", "150 (Max)", "Se alcanzó el límite de la piscina de conexiones configurada."]
        ]
    )
    
    # Placeholder for baseline test results graph
    add_image_placeholder(
        doc, 
        "4", 
        "Reporte de Tiempos de Respuesta - Prueba de Carga Inicial (Línea Base)", 
        "Esta captura representa los resultados iniciales en la consola de Grafana k6, donde se visualiza cómo el tiempo de respuesta promedio sube por encima de los 8 segundos y la tasa de error (http_req_failed) se dispara al acumularse los procesos en cola."
    )
    
    add_body_paragraph(
        doc,
        "El análisis científico de estos datos permitió diagnosticar los siguientes tres problemas en cascada:"
    )
    add_bullet_point(
        doc,
        "1. Consulta SQL no indexada (CPU al 100%): ",
        "Al inspeccionar el archivo de consultas lentas de MySQL (Slow Query Log), se descubrió que para cargar el listado de asignaturas y sus vacantes, el backend de Laravel ejecutaba la siguiente consulta: `SELECT * FROM asignaturas WHERE carrera_id = ? AND semestre_academico = ?`. La tabla `asignaturas` no poseía índices en las columnas `carrera_id` ni `semestre_academico`. MySQL debía realizar una lectura secuencial de miles de registros en disco (Full Table Scan) en cada una de las peticiones concurrentes de los estudiantes."
    )
    add_bullet_point(
        doc,
        "2. Falla de Caching (Golpe repetitivo): ",
        "El endpoint `/api/matricula/cursos` realizaba la consulta a la base de datos de manera directa y repetida en cada petición HTTP, a pesar de que el plan de estudios y la oferta de horarios son datos estáticos que no varían de un segundo a otro durante el proceso de matrícula."
    )
    add_bullet_point(
        doc,
        "3. Límite de procesos PHP-FPM: ",
        "Dado que la consulta SQL tardaba más de 4 segundos en completarse bajo carga, los procesos trabajadores de PHP-FPM se acumulaban en memoria esperando la respuesta de MySQL. En pocos segundos, se superó el límite predeterminado de procesos `pm.max_children = 20`. Nginx, al no poder delegar nuevas peticiones a PHP-FPM, empezó a retornar de inmediato errores HTTP 504 Gateway Timeout a los clientes."
    )
    
    add_heading_2(doc, "6.4. Plan de Remediación y Optimización")
    add_body_paragraph(
        doc,
        "Con base en el diagnóstico empírico, el equipo de desarrollo implementó una estrategia de optimización enfocada en resolver la raíz del "
        "problema en la base de datos e infraestructura, evitando costosos gastos de ampliación de hardware innecesarios:"
    )
    
    add_heading_3(doc, "6.4.1. Indexación de la Base de Datos")
    add_body_paragraph(
        doc,
        "Se procedió a crear un índice compuesto en MySQL sobre las columnas que filtran la consulta de asignaturas. Esto transforma la búsqueda "
        "secuencial del motor de bases de datos en una búsqueda de árbol balanceado (B-Tree), reduciendo la complejidad del algoritmo de O(N) a O(log N):"
    )
    add_code_block(
        doc,
        "ALTER TABLE asignaturas ADD INDEX idx_carrera_semestre (carrera_id, semestre_academico);"
    )
    
    add_heading_3(doc, "6.4.2. Implementación de Caché en Memoria con Redis")
    add_body_paragraph(
        doc,
        "Se integró un servidor Redis (caché en memoria de alto rendimiento) en la arquitectura. La lógica del backend en Laravel se modificó de "
        "modo que la consulta de cursos se realice primero en Redis. Si los datos existen en la caché (Cache Hit), se retornan de forma instantánea "
        "en menos de 5 milisegundos sin tocar a la base de datos MySQL. En caso de no existir (Cache Miss), se realiza la consulta a MySQL por "
        "única vez y el resultado se almacena en Redis con un tiempo de vida (TTL) de 60 segundos."
    )
    add_code_block(
        doc,
        "// Lógica optimizada del backend (Laravel/PHP)\n"
        "public function obtenerCursos(Request $request) {\n"
        "    $carreraId = $request->input('carrera_id');\n"
        "    $semestre = $request->input('semestre');\n"
        "    $cacheKey = \"cursos_carrera_{$carreraId}_sem_{$semestre}\";\n\n"
        "    return Cache::remember($cacheKey, 60, function () use ($carreraId, $semestre) {\n"
        "        return Asignatura::where('carrera_id', $carreraId)\n"
        "                         ->where('semestre_academico', $semestre)\n"
        "                         ->with('horarios')\n"
        "                         ->get();\n"
        "    });\n"
        "}"
    )
    
    add_heading_3(doc, "6.4.3. Afinación de Servidor Web y PHP-FPM")
    add_body_paragraph(
        doc,
        "Se modificó la configuración del archivo `/etc/php/8.2/fpm/pool.d/www.conf` para elevar la cantidad de procesos simultáneos de PHP-FPM, "
        "adecuándolos a la memoria RAM disponible en el VPS. Se configuró en modo dinámico, incrementando `pm.max_children` de 20 a 60, permitiendo "
        "un mayor volumen de procesamiento paralelo:"
    )
    add_code_block(
        doc,
        "pm = dynamic\n"
        "pm.max_children = 60\n"
        "pm.start_servers = 15\n"
        "pm.min_spare_servers = 10\n"
        "pm.max_spare_servers = 30\n"
        "pm.max_requests = 500"
    )
    
    add_heading_2(doc, "6.5. Ejecución de la Prueba Post-Optimización y Comparación")
    add_body_paragraph(
        doc,
        "Tras aplicar las optimizaciones, se procedió a ejecutar nuevamente la prueba de carga incremental con Grafana k6 bajo los mismos "
        "parámetros originales: subida a 500 usuarios virtuales concurrentes y sostenimiento durante 5 minutos. En esta ocasión, la prueba "
        "completó satisfactoriamente su ciclo de 12 minutos sin registrar caídas del servidor. A continuación se presenta la tabla comparativa "
        "antes y después de las optimizaciones, que sirve como evidencia del impacto de la ingeniería de rendimiento:"
    )
    
    add_custom_table(
        doc,
        ["Métrica Clave", "Antes de la Optimización", "Después de la Optimización", "Mejora Porcentual / Impacto"],
        [
            ["Usuarios Concurrentes Soportados", "210 VUs (Colapso)", "500 VUs (Estable)", "+ 138.0 % (Escalabilidad garantizada)"],
            ["Tiempo de Respuesta Promedio", "8,750 ms", "280 ms", "- 96.8 % (Respuesta casi instantánea)"],
            ["Tiempo de Respuesta Percentil 95", "14,200 ms", "495 ms", "- 96.5 % (Dentro de los límites de SLA)"],
            ["Throughput Máximo Establecido", "14.5 RPS", "125.0 RPS", "+ 762.0 % (Capacidad de procesamiento masiva)"],
            ["Tasa de Error Global", "34.50 %", "0.02 %", "Reducción a niveles insignificantes (1 error en 5000)"],
            ["Uso de CPU Servidor BD (MySQL)", "100.0 %", "24.0 %", "Liberación del servidor; base de datos holgada"],
            ["Uso de CPU Servidor Web (PHP-FPM)", "22.0 %", "55.0 %", "Uso eficiente de los recursos paralelos de PHP-FPM"],
            ["Latencia de Red / TTFB Promedio", "4,200 ms", "45 ms", "- 98.9 % (Servidor despacha rápido el primer byte)"]
        ]
    )
    
    # Placeholder for post-optimisation test results graph
    add_image_placeholder(
        doc, 
        "5", 
        "Reporte de Tiempos de Respuesta - Prueba de Carga Post-Optimización", 
        "Esta captura representa los resultados finales de ejecución en Grafana k6, donde se comprueba empíricamente la estabilidad de los tiempos de respuesta por debajo de los 300ms y una tasa de fallos insignificante bajo el escenario de 500 usuarios concurrentes."
    )
    
    add_body_paragraph(
        doc,
        "Los resultados demuestran de forma irrefutable que el rendimiento de un sistema web no depende exclusivamente de la potencia física "
        "de la infraestructura contratada en la nube, sino de la eficiencia de los algoritmos de software, el correcto diseño de la base de datos "
        "y el uso de mecanismos de caché inteligentes. Gracias a estas mejoras guiadas por las pruebas de carga, la plataforma web del IES HV4NTA "
        "quedó plenamente capacitada para soportar el proceso de matrícula oficial de manera fluida y exitosa."
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 7. CONCLUSIONES
    # ==========================================
    add_heading_1(doc, "7. CONCLUSIONES")
    
    add_body_paragraph(
        doc,
        "Primera: Las pruebas de rendimiento (Performance Testing) no deben considerarse como una actividad tardía u opcional a ser ejecutada en "
        "vísperas del lanzamiento de un producto de software. Por el contrario, representan un pilar metodológico indispensable de la Ingeniería "
        "de Calidad de Software (QA). La experiencia práctica demuestra que la detección tardía de cuellos de botella estructurales, como fallos "
        "de diseño en bases de datos relacionales o malas configuraciones de servidores web, conlleva un coste de remediación significativamente "
        "superior al de fases tempranas de diseño. Estas pruebas dotan al equipo técnico de datos cuantitativos objetivos para la toma de decisiones "
        "arquitectónicas, sustituyendo la mera especulación intuitiva por certezas empíricas."
    )
    
    add_body_paragraph(
        doc,
        "Segunda: La correcta delimitación conceptual entre pruebas de rendimiento, carga y estrés resulta crucial para la planificación y diseño "
        "de escenarios de prueba coherentes. Mientras que las pruebas de carga validan la operabilidad del sistema bajo condiciones proyectadas de "
        "negocio, las pruebas de estrés localizan de manera controlada el límite físico y de software del entorno (breaking point) para asegurar "
        "una degradación elegante y una recuperación autónoma del sistema tras un escenario extremo de tráfico masivo."
    )
    
    add_body_paragraph(
        doc,
        "Tercera: La unificación de los ejemplos y del caso de estudio en la herramienta Grafana k6 con scripts en JavaScript demostró ser una "
        "estrategia pedagógica sumamente efectiva. Dado que el perfil académico de Diseño y Programación Web está familiarizado con JavaScript, "
        "la curva de aprendizaje para interactuar con herramientas de pruebas no funcionales se reduce al mínimo, permitiendo al estudiante "
        "concentrarse plenamente en el diseño de las aserciones, el modelado de la carga y el análisis de las métricas de respuesta."
    )
    
    add_body_paragraph(
        doc,
        "Cuarta: A través de la resolución del caso de estudio de la Plataforma de Matrícula Online del IES HV4NTA, se evidenció que la gran mayoría "
        "de los fallos de rendimiento y caídas en aplicaciones web concurrentes residen en la capa de persistencia de datos (bases de datos) y no "
        "en la falta de recursos físicos de los servidores (CPU o memoria RAM). La introducción de optimizaciones básicas como la indexación de "
        "tablas y la estrategia de almacenamiento en caché mediante Redis permitieron incrementar la concurrencia en un 138% y reducir los tiempos "
        "de respuesta en más de un 96%, demostrando la eficiencia económica de la ingeniería de software aplicada frente a la sobredimensión de "
        "hardware en la nube."
    )
    
    # ==========================================
    # 8. RECOMENDACIONES
    # ==========================================
    add_heading_1(doc, "8. RECOMENDACIONES")
    
    add_body_paragraph(
        doc,
        "Primera: Adoptar la cultura y metodología del Shift-Left Testing (pruebas tempranas) en los planes de estudio y prácticas de desarrollo "
        "del IES HV4NTA. Se recomienda que los estudiantes del programa de Diseño y Programación Web ejecuten pruebas de carga de forma periódica "
        "a nivel de componentes y APIs REST desde las primeras fases de codificación del proyecto, evitando acumular deudas técnicas de rendimiento "
        "para el final del semestre."
    )
    
    add_body_paragraph(
        doc,
        "Segunda: Diseñar siempre los planes de pruebas de rendimiento basándose en el análisis estadístico real del comportamiento del usuario "
        "(User Behavior Analytics). Es indispensable modelar tiempos de pensamiento realista (think time) entre cada acción de los usuarios virtuales "
        "y estructurar curvas de subida en rampa graduales para evitar falsos positivos de rendimiento provocados por peticiones concurrentes "
        "infinitas y no espaciadas en el tiempo."
    )
    
    add_body_paragraph(
        doc,
        "Tercera: Evitar basar las conclusiones de rendimiento en la media aritmética de los tiempos de respuesta. Se recomienda encarecidamente "
        "analizar y establecer los Acuerdos de Nivel de Servicio (SLA) basándose en los percentiles p90, p95 y p99. Esto garantiza que se identifique "
        "y optimice de forma activa la experiencia de navegación del porcentaje de estudiantes o clientes que sufren las mayores ralentizaciones "
        "en la red."
    )
    
    add_body_paragraph(
        doc,
        "Cuarta: Automatizar las pruebas de carga de APIs críticas en el pipeline de Integración Continua (CI/CD) utilizando Grafana k6. Esto "
        "asegura la ejecución de pruebas automáticas tras cada commit o Pull Request en el repositorio de código, bloqueando de manera proactiva "
        "el despliegue de cualquier versión de software que incremente los tiempos de respuesta o la tasa de fallas por encima de los límites "
        "permitidos por el negocio."
    )
    
    doc.add_page_break()
    
    # ==========================================
    # 9. REFERENCIAS BIBLIOGRÁFICAS
    # ==========================================
    add_heading_1(doc, "9. REFERENCIAS BIBLIOGRÁFICAS")
    
    references = [
        ("Apache Software Foundation. (2025). ", "Apache JMeter User Manual. ", "https://jmeter.apache.org/usermanual/"),
        ("Beck, K. (2003). ", "Test-Driven Development: By Example. ", "Addison-Wesley."),
        ("Fowler, M. (2002). ", "Patterns of Enterprise Application Architecture. ", "Addison-Wesley."),
        ("Grafana Labs. (2025). ", "k6 Documentation: Performance testing for developers. ", "https://grafana.com/docs/k6/latest/"),
        ("Molyneaux, I. (2014). ", "The Art of Application Performance Testing: From Strategy to Tools ", "(2nd ed.). O'Reilly Media."),
        ("Weyuker, E. J., & Vokolos, F. I. (2000). Experience with performance testing of software systems: issues, decisions, and guidelines. ", "IEEE Transactions on Software Engineering, ", "26(12), 1147-1156. https://doi.org/10.1109/32.888631")
    ]
    
    for author, book_title, rest in references:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(12)
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.5)
        
        r_author = p.add_run(author)
        r_author.font.name = 'Times New Roman'
        r_author.font.size = Pt(11)  # Font size changed to 11
        
        r_title = p.add_run(book_title)
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(11)  # Font size changed to 11
        r_title.font.italic = True
        
        r_rest = p.add_run(rest)
        r_rest.font.name = 'Times New Roman'
        r_rest.font.size = Pt(11)  # Font size changed to 11
        
    output_path = r"c:\PROYECTOS\PRUEBAS DE SOFTWARE\trabajo_final_pruebas_rendimiento.docx"
    doc.save(output_path)
    print(f"Document successfully created and saved to: {output_path}")

if __name__ == "__main__":
    build_document()
