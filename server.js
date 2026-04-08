require('dotenv').config();

// 1. Require libraries
const express = require("express");
const path = require("path");
const multer = require('multer');
const { PdfReader } = require('pdfreader');
const { generateCoverLetter } = require("./geminiService");


// 3. Create Express app
const app = express();


// 4. Middleware → Parse JSON body
app.use(express.json());

// 5. Serve static frontend files
// (assuming your frontend is in a folder named "public")
app.use(express.static(path.join(__dirname, "public")));

// Custom file filter — reject non-PDFs at the multer level
const fileFilter = (req, file, cb) => {

  // Check 1: Wrong mimetype
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('INVALID_FILE_TYPE'), false);
  }

  cb(null, true); // accept the file
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,

  // Check 2: File too large (multer enforces this automatically)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Global multer error handler middleware — add this after your routes
app.use((err, req, res, next) => {

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large. Maximum allowed size is 5MB.',
    });
  }

  if (err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type. Only PDF files are accepted.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field. Use the field name "resume".',
    });
  }

  // Pass other errors down
  next(err);
});




function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {

    // Check 1: Buffer is empty or invalid
    if (!buffer || buffer.length === 0) {
      return reject(new Error('EMPTY_BUFFER'));
    }

    const textItems = [];
    let hasStarted = false;

    new PdfReader().parseBuffer(buffer, (err, item) => {

      if (err) {
        // Check 2: Corrupt or unreadable PDF
        if (err.message && err.message.includes('password')) {
          return reject(new Error('PASSWORD_PROTECTED'));
        }
        return reject(new Error('CORRUPT_PDF'));
      }

      if (!item) {
        // End of file
        resolve(textItems.join(' '));
        return;
      }

      if (item.text) {
        hasStarted = true;
        textItems.push(item.text);
      }
    });

    // Check 3: Timeout — PDF takes too long to parse
    setTimeout(() => {
      if (!hasStarted) {
        reject(new Error('PARSE_TIMEOUT'));
      }
    }, 15000); // 15 seconds
  });
}

app.post('/extract-pdf', upload.single('resume'), async (req, res) => {
  try {
    // Check 4: No file attached at all
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const text = await extractTextFromPDF(req.file.buffer);

    // Check 5: Extraction succeeded but returned empty text (scanned PDF)
    if (!text || text.trim().length === 0) {
      return res.status(422).json({
        error: 'SCANNED_PDF',
        message:
          'Your PDF appears to be a scanned image. Text cannot be extracted automatically. ' +
          'Please export your resume from Word or Google Docs as a PDF.',
      });
    }

    // Check 6: Text is suspiciously short (partially scanned)
    if (text.trim().length < 100) {
      return res.status(422).json({
        error: 'INSUFFICIENT_TEXT',
        message:
          'Very little text was extracted from your PDF. ' +
          'It may be partially scanned. For best results, use a text-based PDF.',
      });
    }

    // Check 7: Text is too long — trim before sending to AI
    const trimmedText = text.length > 6000 ? text.slice(0, 6000) : text;

    res.json({ success: true, text: trimmedText });

  } catch (error) {
    console.error('PDF parse error:', error.message);

    // Map internal error codes to user-friendly messages
    const errorMessages = {
      EMPTY_BUFFER:       'The uploaded file appears to be empty.',
      PASSWORD_PROTECTED: 'Your PDF is password protected. Please remove the password and try again.',
      CORRUPT_PDF:        'Your PDF file appears to be corrupted. Please try re-exporting it.',
      PARSE_TIMEOUT:      'PDF processing timed out. The file may be too complex. Try a simpler PDF.',
    };

    const userMessage = errorMessages[error.message] || 'Failed to read PDF. Please try a different file.';

    res.status(500).json({ error: userMessage });
  }
});



app.post('/generate-letter', async (req, res) => {
  try {
    const { name, role, company, skills, resumeText, jobDescription } = req.body;

    // Check 1: Required fields missing
    if (!name || !role || !company || !skills) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check 2: resumeText is present but clearly garbage/junk
    if (resumeText && typeof resumeText === 'string' && resumeText.trim().length < 50) {
      return res.status(400).json({
        error: 'Resume text is too short to be useful. Please upload a complete resume.',
      });
    }

    // Check 3: resumeText contains only symbols/numbers (bad extraction)
    if (resumeText) {
      const letterCount = (resumeText.match(/[a-zA-Z]/g) || []).length;
      const totalCount = resumeText.trim().length;
      const letterRatio = letterCount / totalCount;

      if (letterRatio < 0.4) {
        // Less than 40% of characters are letters — likely garbled extraction
        return res.status(422).json({
          error: 'Resume text appears garbled or unreadable. Please try a different PDF.',
        });
      }
    }

    const letter = await generateCoverLetter({ name, role, company, skills, resumeText, jobDescription });
    res.status(200).json({ success: true, letter });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Something went wrong generating the letter.' });
  }
});

// 6. Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});