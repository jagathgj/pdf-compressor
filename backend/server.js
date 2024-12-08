import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://jagathgj.github.io",
      "http://localhost:5000",
      "http://localhost:5001",
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

const upload = multer({ dest: "uploads/" });

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
