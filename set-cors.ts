import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./server/lib/s3-client";

async function setCors() {
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    console.error("Missing R2_BUCKET_NAME");
    process.exit(1);
  }

  const corsRules = {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  const command = new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: corsRules,
  });

  try {
    const response = await s3Client.send(command);
    console.log("CORS policy successfully set for bucket:", bucketName);
    console.log(response);
  } catch (error) {
    console.error("Failed to set CORS policy:", error);
  }
}

setCors();
