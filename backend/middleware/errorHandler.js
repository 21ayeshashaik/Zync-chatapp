export const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.'
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Unexpected file field.'
        });
    }

    // Custom file type error
    if (err.message.includes('File type') && err.message.includes('not allowed')) {
        return res.status(400).json({
            error: err.message
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
};