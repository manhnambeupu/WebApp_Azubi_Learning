import { Client } from 'minio';
import { MinioService } from './minio.service';

const mockClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  setBucketPolicy: jest.fn(),
  putObject: jest.fn(),
  removeObject: jest.fn(),
  presignedGetObject: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn(() => mockClient),
}));

describe('MinioService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MINIO_ENDPOINT = 'http://minio:9000';
    process.env.MINIO_PORT = '9000';
    process.env.MINIO_ACCESS_KEY = 'minio-access';
    process.env.MINIO_SECRET_KEY = 'minio-secret';
    process.env.MINIO_PUBLIC_URL = 'http://minio:9000';
    delete process.env.MINIO_USE_SSL;
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it('onModuleInit creates missing buckets and sets public read policy', async () => {
    mockClient.bucketExists.mockResolvedValue(false);
    mockClient.makeBucket.mockResolvedValue(undefined);
    mockClient.setBucketPolicy.mockResolvedValue(undefined);
    const service = new MinioService();

    await service.onModuleInit();

    expect(mockClient.bucketExists).toHaveBeenCalledWith('lesson-images');
    expect(mockClient.bucketExists).toHaveBeenCalledWith('lesson-files');
    expect(mockClient.makeBucket).toHaveBeenCalledWith('lesson-images', 'us-east-1');
    expect(mockClient.makeBucket).toHaveBeenCalledWith('lesson-files', 'us-east-1');
    expect(mockClient.setBucketPolicy).toHaveBeenCalledWith(
      'lesson-images',
      expect.stringContaining('s3:GetObject'),
    );
  });

  it('uploadFile uploads content and returns public url', async () => {
    mockClient.putObject.mockResolvedValue(undefined);
    const service = new MinioService();
    const content = Buffer.from('x');

    const url = await service.uploadFile(
      'lesson-images',
      'folder/file name.png',
      content,
      'image/png',
    );

    expect(mockClient.putObject).toHaveBeenCalledWith(
      'lesson-images',
      'folder/file name.png',
      content,
      content.length,
      {
        'Content-Type': 'image/png',
      },
    );
    expect(url).toBe('http://minio:9000/lesson-images/folder/file%20name.png');
  });

  it('deleteFile delegates to minio client', async () => {
    mockClient.removeObject.mockResolvedValue(undefined);
    const service = new MinioService();

    await service.deleteFile('lesson-files', 'doc-1.docx');

    expect(mockClient.removeObject).toHaveBeenCalledWith('lesson-files', 'doc-1.docx');
  });

  it('getPresignedUrl delegates with requested expiry', async () => {
    mockClient.presignedGetObject.mockResolvedValue('https://signed-url');
    const service = new MinioService();

    const url = await service.getPresignedUrl('lesson-files', 'doc-1.docx', 1200);

    expect(mockClient.presignedGetObject).toHaveBeenCalledWith(
      'lesson-files',
      'doc-1.docx',
      1200,
    );
    expect(url).toBe('https://signed-url');
  });

  it('supports endpoint without protocol and ssl override', () => {
    process.env.MINIO_ENDPOINT = 'minio';
    process.env.MINIO_USE_SSL = 'true';
    delete process.env.MINIO_PORT;
    delete process.env.MINIO_PUBLIC_URL;
    const service = new MinioService();

    expect(Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endPoint: 'minio',
        useSSL: true,
        port: 443,
      }),
    );
    expect(service.getPublicUrl('lesson-images', 'image.png')).toBe(
      'https://minio:443/lesson-images/image.png',
    );
  });
});
