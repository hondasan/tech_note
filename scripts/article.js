document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  
  // URLパスから "notes/カテゴリ/スラッグ(.html)" の部分を抽出 (拡張子なしにも対応)
  const match = currentPath.match(/notes\/([^\/]+)\/([^\/\.]+)/);
  if (!match) return;
  const category = match[1];
  const slug = match[2];
  const normalizedPath = `notes/${category}/${slug}.html`;

  // キャッシュを回避するためにタイムスタンプをクエリパラメータとして付与して index.json を取得
  fetch(`../../notes/index.json?t=${Date.now()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch index.json');
      }
      return response.json();
    })
    .then(allNotes => {
      // main.js と同様のルールでソート (日付降順、同日付の場合はインデックス降順)
      const notesWithIndex = allNotes.map((note, index) => ({ ...note, index }));
      notesWithIndex.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.index - a.index;
      });

      // 現在表示している記事のインデックスを探す
      const currentIndex = notesWithIndex.findIndex(note => note.path === normalizedPath);
      if (currentIndex === -1) return;

      const currentNote = notesWithIndex[currentIndex];

      // 前後の記事を取得
      // notesWithIndex は新しい順に並んでいるため、
      // currentIndex - 1 が「次の（より新しい）記事」
      // currentIndex + 1 が「前の（より古い）記事」
      const nextNote = currentIndex > 0 ? notesWithIndex[currentIndex - 1] : null;
      const prevNote = currentIndex < notesWithIndex.length - 1 ? notesWithIndex[currentIndex + 1] : null;

      // 関連記事 (同じカテゴリの最新記事、自分を除く、最大3件)
      const relatedNotes = notesWithIndex
        .filter(note => note.category === currentNote.category && note.path !== normalizedPath)
        .slice(0, 3);

      renderNavigation(prevNote, nextNote, relatedNotes);
    })
    .catch(err => {
      console.error('Error loading article navigation:', err);
    });

  // ナビゲーションのレンダリング
  function renderNavigation(prevNote, nextNote, relatedNotes) {
    const articleContainer = document.querySelector('.article-container');
    if (!articleContainer) return;

    const navSection = document.createElement('div');
    navSection.className = 'article-nav-section';

    let html = '';

    // 1. 前後の記事カード
    if (prevNote || nextNote) {
      html += `<div class="article-prev-next">`;
      
      // 前の記事
      if (prevNote) {
        html += `
          <a href="../../${prevNote.path}" class="nav-card prev-card">
            <span class="nav-direction">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              前の記事
            </span>
            <span class="nav-title">${escapeHTML(prevNote.title)}</span>
          </a>
        `;
      } else {
        html += `<div class="nav-card-empty"></div>`;
      }

      // 次の記事
      if (nextNote) {
        html += `
          <a href="../../${nextNote.path}" class="nav-card next-card">
            <span class="nav-direction">
              次の記事
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.25rem;">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
            <span class="nav-title">${escapeHTML(nextNote.title)}</span>
          </a>
        `;
      } else {
        html += `<div class="nav-card-empty"></div>`;
      }

      html += `</div>`;
    }

    // 2. 関連記事
    if (relatedNotes.length > 0) {
      html += `
        <div class="article-related">
          <h3 class="related-title">同じカテゴリーの関連記事</h3>
          <div class="related-grid">
      `;

      relatedNotes.forEach(note => {
        html += `
          <a href="../../${note.path}" class="related-card">
            <div>
              <span class="related-category">${getCategoryLabel(note.category)}</span>
              <h4 class="related-card-title">${escapeHTML(note.title)}</h4>
            </div>
            <span class="related-date">${formatDate(note.date)}</span>
          </a>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    navSection.innerHTML = html;
    articleContainer.appendChild(navSection);
  }

  // カテゴリ表示用の日本語ラベルマッピング (main.js と同期)
  function getCategoryLabel(category) {
    const mapping = {
      'git': 'Git',
      'html': 'HTML / CSS',
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'ai': 'AI / LLM',
      'react': 'React',
      'nextjs': 'Next.js',
      'node': 'Node.js',
      'ops': 'DevOps / Infra',
      'security': 'Security',
      'tool': 'Tools',
      'news': 'News',
      'sports': 'Sports',
      'general': 'General',
      'science': 'Science',
      'culture': 'Culture'
    };
    
    const key = category.toLowerCase();
    if (mapping[key]) {
      return mapping[key];
    }
    
    return key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // 日付のフォーマット (YYYY-MM-DD -> YYYY年MM月DD日)
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
    } catch {
      return dateString;
    }
  }

  // HTMLエスケープ処理
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
