import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = this.createS3Client();
  }

  /**
   * Creates an S3 client instance with appropriate credentials
   * If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not provided,
   * it will use the IAM role attached to the instance
   */
  private createS3Client(): S3Client {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>(
      'aws.secretAccessKey',
    );

    const config: Record<string, any> = {
      region: region || 'us-east-1', // Default region if not specified
    };

    // Only add credentials if both access key and secret are provided
    if (accessKeyId && secretAccessKey) {
      this.logger.debug('Using AWS credentials from environment variables');
      config.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    } else {
      this.logger.debug('Using IAM role for AWS authentication');
    }

    return new S3Client(config);
  }

  /**
   * Upload a file to S3
   * @param opts - Options for uploading the file
   * @param opts.bucket - The name of the bucket
   * @param opts.key - The key (path) where the file will be stored
   * @param opts.body - The file content
   * @param opts.contentType - The content type of the file
   * @param opts.metadata - Optional metadata for the file
   */
  async uploadFile(opts: {
    bucket: string;
    key: string;
    body: Buffer | string;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      Metadata: opts.metadata,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get a file from S3
   * @param opts - Options for getting the file
   * @param opts.bucket - The name of the bucket
   * @param opts.key - The key (path) of the file
   */
  async getFile(opts: { bucket: string; key: string }): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
    });

    const response = await this.s3Client.send(command);
    return Buffer.from(await response.Body.transformToByteArray());
  }

  /**
   * Delete a file from S3
   * @param opts - Options for deleting the file
   * @param opts.bucket - The name of the bucket
   * @param opts.key - The key (path) of the file to delete
   */
  async deleteFile(opts: { bucket: string; key: string }): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
    });

    await this.s3Client.send(command);
  }

  /**
   * List files in an S3 bucket
   * @param opts - Options for listing files
   * @param opts.bucket - The name of the bucket
   * @param opts.prefix - Optional prefix to filter results
   * @param opts.maxKeys - Maximum number of keys to return
   * @param opts.continuationToken - Token to continue listing from a previous request
   */
  async listFiles(opts: {
    bucket: string;
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }) {
    const command = new ListObjectsV2Command({
      Bucket: opts.bucket,
      Prefix: opts.prefix,
      MaxKeys: opts.maxKeys,
      ContinuationToken: opts.continuationToken,
    });

    const response = await this.s3Client.send(command);
    return response.Contents || [];
  }

  /**
   * Generate a presigned URL for downloading a file from S3
   * @param opts - Options for generating the presigned URL
   * @param opts.bucket - The name of the bucket
   * @param opts.key - The key (path) of the file
   * @param opts.expiresIn - Number of seconds until the presigned URL expires (default: 3600)
   * @param opts.responseContentType - Optional content type for the response
   * @param opts.responseContentDisposition - Optional content disposition for the response
   * @returns Promise<string> - The presigned URL
   */
  async getPresignedUrl(opts: {
    bucket: string;
    key: string;
    expiresIn?: number;
    responseContentType?: string;
    responseContentDisposition?: string;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      ResponseContentType: opts.responseContentType,
      ResponseContentDisposition: opts.responseContentDisposition,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: opts.expiresIn || 3600,
    });
  }

  /**
   * Generate a presigned URL for uploading a file to S3
   * @param opts - Options for generating the presigned URL
   * @param opts.bucket - The name of the bucket
   * @param opts.key - The key (path) where the file will be stored
   * @param opts.expiresIn - Number of seconds until the presigned URL expires (default: 3600)
   * @param opts.contentType - Optional content type for the upload
   * @param opts.metadata - Optional metadata for the file
   * @returns Promise<string> - The presigned URL
   */
  async createPresignedPost(opts: {
    bucket: string;
    key: string;
    expiresIn?: number;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
      Metadata: opts.metadata,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: opts.expiresIn || 3600,
    });
  }
}
