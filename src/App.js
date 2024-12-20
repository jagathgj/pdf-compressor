import React, { useState } from "react";
import {
  FileUploader,
  RadioButtonGroup,
  RadioButton,
  Button,
  Modal
} from "@carbon/react";
import { saveAs } from "file-saver";
import IBMHeader from "./Header";

const App = () => {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleQualityChange = (value) => {
    setQuality(value);
  };

  const handleCompress = async () => {
    if (!file) {
      alert("Please upload a file.");
      return;
    }
    setLoading(true);

    try {
      const compressedFile = await CompressPdf(file, quality);
      const fileName = `compressed_${file.name}`;
      console.log("hello", compressedFile, fileName);
      saveAs(compressedFile, fileName);
      setShowModal(true);
    } catch (error) {
      alert("Compression failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <IBMHeader />
      <div className="wrapper">
        <div className="form-wrapper">
          <FileUploader
            labelTitle="Upload a PDF"
            labelDescription="Only PDF files are supported"
            buttonLabel="Add file"
            accept={[".pdf"]}
            onChange={handleFileChange}
            filenameStatus={file ? "edit" : "uploading"}
          />
        </div>
        <div className="form-wrapper">
          <RadioButtonGroup
            legendText="Choose Compression Quality"
            name="quality"
            valueSelected={quality}
            onChange={handleQualityChange}
          >
            <RadioButton labelText="Low" value="low" />
            <RadioButton labelText="Medium" value="medium" />
            <RadioButton labelText="High" value="high" />
          </RadioButtonGroup>
        </div>
        <div className="form-wrapper">
          <Button onClick={handleCompress} disabled={loading}>
            {loading ? "Compressing..." : "Compress"}
          </Button>
        </div>
        <Modal
          open={showModal}
          modalHeading="PDF compression completed"
          primaryButtonText="Close"
          onRequestClose={() => setShowModal(false)}
        >
          Your PDF is compressed and downloading.
        </Modal>
      </div>
    </div>
  );
};

const CompressPdf = async (file, quality) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quality", quality);

  const response = await fetch(
    "https://pdf-compressor-cobl.onrender.com/compress",
    {
      method: "POST",
      body: formData
    }
  );
  console.log(response, "response");
  if (!response.ok) throw new Error("Compression failed");

  const compressedBlob = await response.blob();
  return compressedBlob;
};

export default App;
