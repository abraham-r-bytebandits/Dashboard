import React, { useState } from 'react';
import api from '@/api/axios';
import { Upload, Button, Card, Typography, message, Image, Divider } from 'antd';
import { InboxOutlined, DownloadOutlined, FileImageOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Text } = Typography;
const { Dragger } = Upload;

const ImageConverter: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (fileList.length === 0) {
      message.error("Please select an image first.");
      return;
    }

    const selectedFile = (fileList[0].originFileObj || fileList[0]) as File;

    if (!selectedFile) {
      message.error("Invalid file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setIsLoading(true);

    try {
      const response = await api.post(
        "/image/convert",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: 'blob',
        }
      );

      const webpBlob = new Blob([response.data], { type: "image/webp" });
      const webpUrl = URL.createObjectURL(webpBlob);

      setConvertedImageUrl(webpUrl);
      message.success("Image successfully converted to WebP!");

    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to convert image.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
      if (convertedImageUrl) {
        URL.revokeObjectURL(convertedImageUrl);
        setConvertedImageUrl(null);
      }
    },
    beforeUpload: (file) => {
      setFileList([file as unknown as UploadFile]);
      if (convertedImageUrl) {
        URL.revokeObjectURL(convertedImageUrl);
        setConvertedImageUrl(null);
      }
      return false; // Prevent automatic upload without user clicking "Convert"
    },
    fileList,
    maxCount: 1,
    accept: "image/*",
    className: "upload-list-inline",
  };

  return (
    <div className="flex-1 w-full bg-[#F3F3F9] p-4 sm:p-6 lg:p-10 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8 mt-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-[#405189] rounded-xl hidden sm:block">
              <FileImageOutlined className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight m-0">
                WebP Image Optimizer
              </h1>
              <p className="text-gray-500 mt-2 text-sm font-medium leading-relaxed max-w-2xl">
                Upload your heavy PNGs or JPEGs and convert them instantly to highly-optimized, next-gen WebP formats without compromising on visual quality.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* Upload Section */}
          <Card
            className="lg:col-span-1 shadow-sm rounded-2xl border-gray-100 overflow-hidden flex flex-col h-full"
            styles={{ body: { padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 } }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#405189] text-xs font-bold text-center">1</span>
              Upload Original Image
            </h3>

            <Dragger
              {...uploadProps}
              className="bg-gray-50/50 hover:bg-gray-50 transition-colors border-2 border-dashed border-gray-200 rounded-xl overflow-hidden"
              style={{ padding: '32px 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
            >
              {fileList.length === 0 ? (
                <>
                  <p className="ant-upload-drag-icon text-[#405189] mb-4">
                    <InboxOutlined className="text-6xl opacity-80" />
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mb-2">Click or drag image to this area</p>
                  <p className="text-sm text-gray-500 px-4 sm:px-8">
                    Supported formats include JPG, PNG, GIF, and TIFF.
                  </p>
                </>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center">
                  <p className="text-[#405189] font-semibold text-lg mb-1">Image Ready!</p>
                  <p className="text-sm text-gray-400">Click the button below to convert.</p>
                </div>
              )}
            </Dragger>

            <Button
              type="primary"
              size="large"
              className="w-full mt-8 h-14 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={handleConvert}
              disabled={fileList.length === 0}
              loading={isLoading}
              style={{ backgroundColor: fileList.length === 0 ? undefined : '#405189', marginTop: 'auto' }}
            >
              {isLoading ? 'Converting to WebP...' : 'Convert Image Now'}
            </Button>
          </Card>

          {/* Result Section */}
          <Card
            className="lg:col-span-1 shadow-sm rounded-2xl border-gray-100 flex flex-col h-full"
            styles={{ body: { padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 } }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold text-center">2</span>
              Resulting WebP
            </h3>

            {!convertedImageUrl ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50 p-8 text-center text-gray-400 min-h-[300px]">
                {isLoading ? (
                  <LoadingOutlined className="text-5xl text-[#405189] mb-4 animate-spin" />
                ) : (
                  <FileImageOutlined className="text-5xl mb-4 opacity-50" />
                )}
                <p className="text-sm font-medium text-gray-500">
                  {isLoading ? 'Processing your image...' : 'Your optimized image will appear here'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between flex-1 animate-in fade-in zoom-in duration-300">
                <div className="relative group w-full bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-center min-h-[200px]">
                  <Image
                    src={convertedImageUrl}
                    alt="Converted WebP"
                    className="rounded-lg shadow-sm object-contain"
                    style={{ maxHeight: '250px', width: 'auto', maxWidth: '100%' }}
                    preview={{
                      mask: <div className="text-white text-sm font-medium">Click to Preview</div>
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm tracking-wider">
                    WEB-P
                  </div>
                </div>

                <div className="w-full mt-auto">
                  <Divider className="my-6" />

                  <div className="w-full space-y-3">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      href={convertedImageUrl}
                      download="optimized-image.webp"
                      size="large"
                      className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-none shadow-md hover:shadow-lg text-white font-semibold"
                    >
                      Download WebP Image
                    </Button>
                    <Text type="secondary" className="block text-center text-xs font-medium">
                      File is ready and temporarily stored in your browser.
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;
