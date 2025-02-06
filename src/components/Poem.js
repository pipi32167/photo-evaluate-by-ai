// src/components/PhotoUpload.tsx
"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import "@/styles/Poem.css";
import { get_section } from "@/utils/xml";

const Poem = () => {
  const { t, i18n } = useTranslation();
  const [previewSrc, setPreviewSrc] = useState(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [specificName, setSpecificName] = useState("");
  const [style, setStyle] = useState("");
  const [userInput, setUserInput] = useState("");

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
      const prompt = `
# 图片描述
${imageDesc}

# 诗歌风格
${style}

# 诗歌体裁
${genre}

# 诗歌名称
${specificName}

# 用户输入
${userInput}

# 任务
请基于以上信息，创作一首诗歌。
1. 请先进行深度思考。深度思考的内容放在<think>标签中。
2. 根据深度思考的内容，创作一首诗歌，必须包含标题。诗歌的内容放在<poem>标签中。

# 诗歌生成
      `;
      // 3. 根据最终生成的诗歌生成一个 svg，诗歌标题和内容放在<svg>标签中。使用宋体字体，字号 24，行间距 1.5 倍行高。风格古意盎然。请针对诗词的长度进行调整，使得诗词的长度适中。

      const formData = new FormData();
      // formData.append("image", file);
      formData.append("lang", i18n.language);
      formData.append("prompt", prompt);

      const response = await fetch("/api/generate-poem", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`${t("httpError")}! status: ${response.status}`);
      }

      const data = await response.json();
      const poemContent = data.result;

      // const think_result = get_section(poemContent, "think");
      const poem = get_section(poemContent, "poem").replace(/\*/g, "");

      const poemLines = poem.trim().split("\n");

      const poemTitle = poemLines[0].trim();

      const poemContentLines = poemLines.slice(1);

      const svgHeight = poemLines.length * 24 * 1.2;
      const svgContent = `
<svg width="600" height="${svgHeight}"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0eee4"/>
  <text x="50%" y="20" font-family="宋体" font-size="24" text-anchor="middle" fill="#3a2e28">
    <tspan x="50%" dy="0">${poemTitle}</tspan>
  </text>
  <text x="50%" y="100" font-family="宋体" font-size="24" text-anchor="middle" fill="#3a2e28" dominant-baseline="middle" line-height="1.2em">
    ${poemContentLines
      .map((line) => `<tspan x="50%" dy="1.2em">${line}</tspan>`)
      .join("\n")}
  </text>
</svg>`;

      setResult(`
        <h2>${t("generateResult")}:</h2>
        <div class="svg-content">${svgContent}</div>
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

      <div className="input-group">
        <label>{t("poemGenre")}</label>
        <select
          className="input-field"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="五言绝句">五言绝句</option>
          <option value="七言绝句">七言绝句</option>
          <option value="五言律诗">五言律诗</option>
          <option value="七言律诗">七言律诗</option>
          <option value="词牌">词牌</option>
          <option value="散曲">散曲</option>
          <option value="现代诗">现代诗</option>
          <option value="其他">其他（可在下方填写）</option>
        </select>
      </div>
      <div className="input-group">
        <label>{t("specificName")}</label>
        <input
          className="input-field"
          type="text"
          value={specificName}
          onChange={(e) => setSpecificName(e.target.value)}
          placeholder={t("enterSpecificName")}
        />
      </div>
      <div className="input-group">
        <label>{t("poemStyle")}</label>
        <input
          className="input-field"
          type="text"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder={t("enterStyle")}
        />
      </div>
      <div className="input-group">
        <label>{t("userInput")}</label>
        <textarea
          className="input-field"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={t("enterUserInput")}
        />
      </div>
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
