// src/components/PhotoUpload.tsx
"use client"
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode-generator';
import { useTranslation } from 'react-i18next';

const PhotoUpload = () => {
    const { t, i18n } = useTranslation();
    const [previewSrc, setPreviewSrc] = useState(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnalysisSuccessful, setIsAnalysisSuccessful] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewSrc(e.target.result);
                uploadPhoto(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const setLoading = (loading) => {
        setIsLoading(loading);
        if (loading) {
            setResult(`
                <div class="loading-container">
                    <div class="loading"></div>
                    <p>${t('analyzingPhoto')}...</p>
                </div>
            `);
            setError('');
        }
    };

    const handleError = (error) => {
        console.error('Error:', error);
        let errorMessage = t('errorAnalyzingPhoto');

        if (error.name === 'TypeError' && !navigator.onLine) {
            errorMessage = t('networkError');
        } else if (error.response) {
            errorMessage = `${t('serverError')}: ${error.response.status}`;
        }

        setError(errorMessage);
        setResult('');
        setIsAnalysisSuccessful(false);
    };

    const uploadPhoto = async (file) => {
        if (!file) {
            setError(t('pleaseSelectPhoto'));
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/evaluate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`${t('httpError')}! status: ${response.status}`);
            }

            const data = await response.json();
            const markdownContent = marked.parse(data.result);
            setResult(`
                <h2>${t('analysisResult')}:</h2>
                <div class="markdown-content">${markdownContent}</div>
            `);
            setError('');
            setIsAnalysisSuccessful(true);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = (text) => {
        const qr = QRCode(0, 'M');
        qr.addData(text);
        qr.make();
        return qr.createDataURL(4);
    };

    const handleShare = async () => {
        const element = document.querySelector('.container');
        if (!element) return;
    
        // Add temporary padding to the container
        element.style.padding = '20px';
        element.style.boxSizing = 'border-box';
    
        // Create a QR code
        const qrCodeSrc = generateQRCode('https://photo-evaluate-by-ai.vercel.app/'); // Replace with your desired URL
        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = qrCodeSrc;
        qrCodeImg.style.bottom = '10px';
        qrCodeImg.style.left = '10px';
        qrCodeImg.style.width = '100px';
        qrCodeImg.style.height = '100px';
        element.appendChild(qrCodeImg);
    
        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Increase the scale for better quality on mobile
                windowWidth: 375, // Set the width to a common mobile screen width
            });
    
            // Remove the QR code image and temporary padding
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
            // Remove the QR code image and temporary padding in case of an error
            element.removeChild(qrCodeImg);
            element.style.padding = '';
            element.style.boxSizing = '';
        }
    };    

    return (
        <div className="container">
            <img id="preview" src={previewSrc} alt="Preview" style={{ display: previewSrc ? 'block' : 'none' }} />
            <div dangerouslySetInnerHTML={{ __html: result }} />
            {error && <p className="error-message">{error}</p>}
            <div className="upload-btn-wrapper">
                <input type="file" id="photoInput" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <button className="button" onClick={() => document.getElementById('photoInput').click()} disabled={isLoading}>
                    {isLoading ? t('analyzing') : t('selectAndAnalyzePhoto')}
                </button>
                {isAnalysisSuccessful && (
                    <button className="button" onClick={handleShare} disabled={isLoading}>
                        {t('share')}
                    </button>
                )}
                {/* <button className="button" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
                    {i18n.language === 'en' ? t('switchToFrench') : t('switchToEnglish')}
                </button> */}
            </div>
        </div>
    );
};

export default PhotoUpload;
