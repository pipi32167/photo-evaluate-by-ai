"use client"
import { useState } from 'react';
import { marked } from 'marked';

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
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
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
            </div>
        </div>
    );
};

export default PhotoUpload;
