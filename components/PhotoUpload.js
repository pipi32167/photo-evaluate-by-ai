"use client"
import { useState } from 'react';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode-generator';

const PhotoUpload = () => {
    const [previewSrc, setPreviewSrc] = useState(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
                    <p>Analyzing photo...</p>
                </div>
            `);
            setError('');
        }
    };

    const handleError = (error) => {
        console.error('Error:', error);
        let errorMessage = 'Error analyzing photo. Please try again.';

        if (error.name === 'TypeError' && !navigator.onLine) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.response) {
            errorMessage = `Server error: ${error.response.status}`;
        }

        setError(errorMessage);
        setResult('');
    };

    const uploadPhoto = async (file) => {
        if (!file) {
            setError('Please select a photo first');
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const markdownContent = marked.parse(data.result);
            setResult(`
                <h2>Analysis Result:</h2>
                <div class="markdown-content">${markdownContent}</div>
            `);
            setError('')
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
        // qrCodeImg.style.position = 'absolute';
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
                    {isLoading ? 'Analyzing...' : 'Select & Analyze Photo'}
                </button>
                <button className="button" onClick={handleShare} disabled={isLoading || !result}>
                    Share
                </button>
            </div>
            {/* <style jsx>{`
                .container {
                    position: relative;
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    text-align: center;
                }
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }
                .loading {
                    border: 16px solid #f3f3f3;
                    border-top: 16px solid #3498db;
                    border-radius: 50%;
                    width: 120px;
                    height: 120px;
                    animation: spin 2s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .markdown-content {
                    margin: 20px 0;
                }
                .error-message {
                    color: red;
                }
                .upload-btn-wrapper {
                    margin-top: 20px;
                }
                .button {
                    margin: 0 10px;
                    padding: 10px 20px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
            `}</style> */}
        </div>
    );
};

export default PhotoUpload;
