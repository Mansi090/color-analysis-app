from flask import Flask, request, send_file, jsonify
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import inch
import cv2
import numpy as np
import traceback
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

COLOR_MAP = {
    "Peach": (255, 218, 185),
    "Coral": (255, 127, 80),
    "Mint Green": (152, 255, 152),
    "Mustard": (255, 219, 88),
    "Olive Green": (107, 142, 35),
    "Rust": (183, 65, 14),
    "Pastel Blue": (174, 198, 207),
    "Lavender": (230, 230, 250),
    "Soft Gray": (211, 211, 211),
    "Deep Blue": (0, 0, 128),
    "Burgundy": (128, 0, 32),
    "Black": (0, 0, 0),
    "Cool Blues": (100, 149, 237),
    "Deep Reds": (139, 0, 0),
    "Pinks": (255, 192, 203),
    "Bright Orange": (255, 165, 0),
    "Warm Yellow": (255, 223, 0),
    "Warm Beige": (245, 245, 220),
    "Soft Browns": (181, 101, 29)
}

# Initialize and modify styles
styles = getSampleStyleSheet()
styles['Title'].fontSize = 24
styles['Title'].textColor = colors.HexColor('#2c3e50')
styles['Title'].alignment = TA_CENTER
styles['Title'].spaceAfter = 20

styles['BodyText'].fontSize = 12
styles['BodyText'].textColor = colors.HexColor('#34495e')
styles['BodyText'].leading = 14
styles['BodyText'].alignment = TA_JUSTIFY

styles.add(ParagraphStyle(
    name='MainTitle',
    fontSize=28,
    textColor=colors.HexColor('#2c3e50'),
    alignment=TA_CENTER,
    spaceAfter=24,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='SectionHeader',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=colors.HexColor('#e74c3c'),
    spaceAfter=12,
    spaceBefore=24,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='ColorName',
    fontSize=12,
    textColor=colors.black,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
))

def get_season(rgb):
    r, g, b = rgb
    if r > g and r > b:
        return (
            "Spring", 
            ["Peach", "Coral", "Mint Green"],
            ["Cool Blues", "Deep Reds"]
        )
    elif g > r and g > b:
        return (
            "Summer", 
            ["Pastel Blue", "Lavender", "Soft Gray"],
            ["Bright Orange", "Warm Yellow"]
        )
    elif b > r and b > g:
        return (
            "Winter", 
            ["Deep Blue", "Burgundy", "Black"],
            ["Warm Beige", "Soft Browns"]
        )
    return (
        "Autumn",
        ["Mustard", "Olive Green", "Rust"],
        ["Cool Blues", "Pinks"]
    )

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files['image']
        file_path = "temp_image.jpg"
        file.save(file_path)
        
        try:
            dominant_color = get_dominant_color(file_path)
            season, best_colors, avoid_colors = get_season(dominant_color)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

        pdf_path = "color_analysis.pdf"
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        elements = []

        # Title Section
        elements.append(Paragraph("Your Personal Color Analysis", styles['MainTitle']))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3498db'), spaceAfter=24))

        # Dominant Color Section
        elements.append(Paragraph("Your Seasonal Palette", styles['SectionHeader']))
        
        # Create dominant color display
        swatch_size = 1.5 * inch
        inner_table = Table(
            [[Paragraph("Your Color", styles['ColorName'])]],
            style=TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.Color(*[c/255 for c in dominant_color])),
                ('ROUNDEDCORNERS', [10, 10, 10, 10]),
                ('BOX', (0,0), (-1,-1), 1, colors.white),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]),
            colWidths=[swatch_size],
            rowHeights=[swatch_size]
        )

        dominant_table = Table([
            [inner_table, Paragraph(
                f"<b>Season:</b> {season}<br/><br/>"
                f"Your natural coloring places you in the {season} palette. "
                "This means these colors will harmonize beautifully with your skin tone, "
                "bringing out your natural radiance!", 
                styles['BodyText']
            )]
        ], colWidths=[2 * inch, 4 * inch])

        elements.extend([dominant_table, Spacer(1, 0.5 * inch)])

        # Recommended Colors Section
        elements.append(Paragraph("Your Best Colors", styles['SectionHeader']))
        elements.append(Paragraph(
            "These hues will make you glow! Try them in clothing, accessories, and makeup:", 
            styles['BodyText']
        ))
        
        color_swatches = []
        for color in best_colors:
            rgb = COLOR_MAP[color]
            swatch = Table(
                [[Paragraph(color, styles['ColorName'])]],
                style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.Color(*[c/255 for c in rgb])),
                    ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ('BOX', (0,0), (-1,-1), 1, colors.white),
                ]),
                colWidths=[1.8 * inch],
                rowHeights=[0.8 * inch]
            )
            color_swatches.append(swatch)
        
        elements.append(Table([color_swatches], colWidths=[1.9 * inch] * len(best_colors)))
        elements.append(Spacer(1, 0.5 * inch))

        # Colors to Avoid Section
        elements.append(Paragraph("Colors to Be Cautious With", styles['SectionHeader']))
        elements.append(Paragraph(
            "These shades might not flatter your natural undertones as well:", 
            styles['BodyText']
        ))
        
        avoid_swatches = []
        for color in avoid_colors:
            rgb = COLOR_MAP[color]
            swatch = Table(
                [[Paragraph(f"✗ {color}", styles['ColorName'])]],
                style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.Color(*[c/255 * 0.7 for c in rgb])),
                    ('ROUNDEDCORNERS', [8, 8, 8, 8]),
                    ('BOX', (0,0), (-1,-1), 1, colors.white),
                ]),
                colWidths=[2.5 * inch],
                rowHeights=[0.5 * inch]
            )
            avoid_swatches.append(swatch)
        
        elements.append(Table([avoid_swatches], colWidths=[2.6 * inch] * len(avoid_colors)))
        elements.append(Spacer(1, 0.5 * inch))

        # Final Tips
        elements.append(Paragraph("Styling Tips", styles['SectionHeader']))
        tips = [
            "• Always test colors in natural lighting",
            "• Use your palette as guidance, not strict rules",
            "• Combine your best colors in monochromatic looks",
            "• Use accent colors in accessories if you want to experiment"
        ]
        elements.append(Paragraph("<br/>".join(tips), styles['BodyText']))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#3498db'), spaceBefore=12))

        doc.build(elements)
        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def get_dominant_color(image_path):
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pixels = np.float32(image.reshape(-1, 3))

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, palette = cv2.kmeans(pixels, 3, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    


    return [int(c) for c in palette[np.argmax(np.bincount(labels.flatten()))]]#+


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)