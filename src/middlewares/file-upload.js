'use strict';

const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time for compliance documents
  },
  fileFilter: fileFilter
});

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only apply to compliance document upload routes
    if (ctx.request.path.includes('/compliance-documents/upload')) {
      ('File upload middleware triggered for:', ctx.request.path);
      ('Request method:', ctx.request.method);
      ('Content-Type:', ctx.request.headers['content-type']);
      
      try {
        await new Promise((resolve, reject) => {
          upload.single('file')(ctx.request, ctx.response, (err) => {
            if (err) {
              ('Multer error:', err);
              if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                  return reject(new Error('File too large. Maximum size is 10MB.'));
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                  return reject(new Error('Too many files. Only one file allowed.'));
                }
              }
              return reject(err);
            }
            
            // Transform the file for Strapi compatibility
            if (ctx.request.file) {
              ('File received:', {
                name: ctx.request.file.originalname,
                size: ctx.request.file.size,
                mimetype: ctx.request.file.mimetype
              });
              ctx.request.files = {
                file: {
                  name: ctx.request.file.originalname,
                  data: ctx.request.file.buffer,
                  size: ctx.request.file.size,
                  mimetype: ctx.request.file.mimetype
                }
              };
            } else {
              ('No file received in multer');
            }
            
            resolve();
          });
        });
      } catch (error) {
        ('File upload middleware error:', error.message);
        return ctx.badRequest(error.message);
      }
    }
    
    await next();
  };
};
