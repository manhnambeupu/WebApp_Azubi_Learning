import { OnModuleInit } from '@nestjs/common';
export declare class MinioService implements OnModuleInit {
    private readonly parsedEndpoint;
    private readonly useSSL;
    private readonly port;
    private readonly accessKey;
    private readonly secretKey;
    private readonly publicBaseUrl;
    private readonly client;
    onModuleInit(): Promise<void>;
    uploadFile(bucketName: string, objectName: string, buffer: Buffer, mimetype: string): Promise<string>;
    deleteFile(bucketName: string, objectName: string): Promise<void>;
    getPresignedUrl(bucketName: string, objectName: string, expiry?: number): Promise<string>;
    getPublicUrl(bucketName: string, objectName: string): string;
    private ensureBucketExists;
}
