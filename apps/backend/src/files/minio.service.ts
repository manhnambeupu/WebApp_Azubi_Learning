import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

const LESSON_IMAGES_BUCKET = 'lesson-images';
const LESSON_FILES_BUCKET = 'lesson-files';

type ParsedMinioEndpoint = {
  hostname: string;
  port?: number;
  useSSL: boolean;
};

function parseMinioEndpoint(endpoint: string): ParsedMinioEndpoint {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    const parsed = new URL(endpoint);
    return {
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : undefined,
      useSSL: parsed.protocol === 'https:',
    };
  }

  return {
    hostname: endpoint,
    useSSL: false,
  };
}

function encodeObjectPath(objectName: string): string {
  return objectName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly parsedEndpoint = parseMinioEndpoint(
    process.env.MINIO_ENDPOINT ?? 'localhost',
  );
  private readonly useSSL =
    process.env.MINIO_USE_SSL !== undefined
      ? process.env.MINIO_USE_SSL === 'true'
      : this.parsedEndpoint.useSSL;
  private readonly port = Number(
    process.env.MINIO_PORT ??
      this.parsedEndpoint.port ??
      (this.useSSL ? 443 : 9000),
  );
  private readonly accessKey = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
  private readonly secretKey = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
  private readonly publicBaseUrl = (
    process.env.MINIO_PUBLIC_URL ??
    `${this.useSSL ? 'https' : 'http'}://${this.parsedEndpoint.hostname}:${this.port}`
  ).replace(/\/$/, '');

  private readonly client = new Client({
    endPoint: this.parsedEndpoint.hostname,
    port: this.port,
    useSSL: this.useSSL,
    accessKey: this.accessKey,
    secretKey: this.secretKey,
  });

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists(LESSON_IMAGES_BUCKET);
    await this.ensureBucketExists(LESSON_FILES_BUCKET);

    await this.client.setBucketPolicy(
      LESSON_IMAGES_BUCKET,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${LESSON_IMAGES_BUCKET}/*`],
          },
        ],
      }),
    );
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    await this.client.putObject(bucketName, objectName, buffer, buffer.length, {
      'Content-Type': mimetype,
    });

    return this.getPublicUrl(bucketName, objectName);
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucketName, objectName);
  }

  getPresignedUrl(
    bucketName: string,
    objectName: string,
    expiry = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(bucketName, objectName, expiry);
  }

  getPublicUrl(bucketName: string, objectName: string): string {
    return `${this.publicBaseUrl}/${bucketName}/${encodeObjectPath(objectName)}`;
  }

  private async ensureBucketExists(bucketName: string): Promise<void> {
    const bucketExists = await this.client.bucketExists(bucketName);
    if (!bucketExists) {
      await this.client.makeBucket(
        bucketName,
        process.env.MINIO_REGION ?? 'us-east-1',
      );
    }
  }
}
