const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: process.env.ACCESS_KEY_ID,
  region: 'ap-southeast-1',
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  if (!validMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }

  return cb(null, true);
};

module.exports = () => {
  return multer({
    fileFilter,
    storage: multerS3({
      acl: 'public-read',
      s3,
      bucket: process.env.BUCKET,
      key: (req, file, cb) => {
        const { originalname, fieldname } = file;

        let fileName = req.user_id ? `${req.user_id}/` : '';
        fileName += Date.now() + '__' + originalname.replace(/ /g, '_');

        const imageUrl = `https://${bucket}.s3-ap-southeast-1.amazonaws.com/${fileName}`;

        if (req.image) {
          req.body.image = imageUrl;
        } else {
          req.body.avatar = imageUrl;
        }

        return cb(null, fileName);
      },
    }),
  });
};
