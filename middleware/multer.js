const multer = require('multer');
const { nanoid } = require('nanoid');


const fileFilter = (req, file, cb) => {
    console.log(file)
    if( !file || 
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/pdf"
    ) {
        console.log('file accepted');
        cb(null, true);
    } else {
        console.log('file rejected');
        console.log(JSON.stringify(cb));
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

const fileFilterCallback = (req, file) => {

}

exports.uploadFile = () => multer({storage: fileStorage, fileFilter}).single('cv');