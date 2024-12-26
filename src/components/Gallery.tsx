// src/components/Gallery.tsx
"use client"
import { useState, useEffect, ChangeEvent } from 'react';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import CryptoJS from 'crypto-js';

interface Photo {
    file: File;
    previewSrc: string;
    result: string;
    isLoading: boolean;
    error: string;
    isAnalysisSuccessful: boolean;
    md5: string;
}

interface CustomError extends Error {
    response?: {
        status: number;
    };
}

const Gallery = () => {
    const { t, i18n } = useTranslation();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const calculateMD5 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wordArray = CryptoJS.lib.WordArray.create(e.target?.result as ArrayBuffer);
                const md5 = CryptoJS.MD5(wordArray).toString();
                resolve(md5);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPhotos: Photo[] = [];
            for (const file of Array.from(files)) {
                const md5 = await calculateMD5(file);
                const file2 = await resizeImage(file);
                if (!photos.some(photo => photo.md5 === md5)) {
                    newPhotos.push({
                        file,
                        previewSrc: URL.createObjectURL(file2),
                        result: '',
                        isLoading: false,
                        error: '',
                        isAnalysisSuccessful: false,
                        md5,
                    });
                }
            }
            setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
        }
    };

    // if file is too large, resize it before uploading, max width or height is 1024
    // else return the original file
    const resizeImage = (file: File): Promise<File> => {

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;
                    if (width < MAX_WIDTH && height < MAX_HEIGHT) {
                        resolve(file);
                        return;
                    }

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(blob => {
                        if (blob) {
                            const resizedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(resizedFile);
                        } else {
                            reject(new Error('Error resizing image'));
                        }
                    }, file.type);
                };
                img.src = e.target?.result as string;
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsDataURL(file);
        });
    };

    const setLoading = (index: number, loading: boolean) => {
        setPhotos(prevPhotos => prevPhotos.map((photo, i) =>
            i === index ? { ...photo, isLoading: loading } : photo
        ));
    };

    const handleError = (index: number, error: CustomError) => {
        console.error('Error:', error);
        let errorMessage = t('errorAnalyzingPhoto');

        if (error.name === 'TypeError' && !navigator.onLine) {
            errorMessage = t('networkError');
        } else if (error.response) {
            errorMessage = `${t('serverError')}: ${error.response.status}`;
        }

        setPhotos(prevPhotos => prevPhotos.map((photo, i) =>
            i === index ? { ...photo, error: errorMessage, isLoading: false, isAnalysisSuccessful: false } : photo
        ));
    };

    const uploadPhoto = async (index: number) => {
        const photo = photos[index];
        if (!photo.file) {
            setPhotos(prevPhotos => prevPhotos.map((p, i) =>
                i === index ? { ...p, error: t('pleaseSelectPhoto') } : p
            ));
            return;
        }

        setLoading(index, true);

        try {
            const formData = new FormData();
            formData.append('image', photo.file);
            formData.append('lang', i18n.language);

            const response = await fetch('/api/evaluate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`${t('httpError')}! status: ${response.status}`);
            }

            const data = await response.json();
            const markdownContent = await marked.parse(data.result, {
                renderer: new marked.Renderer(),
                gfm: true,
                // tables: true,
                breaks: false,
                pedantic: false,
                // sanitize: false,
                // smartLists: true,
                // smartypants: false,
                // xhtml: false,
                // highlight: function (code, lang) {
                //     const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                //     return hljs.highlight(code, { language }).value;
                // },
                // langPrefix: 'hljs language-',
                // quote: false,
                // taskLists: true
            });
            const adjustedMarkdownContent = markdownContent.replace(/<table>/g, '<table border="1" style="width: 100%; margin: 10px 0; border-collapse: collapse;">');
            const adjustedMarkdownContentWithCenteredText = adjustedMarkdownContent
                .replace(/<td>/g, '<td style="text-align: center; padding: 5px;">')
                .replace(/<th>/g, '<th style="text-align: center; padding: 5px;">');
            setPhotos(prevPhotos => prevPhotos.map((p, i) =>
                i === index ? {
                    ...p, result: `
                    <div>${t('analysisResult')}:</div>
                    <div class="markdown-content">${adjustedMarkdownContentWithCenteredText}</div>
                `, isLoading: false, error: '', isAnalysisSuccessful: true
                } : p
            ));
        } catch (error) {
            handleError(index, error as CustomError);
        } finally {
            setLoading(index, false);
        }
    };

    const handlePrev = () => {
        setCurrentIndex(prevIndex => Math.max(prevIndex - 1, 0));
    };

    const handleNext = () => {
        setCurrentIndex(prevIndex => Math.min(prevIndex + 1, photos.length - 1));
    };

    // 自动上传图片
    useEffect(() => {
        if (photos.length > 0 && !photos[currentIndex].isAnalysisSuccessful && !photos[currentIndex].isLoading) {
            uploadPhoto(currentIndex);
        }
    }, [photos, currentIndex]);

    return (
        <div className="gallery-container">
            <div className="gallery">
                <img id="preview" src={photos[currentIndex]?.previewSrc} alt="Preview" style={{ display: photos[currentIndex]?.previewSrc ? 'block' : 'none' }} />
                <div dangerouslySetInnerHTML={{ __html: photos[currentIndex]?.result }} />
                {photos[currentIndex]?.error && <p className="error-message">{photos[currentIndex].error}</p>}
                <div className="upload-btn-wrapper">
                    <input type="file" id="photoInput" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                    <button className="button" onClick={() => document.getElementById('photoInput')?.click()} disabled={photos[currentIndex]?.isLoading}>
                        {photos[currentIndex]?.isLoading ? t('analyzing') : t('selectAndAnalyzePhoto')}
                    </button>
                    {/* {photos[currentIndex]?.isAnalysisSuccessful && (
                        <button className="button" onClick={() => handleShare(currentIndex)} disabled={photos[currentIndex]?.isLoading}>
                            {t('share')}
                        </button>
                    )} */}
                </div>
            </div>
            {photos.length > 1 && (
                <div className="navigation-buttons">
                    <button className="button navigation-button" onClick={handlePrev} disabled={currentIndex === 0}>
                        {t('prev')}
                    </button>
                    <button className="button navigation-button" onClick={handleNext} disabled={currentIndex === photos.length - 1}>
                        {t('next')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Gallery;
