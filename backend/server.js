import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();

const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://jagathgj.github.io/pdf-compressor",
      "http://localhost:5000",
      "http://localhost:5001",
      "http://localhost:10000",
      "http://localhost:3000"
    ];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

app.use(cors(corsOptions));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({ dest: "uploads/", storage });

app.post("/compress", upload.single("file"), (req, res) => {
  const inputFilePath = req.file.path;
  const outputFilePath = `uploads/compressed_${req.file.originalname}`;
  const quality = req.body.quality || "medium";

  let gsQualitySetting;

  switch (quality) {
    case "low":
      gsQualitySetting = "/screen";
      break;
    case "high":
      gsQualitySetting = "/prepress";
      break;
    case "medium":
    default:
      gsQualitySetting = "/ebook";
      break;
  }

  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsQualitySetting} -dNOPAUSE -dBATCH -sOutputFile=${outputFilePath} ${inputFilePath}`;

  exec(gsCommand, (error) => {
    if (error) {
      console.error("Ghostscript error:", error);
      return res.status(500).send("Compression failed.");
    }

    res.download(outputFilePath, () => {
      fs.unlinkSync(inputFilePath);
      fs.unlinkSync(outputFilePath);
    });
  });
});

app.delete("/delete", (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).send("File name is required.");
  }

  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.send("File deleted successfully.");
    } else {
      return res.status(404).send("File not found.");
    }
  } catch (error) {
    console.error("File deletion error:", error);
    return res.status(500).send("Failed to delete file.");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
