import React, { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [color, setColor] = useState(null);
  const [file, setFile] = useState(null); // Store file for later use

  const API_URL = "https://color-analysis-app.onrender.com"; // Updated API URL

  const handleImageUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setImage(URL.createObjectURL(uploadedFile));
      setFile(uploadedFile); // Save file for later PDF generation

      const formData = new FormData();
      formData.append("image", uploadedFile);

      try {
        const response = await fetch(`${API_URL}/analyze-color`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch color data");
        }

        const data = await response.json();
        setColor(`rgb(${data.dominant_color.join(",")})`);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const downloadPDF = async () => {
    if (!file) {
      alert("Upload an image first!");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "color_analysis.pdf"; // File name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="App">
      <h1>Color Analysis App</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="Uploaded" style={{ width: "300px", marginTop: "10px" }} />}
      {color && <div style={{ background: color, width: "100px", height: "100px", marginTop: "10px" }} />}

      <button onClick={downloadPDF}>Download PDF</button>
    </div>
  );
}

export default App;