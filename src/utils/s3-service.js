'use strict';

// @ts-ignore
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// @ts-ignore
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Service {
  constructor(awsConfig = null) {
    // If no config provided, try to load from environment variables
    const config = awsConfig || {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.AWS_S3_BUCKET || 'thanksdoc-compliance-documents'
    };
    
    // Debug logging for environment variables
    ('S3Service Constructor - AWS Config:');
    ('accessKeyId:', config.accessKeyId);
    ('secretAccessKey:', config.secretAccessKey ? 'Set' : 'Not set');
    ('region:', config.region);
    ('bucketName:', config.bucketName);
    ('Full process.env check:');
    ('AWS_ACCESS_KEY_ID from process.env:', process.env.AWS_ACCESS_KEY_ID);
    ('AWS_SECRET_ACCESS_KEY from process.env:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
    ('AWS_REGION from process.env:', process.env.AWS_REGION);
    ('AWS_S3_BUCKET from process.env:', process.env.AWS_S3_BUCKET);
    
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
  }

  // Upload file to S3
  async uploadFile(key, fileBuffer, contentType, metadata = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Metadata: metadata,
    });

    try {
      const result = await this.client.send(command);
      return {
        success: true,
        key: key,
        bucket: this.bucketName,
        location: `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      return { success: true, key };
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  // Generate signed URL for download
  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('S3 Signed URL Error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = S3Service;
