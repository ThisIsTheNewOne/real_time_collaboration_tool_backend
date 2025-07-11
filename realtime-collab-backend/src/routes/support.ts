import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: JPEG, PNG, GIF, PDF, TXT, CSV`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files
  }
});

// Upload attachment endpoint
router.post('/upload-attachment', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      file: {
        id: req.file.filename,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  
  res.sendFile(filePath);
});

// Get file info
router.get('/attachment/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const filePath = path.join(__dirname, '../../uploads', fileId);
  
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  
  const stats = fs.statSync(filePath);
  res.json({
    id: fileId,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  });
});

// Delete attachment
router.delete('/attachment/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const filePath = path.join(__dirname, '../../uploads', fileId);
  
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

export default router;