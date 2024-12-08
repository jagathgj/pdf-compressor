import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
app.use(cors()); // Enable CORS for all routes

const upload = multer({ dest: 'uploads/' });

app.post('/compress', upload.single('file'), (req, res) => {
  const inputFilePath = req.file.path;
  const outputFilePath = `uploads/compressed_${req.file.originalname}`;
  const quality = req.body.quality || 'medium'; // Default to medium if not specified

  let gsQualitySetting;

  // Set the appropriate PDF settings based on the quality
  switch (quality) {
    case 'low':
      gsQualitySetting = '/screen';  // Low quality and high compression
      break;
    case 'high':
      gsQualitySetting = '/prepress';  // High quality with less compression
      break;
    case 'medium':
    default:
      gsQualitySetting = '/ebook';  // Balanced quality and compression
      break;
  }

  // Build the Ghostscript command with the selected quality setting
  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsQualitySetting} -dNOPAUSE -dBATCH -sOutputFile=${outputFilePath} ${inputFilePath}`;

  exec(gsCommand, (error) => {
    if (error) {
      console.error('Ghostscript error:', error);
      return res.status(500).send('Compression failed.');
    }

    res.download(outputFilePath, () => {
      fs.unlinkSync(inputFilePath); // Clean up uploaded file
      fs.unlinkSync(outputFilePath); // Clean up compressed file
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
