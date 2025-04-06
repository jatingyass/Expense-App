const AWS = require("aws-sdk");
require("dotenv").config();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
});

// Function to Upload File to S3
const uploadToS3 = async (fileContent, fileName) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ACL: "public-read",
        ContentType: "text/csv"
    };

    return s3.upload(params).promise();
};

module.exports = { uploadToS3 };
