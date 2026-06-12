const fs = require('fs');
const path = require('path');

async function main() {
  const issueTitle = process.env.ISSUE_TITLE;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!issueTitle) {
    console.error('Error: ISSUE_TITLE environment variable is not set.');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  console.log(`Processing issue: "${issueTitle}"`);

  // Gemini APIへのプロンプト作成
  const systemPrompt = `
You are a professional writer, researcher, and explanation expert.
Analyze the given "Theme" and perform a deep dive research.
Create a highly informative, premium, and SEO-friendly article in Japanese.

You must respond with a raw JSON object matching the schema below.
DO NOT wrap the response in markdown blocks like \`\`\`json or add any extra text. Your output must be directly parseable by JSON.parse().

JSON Schema:
{
  "category": "Category ID in lowercase. Choose the most relevant one from [news, sports, general, science, culture, git, html, js, ts, ai, react, nextjs, node, ops, security, tool]. If none of these fit, create a new one using only lowercase letters (e.g., soccer, history).",
  "slug": "Article slug. Lowercase letters and hyphens only (e.g., worldcup-new-rules).",
  "title": "A compelling, search-optimized title in Japanese (around 30 characters).",
  "excerpt": "A short, engaging summary of the article in Japanese (120-160 characters).",
  "articleType": "Choose the most appropriate schema type from [TechArticle, NewsArticle, Article] based on the theme.",
  "htmlContent": "The main content of the article in semantic HTML. Do not include <h1>, <html>, <head>, or <body> tags. Use <h2> and <h3> for structuring headings. Balance the use of <p>, <ul>, <ol>, <table>, <blockquote>, and <strong> for readability. If using a <table>, ALWAYS add a 'data-label' attribute to each <td> matching its corresponding <th> header text (e.g., <td data-label=\\\"ヘッダー名\\\">値</td>) to make it mobile-friendly. For code blocks (if applicable), use <pre><code class=\\"language-xxx\\">...</code></pre> with appropriate syntax highlighting class. At the very end of the content, ALWAYS include a '参考URL' (Reference URLs) section with bulleted links pointing to official documentation or primary sources (using target=\\"_blank\\" rel=\\"noopener noreferrer\\")."
}

Theme: "${issueTitle}"
`;

  console.log('Sending request to Gemini API...');
  
  // REST APIの呼び出し (モデルは高性能かつ高速な gemini-3.5-flash を使用します)
  const model = 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    const articleData = JSON.parse(responseText.trim());
    console.log('Gemini API response parsed successfully.');
    console.log(`Title: ${articleData.title}`);
    console.log(`Category: ${articleData.category}`);
    console.log(`Slug: ${articleData.slug}`);

    // 各ファイルパスの設定
    const projectRoot = path.join(__dirname, '..');
    const categoryDir = path.join(projectRoot, 'notes', articleData.category);
    const articlePath = path.join(categoryDir, `${articleData.slug}.html`);
    const templatePath = path.join(projectRoot, 'notes', 'template.html');
    const indexPath = path.join(projectRoot, 'notes', 'index.json');
    const sitemapPath = path.join(projectRoot, 'sitemap.xml');

    // 1. ディレクトリの作成
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`Created new category directory: ${categoryDir}`);
    }

    // 今日の日付を取得 (YYYY-MM-DD / YYYY年MM月DD日)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateDisplayStr = `${yyyy}年${mm}月${dd}日`;

    // 2. テンプレートを読み込み、置換して記事を作成
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }

    let templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // テンプレートのプレースホルダ置換
    const articleType = articleData.articleType || 'Article';
    
    let articleHtml = templateContent
      .replace(/記事のタイトル/g, articleData.title)
      .replace(/記事の簡単な説明文。/g, articleData.excerpt)
      .replace(/カテゴリID/g, articleData.category)
      .replace(/YYYY年MM月DD日/g, dateDisplayStr)
      .replace(/YYYY-MM-DD/g, dateStr)
      .replace(/\[category\]/g, articleData.category)
      .replace(/\[slug\]/g, articleData.slug)
      .replace(/ARTICLE_TYPE/g, articleType)
      .replace(
        /<div class="article-content">[\s\S]*?<\/div>/,
        `<div class="article-content">\n        ${articleData.htmlContent}\n      </div>`
      );

    // 新規記事の書き出し
    fs.writeFileSync(articlePath, articleHtml, 'utf-8');
    console.log(`Created article: ${articlePath}`);

    // 3. index.json の更新
    let indexData = [];
    if (fs.existsSync(indexPath)) {
      indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }
    
    // 重複チェック
    const relativePath = `notes/${articleData.category}/${articleData.slug}.html`;
    const exists = indexData.some(item => item.path === relativePath);
    
    if (!exists) {
      indexData.push({
        title: articleData.title,
        excerpt: articleData.excerpt,
        category: articleData.category,
        date: dateStr,
        path: relativePath
      });
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
      console.log('Updated index.json successfully.');
    } else {
      console.log('Article already exists in index.json. Skipping metadata update.');
    }

    // 4. sitemap.xml の更新
    if (fs.existsSync(sitemapPath)) {
      let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      const locUrl = `https://tech-note.pages.dev/${relativePath}`;
      
      // すでに登録されているかチェック
      if (!sitemapContent.includes(locUrl)) {
        const urlBlock = `  <url>
    <loc>${locUrl}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n</urlset>`;
        
        sitemapContent = sitemapContent.replace('</urlset>', urlBlock);
        fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
        console.log('Updated sitemap.xml successfully.');
      } else {
        console.log('URL already exists in sitemap.xml. Skipping sitemap update.');
      }
    } else {
      console.warn('sitemap.xml not found. Skipping sitemap update.');
    }

    console.log('All tasks completed successfully.');

  } catch (error) {
    console.error('Execution failed:', error);
    process.exit(1);
  }
}

main();
