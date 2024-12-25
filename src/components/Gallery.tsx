// src/components/Gallery.tsx
"use client"
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode-generator';
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

const Gallery = () => {
    const { t, i18n } = useTranslation();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const calculateMD5 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                const md5 = CryptoJS.MD5(wordArray).toString();
                resolve(md5);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            const newPhotos = [];
            for (const file of files) {
                const md5 = await calculateMD5(file);
                if (!photos.some(photo => photo.md5 === md5)) {
                    newPhotos.push({
                        file,
                        previewSrc: URL.createObjectURL(file),
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

    const resizeImage = (file, img) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let ratio = 1;

        if (img.width > img.height) {
            if (img.width > 1024) {
                ratio = 1024 / img.width;
            }
        } else {
            if (img.height > 1024) {
                ratio = 1024 / img.height;
            }
        }

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return dataURLtoFile(canvas.toDataURL('image/jpeg', 0.8), file.name);
    };

    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]);
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const setLoading = (index, loading) => {
        setPhotos(prevPhotos => prevPhotos.map((photo, i) =>
            i === index ? { ...photo, isLoading: loading } : photo
        ));
    };

    const handleError = (index, error) => {
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

    const uploadPhoto = async (index) => {
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
            const markdownContent = marked.parse(data.result, {
                renderer: new marked.Renderer(),
                gfm: true,
                tables: true,
                breaks: false,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: false,
                xhtml: false,
                highlight: function (code, lang) {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                },
                langPrefix: 'hljs language-',
                quote: false,
                taskLists: true
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
            handleError(index, error);
        } finally {
            setLoading(index, false);
        }
    };

    const generateQRCode = (text) => {
        const qr = QRCode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createDataURL(4);
    };

    const handleShare = async (index) => {
        const element = document.querySelector('.container');
        if (!element) return;

        element.style.padding = '20px';
        element.style.boxSizing = 'border-box';

        const qrCodeSrc = generateQRCode('https://photo-evaluate-by-ai.vercel.app/');
        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = qrCodeSrc;
        qrCodeImg.style.bottom = '10px';
        qrCodeImg.style.left = '10px';
        qrCodeImg.style.width = '100px';
        qrCodeImg.style.height = '100px';
        element.appendChild(qrCodeImg);

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                windowWidth: 375,
            });

            element.removeChild(qrCodeImg);
            element.style.padding = '';
            element.style.boxSizing = '';

            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'photo-analysis.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating screenshot:', error);
            element.removeChild(qrCodeImg);
            element.style.padding = '';
            element.style.boxSizing = '';
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
                    <button className="button" onClick={() => document.getElementById('photoInput').click()} disabled={photos[currentIndex]?.isLoading}>
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
