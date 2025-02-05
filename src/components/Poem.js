// src/components/PhotoUpload.tsx
"use client";
import { useState } from "react";
import { marked } from "marked";
import html2canvas from "html2canvas";
import QRCode from "qrcode-generator";
import { useTranslation } from "react-i18next";
import "@/styles/Poem.css";
import { get } from "http";

const Poem = () => {
  const { t, i18n } = useTranslation();
  const [previewSrc, setPreviewSrc] = useState(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageDescription, setImageDescription] = useState("");

  // console.log('i18n.language', i18n.language)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          let resizedFile = file;
          if (img.width > 1024 || img.height > 1024) {
            resizedFile = resizeImage(file, img);
          }
          setPreviewSrc(URL.createObjectURL(resizedFile));
          getPhotoDescription(resizedFile);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const getPhotoDescription = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/analyse-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`${t("httpError")}! status: ${response.status}`);
    }

    const data = await response.json();
    setImageDescription(data.result);
    return data.result;
  };

  const resizeImage = (file, img) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
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

    return dataURLtoFile(canvas.toDataURL("image/jpeg", 0.8), file.name);
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const setLoading = (loading) => {
    setIsLoading(loading);
    if (loading) {
      setResult(`
                <div class="loading-container">
                    <div class="loading"></div>
                    <p>${t("generatingPhoto")}...</p>
                </div>
            `);
      setError("");
    }
  };

  const handleError = (error) => {
    console.error("Error:", error);
    let errorMessage = t("errorGeneratingPhoto");

    if (error.name === "TypeError" && !navigator.onLine) {
      errorMessage = t("networkError");
    } else if (error.response) {
      errorMessage = `${t("serverError")}: ${error.response.status}`;
    }

    setError(errorMessage);
    setResult("");
    // setIsAnalysisSuccessful(false);
  };

  const generatePoem = async () => {
    const file = document.getElementById("photoInput").files[0];
    if (!file) {
      setError(t("pleaseSelectPhoto"));
      return;
    }

    setLoading(true);

    try {
      let imageDesc = imageDescription;
      if (imageDesc === "") {
        imageDesc = await getPhotoDescription(file);
      }
      const formData = new FormData();
      // formData.append("image", file);
      formData.append("lang", i18n.language);
      formData.append("image_desc", imageDesc);

      const response = await fetch("/api/generate-poem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`${t("httpError")}! status: ${response.status}`);
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
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language }).value;
        },
        langPrefix: "hljs language-",
        quote: false,
        taskLists: true,
      });
      // Adjusting markdown style for tables to have borders, centered text, and margin
      const adjustedMarkdownContent = markdownContent.replace(
        /<table>/g,
        '<table border="1" style="width: 100%; margin: 10px 0; border-collapse: collapse;">'
      );
      const adjustedMarkdownContentWithCenteredText = adjustedMarkdownContent
        .replace(/<td>/g, '<td style="text-align: center; padding: 5px;">')
        .replace(/<th>/g, '<th style="text-align: center; padding: 5px;">');
      setResult(`
                <h2>${t("generateResult")}:</h2>
                <div class="markdown-content">${adjustedMarkdownContentWithCenteredText}</div>
            `);
      setError("");
      // setIsAnalysisSuccessful(true);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container">
      <h1>{t("generatePoemTitle")}</h1>
      <img
        id="preview"
        src={previewSrc}
        alt="Preview"
        style={{ display: previewSrc ? "block" : "none" }}
      />
      <div dangerouslySetInnerHTML={{ __html: result }} />
      {error && <p className="error-message">{error}</p>}
      <div className="upload-btn-wrapper">
        <input
          type="file"
          id="photoInput"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          className="button"
          onClick={() => document.getElementById("photoInput").click()}
          disabled={isLoading}
        >
          {t("selectPhoto")}
        </button>

        <button
          className="button"
          onClick={() => generatePoem()}
          disabled={isLoading || !previewSrc}
        >
          {isLoading ? t("generating") : t("generatePoem")}
        </button>
      </div>
    </div>
  );
};

export default Poem;
