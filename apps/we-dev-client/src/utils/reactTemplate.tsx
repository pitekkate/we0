import { uploadImage } from "@/api/chat";
import { createFileWithContent } from "@/components/WeIde/components/IDEContent/FileExplorer/utils/fileSystem";

type CodeType = "imgToCode" | "58ToCode";

interface CodeResult {
  code: {
    reactHtml: string;
    vueHtml: string;
    css: string;
    html: string;
    scss: string;
    appTsx: string;
    mainTsx: string;
    indexHtml: string;
    packageJson: string;
    tsconfigJson: string;
    tsconfigNodeJson: string;
    viteConfigTs: string;
  };
}
/**
 * 生成react项目模板
 * @param code
 * @param codeType
 * @returns
 */
export const reactTemplate = async (code: CodeResult, codeType: CodeType) => {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      console.log("code", code)
      // createFileWithContent('src/DtcComponent.tsx', await handleImgBase64Toloacl(code.code.reactHtml as string));
      if (codeType === "58ToCode") {
        createFileWithContent(
          "src/index.css",
          await handleCssBase64ToLocal( code.code.css)
        );
      } else if (codeType === "imgToCode") {
        createFileWithContent(
          "src/index.module.css",
          await handleCssBase64ToLocal(code.code.css)
        );
      }
      createFileWithContent(
        "src/App.tsx",
        await handleImgBase64Toloacl(code.code.reactHtml as string)
      );
      createFileWithContent("src/main.tsx", getMainTsx());
      createFileWithContent("index.html", getIndexHtml());
      createFileWithContent("package.json", getPackageJson());
      createFileWithContent("tsconfig.json", getTsconfigJson());
      createFileWithContent("tsconfig.node.json", getTsconfigNodeJson());
      createFileWithContent("vite.config.ts", getViteConfigTs());
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

const base64ToBlob = ({
  b64data = "",
  contentType = "",
  sliceSize = 512,
} = {}) => {
  return new Promise((resolve, reject) => {
    // 使用 atob() 方法将数据解码
    let byteCharacters = atob(b64data);
    let byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);
      let byteNumbers = [];
      for (let i = 0; i < slice.length; i++) {
        byteNumbers.push(slice.charCodeAt(i));
      }
      // 8 位无符号整数值的类型化数组。内容将初始化为 0。
      // 如果无法分配请求数目的字节，则将引发异常。
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    let result = new Blob(byteArrays, {
      type: contentType,
    });
    result = Object.assign(result, {
      // 这里一定要处理一下 URL.createObjectURL
      preview: URL.createObjectURL(result),
      name: `XXX.png`,
    });
    resolve(result);
  });
};

const handleImgBase64Toloacl = async (code: string) => {
  // 把字符串里面的img标签里面的src的内容的bse64变成blob再变成本地url
  // 检查是否包含base64格式的图片
  if (!code?.includes("data:image/png;base64,")) {
    console.log("不包含base64格式的图片");
    return code;
  }

  let newCode: string = code;
  // 查找所有的 base64 图片数据
  const base64Regex = /data:image\/[^;]+;base64,[^'"}\s]+/g;
  const matches = code.match(base64Regex);

  if (matches) {
    for (const match of matches) {
      // 去掉 "data:image/png;base64," 前缀
      let base64 = match.split(",")[1];
      const imgBlob = await base64ToBlob({
        b64data: base64,
        contentType: "image/png",
      });
      console.log("imgBlob", imgBlob);
      const file = new File([imgBlob as BlobPart], "sketch-image.png", {
        type: "image/png",
      });
      const imgUrl = URL.createObjectURL(imgBlob as Blob);
      // 替换所有匹配的 base64 数据
      newCode = newCode.replace(match, imgUrl);
    }
  }

  console.log("html替换前的代码：", code);
  console.log("html替换后的代码：", newCode);
  return newCode;
};

const handleCssBase64ToLocal = async (code: string) => {
  if (!code.includes("data:image/png;base64,")) {
    return code;
  }

  let newCode = code;
  const base64Regex =
    /url\(\s*['"]?(data:image\/[^;]+;base64,[^)]+?)['"]?\s*\)/g;
  const matches = code.match(base64Regex);

  if (matches) {
    // 使用 for...of 循环来正确处理异步操作
    for (const match of matches) {
      const base64Data = match.match(/data:image\/[^;]+;base64,[^)'"]+/)?.[0];
      if (!base64Data) continue;

      const base64 = base64Data.split(",")[1];
      const imgBlob = await base64ToBlob({
        b64data: base64,
        contentType: "image/png",
      });
      const file = new File([imgBlob as BlobPart], "sketch-image.png", {
        type: "image/png",
      });
      // const imgUrl = await uploadImage(file);
      // 本地url
      const imgUrl = URL.createObjectURL(imgBlob as Blob);
      // 替换整个url()部分
      newCode = newCode.replace(match, `url("${imgUrl}")`);
    }
  }

  console.log("css替换前的代码：", code);
  console.log("css替换后的代码：", newCode);
  return newCode;
};

const getAppTsx = () => {
  return `
import React from 'react'
import DtcComponent from './DtcComponent.tsx'
function App() {
return (
    <div>
        <DtcComponent />
    </div>
)
}

export default App
    `;
};

const getMainTsx = () => {
  return `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
    <App />
</React.StrictMode>
)
    `;
};

const getIndexHtml = () => {
  return `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Hello World</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
    `;
};

const getPackageJson = () => {
  return `
{
"name": "react-hello-world",
"private": true,
"version": "0.0.0",
"type": "module",
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
},
"dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
},
"devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
}
}
    `;
};

const getTsconfigJson = () => {
  return `
{
"compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
},
"include": ["src"],
"references": [{ "path": "./tsconfig.node.json" }]
}
    `;
};

const getTsconfigNodeJson = () => {
  return `
{
"compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
},
"include": ["vite.config.ts"]
}
    `;
};

const getViteConfigTs = () => {
  return `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ' /* 这里可以写全局样式或全局注释 */ '
      }
    }
  }
});
    `;
};
