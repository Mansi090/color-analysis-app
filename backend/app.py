from flask import Flask, request, send_file, jsonify, after_this_request
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
                                HRFlowable)
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
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure logging
logging.basicConfig(filename='app.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------
# HELPER FUNCTIONS FOR PDF STYLING
# ---------------------------
def add_header_footer(canvas, doc):
    try:
        canvas.saveState()
        width, height = doc.pagesize
        canvas.setFillColor(colors.HexColor('#E6F0FA'))
        canvas.rect(0, height - 90, width, 90, stroke=0, fill=1)
        canvas.setFillColor(colors.HexColor('#FF6347'))
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(60, height - 65, "✨ Glam Galaxy Guide ✨")
        date_str = datetime.now().strftime("%B %d, %Y")
        canvas.setFont('Helvetica-Oblique', 10)
        canvas.drawRightString(width - 60, height - 65, f"🌟 {date_str}")
        canvas.setFillColor(colors.HexColor('#FFF5E1'))
        canvas.rect(0, 0, width, 60, stroke=0, fill=1)
        canvas.setFillColor(colors.HexColor('#4682B4'))
        canvas.setFont('Helvetica', 10)
        page_num = canvas.getPageNumber()
        canvas.drawCentredString(width / 2, 25, f"Page {page_num} 🌙")
        canvas.restoreState()
    except Exception as e:
        logger.error(f"Error in add_header_footer: {str(e)}")

def get_season(rgb):
    try:
        r, g, b = rgb
        if r > g and r > b:
            return ("Spring", ["Peach", "Coral", "Mint Green"], ["Cool Blues", "Deep Reds"])
        elif g > r and g > b:
            return ("Summer", ["Pastel Blue", "Lavender", "Soft Gray"], ["Bright Orange", "Warm Yellow"])
        elif b > r and b > g:
            return ("Winter", ["Deep Blue", "Burgundy", "Black"], ["Warm Beige", "Soft Browns"])
        return ("Autumn", ["Mustard", "Olive Green", "Rust"], ["Cool Blues", "Pinks"])
    except Exception as e:
        logger.error(f"Error in get_season: {str(e)}")
        return ("Autumn", ["Mustard", "Olive Green", "Rust"], ["Cool Blues", "Pinks"])

def get_dominant_color(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Failed to load image")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pixels = np.float32(image.reshape(-1, 3))
        unique_colors = np.unique(pixels, axis=0)
        k = min(3, len(unique_colors))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, palette = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        dominant_index = np.argmax(np.bincount(labels.flatten()))
        return [int(c) for c in palette[dominant_index]]
    except Exception as e:
        logger.error(f"Error in get_dominant_color: {str(e)}")
        return [128, 128, 128]

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
        logger.error(f"Error in get_age_group: {age}")
        return 'adult'

# ---------------------------
# HELPER FUNCTION FOR STRICT HUMAN DETECTION
# ---------------------------
def is_human_image(image_path):
    try:
        # Load multiple Haar Cascade classifiers for robust detection
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
        body_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_fullbody.xml')
        
        for cascade, name in [
            (face_cascade, "frontal face"),
            (profile_cascade, "profile face"),
            (body_cascade, "full body")
        ]:
            if cascade.empty():
                logger.error(f"Failed to load {name} Haar Cascade classifier")
                raise ValueError(f"Failed to load {name} Haar Cascade classifier")

        # Read and preprocess the image
        image = cv2.imread(image_path)
        if image is None:
            logger.error("Failed to load image for human detection")
            raise ValueError("Failed to load image for human detection")

        # Validate image content (check for sufficient contrast)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        if np.std(gray) < 10:  # Low standard deviation indicates a near-uniform image
            logger.error("Image lacks sufficient contrast (possible blank or uniform image)")
            return False

        # Detect frontal faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.03,  # Very tight scaling for high precision
            minNeighbors=10,   # High neighbors to eliminate false positives
            minSize=(60, 60)   # Larger minimum size for clear faces
        )
        logger.info(f"Detected {len(faces)} frontal faces")

        # Detect profile faces if no frontal faces found
        profile_faces = []
        if len(faces) == 0:
            profile_faces = profile_cascade.detectMultiScale(
                gray,
                scaleFactor=1.03,
                minNeighbors=10,
                minSize=(60, 60)
            )
            logger.info(f"Detected {len(profile_faces)} profile faces")

        # Detect full body if no faces found
        bodies = []
        if len(faces) == 0 and len(profile_faces) == 0:
            bodies = body_cascade.detectMultiScale(
                gray,
                scaleFactor=1.03,
                minNeighbors=8,
                minSize=(80, 160)  # Larger size for body detection
            )
            logger.info(f"Detected {len(bodies)} full bodies")

        # Image is considered human if any detection is successful
        if len(faces) > 0 or len(profile_faces) > 0 or len(bodies) > 0:
            logger.info("Human detected in image")
            return True

        logger.error("No human features detected in image")
        return False

    except Exception as e:
        logger.error(f"Error in is_human_image: {str(e)}")
        return False

# ---------------------------
# STYLES & DATA
# ---------------------------
STYLE_DATA = {
    "color_palettes": {
        "warm_tones": {"Peach": (255,218,185), "Terracotta": (204,78,52), "Mustard": (255,219,88)},
        "cool_tones": {"Mint Green": (152,255,152), "Pastel Blue": (174,198,207), "Lavender": (230,230,250)},
        "neutrals": {"Soft Charcoal": (54,54,54), "Oatmeal": (211,195,169), "Black": (0,0,0)}
    },
    "body_type_guidelines": {
        "hourglass": {"dos": ["Fitted silhouettes", "Wrap-style garments", "Belted waist"]},
        "rectangle": {"dos": ["Layered looks", "Peplum details", "Textured fabrics"]}
    }
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
    fontSize=28,
    textColor=colors.HexColor('#FF6347'),
    alignment=TA_CENTER,
    spaceAfter=20
))
styles.add(ParagraphStyle(
    name='SectionHeader',
    fontName=title_font,
    fontSize=20,
    textColor=colors.HexColor('#4682B4'),
    spaceBefore=15,
    spaceAfter=10
))
styles['BodyText'].fontName = body_font
styles['BodyText'].fontSize = 12
styles['BodyText'].textColor = colors.HexColor('#333333')
styles['BodyText'].leading = 16
styles.add(ParagraphStyle(
    name='ColorName',
    fontName=body_font,
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER
))

# ---------------------------
# ROUTE: TEST
# ---------------------------
@app.route('/test', methods=['GET'])
def test():
    logger.info("Test route accessed")
    return jsonify({"message": "Yo, server’s vibin’! 🚀"})

# ---------------------------
# ROUTE: PDF GENERATION
# ---------------------------
@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    temp_image_path = None
    try:
        logger.info("Starting PDF generation")
        personal_info = {
            'name': request.form.get('name', 'Stylish Star'),
            'age': request.form.get('age', ''),
            'gender': request.form.get('gender', ''),
            'body_type': request.form.get('bodyType', '').lower()
        }
        logger.info(f"Personal info: {personal_info}")

        if 'image' not in request.files:
            logger.error("No image uploaded")
            return jsonify({"error": "No image uploaded 😿"}), 400

        file = request.files['image']
        if not file.filename:
            logger.error("Empty image file")
            return jsonify({"error": "Empty image file 😿"}), 400

        # Validate file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            logger.error(f"Invalid file extension: {file_ext}")
            return jsonify({"error": "Please upload a JPG or PNG image 😺"}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            file.save(temp_file.name)
            temp_image_path = temp_file.name
            logger.info(f"Image saved to {temp_image_path}")

            # Check if the image contains a human
            if not is_human_image(temp_image_path):
                logger.error("No human detected in the uploaded image")
                return jsonify({"error": "Oops! Please upload an image of a person 😺. We couldn't find a human in this one!"}), 400

            dominant_color = get_dominant_color(temp_image_path)
            season, best_colors, avoid_colors = get_season(dominant_color)
            logger.info(f"Dominant color: {dominant_color}, Season: {season}")

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as pdf_file:
            pdf_path = pdf_file.name
            logger.info(f"PDF will be saved to {pdf_path}")

        body_type = personal_info['body_type']
        recommendations = STYLE_DATA["body_type_guidelines"].get(body_type, {}).get("dos", [])
        age_group = get_age_group(personal_info['age'])

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=80,
            bottomMargin=60
        )

        elements = []
        elements.append(Paragraph(f"GLAM GALAXY FOR {personal_info['name'].upper()} 🌸", styles['MainTitle']))
        elements.append(HRFlowable(width="80%", thickness=2, color=colors.HexColor('#FFD700'), spaceAfter=20))
        elements.append(Paragraph(
            "Yo, fashion superstar! This is your sparkly guide to slaying your style game! 🌟",
            styles['BodyText']))
        elements.append(Spacer(1, 0.3*inch))

        info_grid = [
            ["Name 🌟", personal_info['name']],
            ["Age Vibe 🦄", age_group.title()],
            ["Body Type 💃", personal_info['body_type'].capitalize()],
            ["Style Season 🎨", season.title()]
        ]
        info_table = Table(info_grid, colWidths=[2*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 12),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#E6F0FA')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#FFDAB9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FFDAB9'))
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))

        if recommendations:
            elements.append(Paragraph(f"Your {body_type.capitalize()} Vibes 💫", styles['SectionHeader']))
            for rec in recommendations:
                elements.append(Paragraph(f"✨ {rec}", styles['BodyText']))
            elements.append(Spacer(1, 0.3*inch))

        elements.append(Paragraph("Your Color Cosmos 🎨", styles['SectionHeader']))
        color_grid = []
        for category, colors_list in [('Fab Colors 🌟', best_colors), ('Skip These 🚫', avoid_colors)]:
            swatches = []
            for color in colors_list:
                if color in COLOR_MAP:
                    rgb = COLOR_MAP[color]
                    hex_color = '#%02x%02x%02x' % rgb
                else:
                    hex_color = '#cccccc'
                swatch = Table([[Paragraph(f"{color}", styles['ColorName'])]],
                               style=TableStyle([
                                   ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(hex_color)),
                                   ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#FFDAB9')),
                                   ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
                               ]),
                               colWidths=[1.5*inch],
                               rowHeights=[0.7*inch])
                swatches.append(swatch)
            color_grid.append([
                Paragraph(category, styles['BodyText']),
                Table([swatches], colWidths=[1.5*inch]*len(colors_list))
            ])
        elements.append(Table(color_grid, style=TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFF5E1'))
        ])))

        logger.info("Building PDF")
        doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        logger.info("PDF built successfully")

        @after_this_request
        def cleanup(response):
            try:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
                    logger.info(f"Removed PDF file: {pdf_path}")
            except Exception as e:
                logger.error(f"Error removing PDF file: {str(e)}")
            return response

        return send_file(pdf_path, as_attachment=True, mimetype='application/pdf')

    except Exception as e:
        logger.error(f"Error in generate_pdf: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": f"Oops, something broke! 😿 Try again or check the logs. Details: {str(e)}"}), 500

    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.unlink(temp_image_path)
                logger.info(f"Removed temp image: {temp_image_path}")
            except Exception as e:
                logger.error(f"Error removing temp image: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting Flask server")
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))