from flask import Flask, request, send_file, jsonify, render_template, after_this_request, redirect
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
                                HRFlowable, Image, PageBreak, KeepTogether)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from reportlab.lib.units import inch
import cv2
import numpy as np
import traceback
import os
from flask_cors import CORS
import tempfile
import requests
import json
import requests

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Use environment variables for sensitive keys

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"reply": "Please provide a message."})
    
    try:
        headers = {
            "Authorization": "Bearer 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",  # Replace with your actual API key
            "Content-Type": "application/json",
            "HTTP-Referer": "https://openrouter.ai/deepseek/deepseek-r1:free/api",  # Optional: your website URL
            "X-Title": "OpenRouter"       # Optional: your site title
        }
        
        payload = {
            "model": "deepseek/deepseek-r1:free",
            "messages": [
                {"role": "user", "content": user_message}
            ]
        }
        
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload)
        )
        response_data = response.json()
        print("OpenRouter API response:", response_data)  # For debugging
        
        # Extract the reply; adjust the keys if needed based on the API response structure.
        bot_reply = (response_data.get("choices", [{}])[0]
                     .get("message", {})
                     .get("content", "Sorry, I couldn't process your request."))
        
        return jsonify({"reply": bot_reply})
    
    except Exception as e:
        print("OpenRouter API error:", e)
        return jsonify({"reply": "Sorry, I couldn't process your request. Please try again later."})



# ---------------------------
# HELPER FUNCTIONS (for PDF generation)
# ---------------------------
def add_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(colors.HexColor('#3498db'))
    canvas.drawString(40, doc.pagesize[1] - 40, "Personal Style Guide")
    canvas.setFont('Helvetica', 8)
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(doc.pagesize[0] / 2, 20, f"Page {page_num}")
    canvas.setStrokeColor(colors.HexColor('#3498db'))
    canvas.setLineWidth(0.5)
    canvas.line(40, 50, doc.pagesize[0] - 40, 50)
    canvas.restoreState()

def get_season(rgb):
    r, g, b = rgb
    if r > g and r > b:
        return ("Spring", ["Peach", "Coral", "Mint Green"], ["Cool Blues", "Deep Reds"])
    elif g > r and g > b:
        return ("Summer", ["Pastel Blue", "Lavender", "Soft Gray"], ["Bright Orange", "Warm Yellow"])
    elif b > r and b > g:
        return ("Winter", ["Deep Blue", "Burgundy", "Black"], ["Warm Beige", "Soft Browns"])
    return ("Autumn", ["Mustard", "Olive Green", "Rust"], ["Cool Blues", "Pinks"])

def get_dominant_color(image_path):
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pixels = np.float32(image.reshape(-1, 3))
    unique_colors = np.unique(pixels, axis=0)
    k = min(3, len(unique_colors))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, palette = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    dominant_index = np.argmax(np.bincount(labels.flatten()))
    return [int(c) for c in palette[dominant_index]]

def get_age_group(age):
    try:
        age = int(age)
        if age < 20:
            return 'teen'
        elif 20 <= age < 35:
            return 'young-adult'
        elif 35 <= age < 60:
            return 'adult'
        return 'senior'
    except:
        return 'adult'

# Define your STYLE_DATA, COLOR_MAP, and styles (only once)
STYLE_DATA = {
    "color_palettes": {
        "warm_tones": {"Peach": (255,218,185), "Terracotta": (204,78,52), "Mustard": (255,219,88),
                       "Rust": (183,65,14), "Warm Beige": (245,245,220)},
        "cool_tones": {"Mint Green": (152,255,152), "Pastel Blue": (174,198,207), "Lavender": (230,230,250),
                       "Deep Blue": (0,0,128), "Soft Gray": (211,211,211)},
        "neutrals": {"Soft Charcoal": (54,54,54), "Oatmeal": (211,195,169), "Taupe": (72,60,50),
                     "Eggshell": (240,234,214), "Black": (0,0,0)},
        "bold_accents": {"Coral": (255,127,80), "Burgundy": (128,0,32), "Electric Blue": (0,127,255),
                         "Emerald": (80,200,120), "Goldenrod": (218,165,32)}
    },
    "body_type_guidelines": {
        "hourglass": {
            "dos": ["Fitted silhouettes that follow natural curves",
                    "Wrap-style garments", "Belted waist definition", "Structured tailoring"],
            "avoid": ["Boxy, shapeless cuts", "Overly loose tunics", "Dropped waistlines", "Bulky fabrics"]
        },
        "rectangle": {
            "dos": ["Layered looks for dimension", "Peplum details", "Asymmetrical hems", "Textured fabrics"],
            "avoid": ["Straight column dresses", "Overly simplistic silhouettes", "Flat, unbroken surfaces", "Tight, body-con styles"]
        }
    },
    "style_strategies": {
        "gender_expression": {
            "masculine": {
                "tailoring": ["Structured shoulders", "Angular cuts", "Military-inspired details"],
                "materials": ["Tweed", "Denim", "Leather accents"],
                "accessories": ["Thick leather belts", "Statement watches", "Structured bags"]
            },
            "feminine": {
                "tailoring": ["Draped necklines", "Gathered waists", "Flared silhouettes"],
                "materials": ["Chiffon", "Silk", "Lace details"],
                "accessories": ["Delicate chains", "Scarves", "Clutch bags"]
            },
            "androgynous": {
                "tailoring": ["Oversized fits", "Gender-neutral cuts", "Unisex sizing"],
                "materials": ["Organic cotton", "Technical fabrics", "Recycled materials"],
                "accessories": ["Unisex jewelry", "Multipurpose wraps", "Gender-neutral footwear"]
            }
        },
        "age_appropriate": {
            "20s": ["Experimental silhouettes", "Trend-forward pieces", "Mix of vintage and contemporary"],
            "30s": ["Investment tailoring", "Quality basics", "Sophisticated accessories"],
            "40s": ["Luxury fabrics", "Artisanal details", "Modern classic shapes"],
            "50+": ["Comfort-forward design", "Timeless patterns", "Adaptive closures"]
        },
        "occasion_based": {
            "business": ["Capsule wardrobe pieces", "Neutral color schemes", "Subtle pattern mixing"],
            "casual": ["Convertible layers", "Performance fabrics", "Easy-care materials"],
            "formal": ["Luxury textiles", "Custom tailoring", "Heirloom-quality accessories"]
        }
    },
    "universal_tips": [
        "Invest in quality foundational pieces",
        "Prioritize comfort without sacrificing style",
        "Use accessories to transform basic outfits",
        "Regularly edit and update your wardrobe",
        "Experiment with proportion and scale"
    ]
}
COLOR_MAP = {}
for palette in STYLE_DATA["color_palettes"].values():
    COLOR_MAP.update(palette)

styles = getSampleStyleSheet()
title_font = 'Helvetica-Bold'
body_font = 'Helvetica'
styles.add(ParagraphStyle(
    name='MainTitle',
    fontName=title_font,
    fontSize=24,
    textColor=colors.HexColor('#2c3e50'),
    alignment=TA_CENTER,
    spaceAfter=14
))
styles.add(ParagraphStyle(
    name='SectionHeader',
    fontName=title_font,
    fontSize=16,
    textColor=colors.HexColor('#3498db'),
    spaceBefore=12,
    spaceAfter=8
))
styles['BodyText'].fontName = body_font
styles['BodyText'].fontSize = 10
styles['BodyText'].textColor = colors.HexColor('#2c3e50')
styles['BodyText'].leading = 14
styles.add(ParagraphStyle(
    name='SubHeader',
    fontName=title_font,
    fontSize=12,
    textColor=colors.HexColor('#34495e'),
    spaceAfter=6
))
styles.add(ParagraphStyle(
    name='ColorName',
    fontName=body_font,
    fontSize=8,
    textColor=colors.white,
    alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    name='Disclaimer',
    fontName=body_font,
    fontSize=8,
    textColor=colors.HexColor('#7f8c8d'),
    alignment=TA_CENTER
))

# ---------------------------
# ROUTE: PDF GENERATION
# ---------------------------
@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    temp_image_path = None
    try:
        personal_info = {
            'name': request.form.get('name', ''),
            'age': request.form.get('age', ''),
            'gender': request.form.get('gender', ''),
            'body_type': request.form.get('bodyType', '').lower()
        }

        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files['image']
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            file.save(temp_file.name)
            temp_image_path = temp_file.name
            dominant_color = get_dominant_color(temp_file.name)
            season, best_colors, avoid_colors = get_season(dominant_color)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as pdf_file:
            pdf_path = pdf_file.name

        body_type = personal_info['body_type']
        recommendations = STYLE_DATA["body_type_guidelines"].get(body_type, {}).get("dos", [])
        age_group = get_age_group(personal_info['age'])

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=60,
            bottomMargin=40
        )
        elements = []

        header = Table([
            [Paragraph("STYLE GUIDE", styles['MainTitle']),
             Image(temp_image_path, width=1.5*inch, height=1.5*inch)]
        ], colWidths=['70%', '30%'])
        elements.append(header)
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3498db'), spaceAfter=20))

        info_grid = [
            ["<b>Name:</b>", personal_info['name'], "<b>Age Group:</b>", age_group.title()],
            ["<b>Body Type:</b>", personal_info['body_type'].capitalize(), "<b>Style Profile:</b>", season.title()]
        ]
        info_table = Table(info_grid, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f9fa')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0'))
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))

        def create_modern_section(title, items):
            section = []
            if title:
                section.append(Paragraph(title, styles['SectionHeader']))
            bullet_items = []
            for item in items:
                bullet_items.append([Paragraph("•", styles['BodyText']),
                                     Paragraph(item, styles['BodyText'])])
            section.append(Table(bullet_items, colWidths=[0.3*inch, 6.5*inch],
                                 style=TableStyle([
                                     ('VALIGN', (0,0), (-1,-1), 'TOP'),
                                     ('LEFTPADDING', (1,0), (1,0), 6)
                                 ])))
            return section

        if recommendations:
            elements.extend(create_modern_section(f"Body Type: {body_type.capitalize()}", recommendations))
            elements.append(Spacer(1, 0.3*inch))

        elements.append(Paragraph("Color Palette Analysis", styles['SectionHeader']))
        color_grid = []
        for category, colors_list in [('Best Colors', best_colors), ('Avoid', avoid_colors)]:
            swatches = []
            for color in colors_list:
                if color in COLOR_MAP:
                    rgb = COLOR_MAP[color]
                    hex_color = '#%02x%02x%02x' % rgb
                else:
                    hex_color = '#cccccc'
                swatch = Table([[Paragraph(f"{color}<br/>{hex_color}", styles['ColorName'])]],
                               style=TableStyle([
                                   ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(hex_color)),
                                   ('BOX', (0,0), (-1,-1), 1, colors.white),
                                   ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
                               ]),
                               colWidths=[2*inch],
                               rowHeights=[0.8*inch])
                swatches.append(swatch)
            color_grid.append([
                Paragraph(category, styles['SubHeader']),
                Table([swatches], colWidths=[2.1*inch]*len(colors_list))
            ])
        elements.append(Table(color_grid, style=TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f9fa'))
        ])))

        elements.append(PageBreak())
        elements.append(Paragraph("Personalized Style Guide", styles['MainTitle']))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3498db'), spaceAfter=20))
        elements.append(Paragraph("Additional Recommendations", styles['SectionHeader']))

        col1 = [
            Paragraph("Wardrobe Essentials", styles['SubHeader']),
            *create_modern_section("Tops", ["Structured blazers", "Wrap tops", "Layered tunics"]),
            Paragraph("Accessories", styles['SubHeader']),
            *create_modern_section("", ["Statement belts", "Delicate necklaces", "Structured bags"])
        ]
        col2 = [
            Paragraph("Seasonal Updates", styles['SubHeader']),
            *create_modern_section("Spring/Summer", ["Linen shirts", "Lightweight layers"]),
            Paragraph("Footwear", styles['SubHeader']),
            *create_modern_section("", ["Block heels", "Loafers", "Ankle boots"])
        ]
        elements.append(Table([[col1, col2]], colWidths=[3.2*inch, 3.2*inch],
                               style=TableStyle([
                                   ('LEFTPADDING', (0,0), (-1,-1), 6),
                                   ('VALIGN', (0,0), (-1,-1), 'TOP')
                               ])))
        elements.append(Spacer(1, 0.5*inch))
        elements.append(Paragraph("* Colors may vary based on screen calibration. Always test colors in natural lighting.", styles['Disclaimer']))

        doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)

        @after_this_request
        def cleanup(response):
            try:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            except Exception as e:
                app.logger.error("Error removing PDF file: %s", e)
            return response

        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.unlink(temp_image_path)
            except Exception as e:
                app.logger.error("Error removing temporary image file: %s", e)

# ---------------------------
# ROUTE: UPLOAD FORM
# ---------------------------
@app.route('/', methods=['GET', 'POST'])
def upload_image():
    """Simple form to upload an image and generate the PDF."""
    if request.method == 'POST':
        if 'image' not in request.files:
            return redirect(request.url)
        return generate_pdf()
    return render_template('upload.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
