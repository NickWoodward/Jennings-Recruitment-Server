const multer = require('multer');
const { nanoid } = require('nanoid');


const fileFilter = (req, file, cb) => {
    if( !file || 
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/pdf"
    ) {
        cb(null, true);
    } else {
        console.log('file rejected');
        cb(null, false);
    }
};
const fileStorage =  multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'cvs');    
    },
    filename: (req, file, cb) => {
        cb(null, `${nanoid(7)}.${file.originalname}`);
    }
});


exports.uploadFile = () => multer({storage: fileStorage, fileFilter}).single('cv');