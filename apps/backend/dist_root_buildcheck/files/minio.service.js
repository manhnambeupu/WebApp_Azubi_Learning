"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const minio_1 = require("minio");
const LESSON_IMAGES_BUCKET = 'lesson-images';
const LESSON_FILES_BUCKET = 'lesson-files';
function parseMinioEndpoint(endpoint) {
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
function encodeObjectPath(objectName) {
    return objectName
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
}
let MinioService = class MinioService {
    parsedEndpoint = parseMinioEndpoint(process.env.MINIO_ENDPOINT ?? 'localhost');
    useSSL = process.env.MINIO_USE_SSL !== undefined
        ? process.env.MINIO_USE_SSL === 'true'
        : this.parsedEndpoint.useSSL;
    port = Number(process.env.MINIO_PORT ??
        this.parsedEndpoint.port ??
        (this.useSSL ? 443 : 9000));
    accessKey = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
    secretKey = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
    publicBaseUrl = (process.env.MINIO_PUBLIC_URL ??
        `${this.useSSL ? 'https' : 'http'}://${this.parsedEndpoint.hostname}:${this.port}`).replace(/\/$/, '');
    client = new minio_1.Client({
        endPoint: this.parsedEndpoint.hostname,
        port: this.port,
        useSSL: this.useSSL,
        accessKey: this.accessKey,
        secretKey: this.secretKey,
    });
    async onModuleInit() {
        await this.ensureBucketExists(LESSON_IMAGES_BUCKET);
        await this.ensureBucketExists(LESSON_FILES_BUCKET);
        await this.client.setBucketPolicy(LESSON_IMAGES_BUCKET, JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${LESSON_IMAGES_BUCKET}/*`],
                },
            ],
        }));
    }
    async uploadFile(bucketName, objectName, buffer, mimetype) {
        await this.client.putObject(bucketName, objectName, buffer, buffer.length, {
            'Content-Type': mimetype,
        });
        return this.getPublicUrl(bucketName, objectName);
    }
    async deleteFile(bucketName, objectName) {
        await this.client.removeObject(bucketName, objectName);
    }
    getPresignedUrl(bucketName, objectName, expiry = 3600) {
        return this.client.presignedGetObject(bucketName, objectName, expiry);
    }
    getPublicUrl(bucketName, objectName) {
        return `${this.publicBaseUrl}/${bucketName}/${encodeObjectPath(objectName)}`;
    }
    async ensureBucketExists(bucketName) {
        const bucketExists = await this.client.bucketExists(bucketName);
        if (!bucketExists) {
            await this.client.makeBucket(bucketName, process.env.MINIO_REGION ?? 'us-east-1');
        }
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = __decorate([
    (0, common_1.Injectable)()
], MinioService);
//# sourceMappingURL=minio.service.js.map