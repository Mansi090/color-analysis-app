# Stage 1: Build React App from color-analysis-app folder
FROM node:16 AS frontend
WORKDIR /app/frontend

# Copy package files from the React app directory
COPY color-analysis-app/package.json color-analysis-app/package-lock.json ./
RUN npm install

# Copy the rest of the React app and build it
COPY color-analysis-app/ ./
RUN npm run build

# Stage 2: Build Flask Backend
FROM python:3.9 AS backend
WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0

# Copy the requirements from the project root (adjust if needed)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Flask app files
COPY backend/ ./backend

# Copy the React build output into the Flask static folder (adjust path if your Flask app expects it somewhere else)
COPY --from=frontend /app/frontend/build ./backend/static

# Set the FLASK_APP environment variable to point to your app file
ENV FLASK_APP=backend/app.py

# Expose the port your Flask app will run on
EXPOSE 5000

# Use Gunicorn to serve the Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:app"]
