document.addEventListener('DOMContentLoaded', () => {
  const notesGrid = document.getElementById('notesGrid');
  const searchInput = document.getElementById('searchInput');
  const filterCategories = document.getElementById('filterCategories');
  const githubLink = document.getElementById('githubLink');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  const ITEMS_PER_PAGE = 2; // 1ページあたりの初期表示件数 (動作確認のため2件に設定。記事が増えたら 12 などに増やしてください)
  let displayedCount = ITEMS_PER_PAGE;

  let allNotes = [];
  let activeCategory = 'all';
  let searchQuery = '';

  // GitHubリポジトリへのリンクを動的に設定 (GitHub Pages環境の場合)
  const setupGithubLink = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('github.io')) {
      const pathParts = window.location.pathname.split('/');
      const repoName = pathParts[1] || '';
      const username = hostname.split('.')[0];
      if (username && repoName) {
        githubLink.href = `https://github.com/${username}/${repoName}`;
      }
    }
  };

  // メタデータ (notes/index.json) の読み込み
  const fetchNotes = async () => {
    try {
      // キャッシュを回避するためにタイムスタンプをクエリとして付与
      const response = await fetch(`notes/index.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch index.json');
      }
      allNotes = await response.json();
      
      // 日付の降順にソート
      allNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

      renderCategories();
      renderNotes();
    } catch (error) {
      console.error('Error fetching notes:', error);
      notesGrid.innerHTML = `
        <div class="error" style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 3rem;">
          ノートの読み込みに失敗しました。index.jsonが正しく作成されているか確認してください。
        </div>
      `;
    }
  };

  // カテゴリ一覧の生成と描画
  const renderCategories = () => {
    // ユニークなカテゴリを抽出
    const categories = new Set(allNotes.map(note => note.category));
    
    // "すべて" ボタン以外の既存カテゴリボタンを削除
    const allBtn = filterCategories.querySelector('[data-category="all"]');
    filterCategories.innerHTML = '';
    filterCategories.appendChild(allBtn);

    categories.forEach(category => {
      if (!category) return;
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-category', category);
      btn.textContent = getCategoryLabel(category);
      filterCategories.appendChild(btn);
    });

    // イベントリスナーの再設定
    setupFilterListeners();
  };

  // カテゴリ表示用の日本語ラベルマッピング
  const getCategoryLabel = (category) => {
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
      'tool': 'Tools'
    };
    return mapping[category.toLowerCase()] || category;
  };

  // 記事カードのレンダリング
  const renderNotes = () => {
    notesGrid.style.opacity = '0';
    
    setTimeout(() => {
      notesGrid.innerHTML = '';

      const filteredNotes = allNotes.filter(note => {
        const matchesCategory = activeCategory === 'all' || note.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              note.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              note.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
          <div class="no-results" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
            該当するノートが見つかりませんでした。
          </div>
        `;
        loadMoreContainer.style.display = 'none';
      } else {
        // 表示件数分だけ切り取る
        const notesToDisplay = filteredNotes.slice(0, displayedCount);

        notesToDisplay.forEach(note => {
          const card = document.createElement('a');
          card.href = note.path;
          card.className = 'note-card';
          
          card.innerHTML = `
            <div>
              <div class="note-header">
                <span class="note-category">${getCategoryLabel(note.category)}</span>
                <span class="note-date">${formatDate(note.date)}</span>
              </div>
              <h2 class="note-title">${escapeHTML(note.title)}</h2>
              <p class="note-excerpt">${escapeHTML(note.excerpt)}</p>
            </div>
            <div class="note-footer">
              続きを読む
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          `;
          notesGrid.appendChild(card);
        });

        // 「もっと見る」ボタンの表示制御
        if (filteredNotes.length > displayedCount) {
          loadMoreContainer.style.display = 'flex';
        } else {
          loadMoreContainer.style.display = 'none';
        }
      }
      
      notesGrid.style.opacity = '1';
    }, 200);
  };

  // フィルターボタンのイベントリスナー設定
  const setupFilterListeners = () => {
    const buttons = filterCategories.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.getAttribute('data-category');
        displayedCount = ITEMS_PER_PAGE; // 表示件数をリセット
        renderNotes();
      });
    });
  };

  // 検索入力の監視 (デバウンス処理)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      displayedCount = ITEMS_PER_PAGE; // 表示件数をリセット
      renderNotes();
    }, 200);
  });

  // 日付のフォーマット (YYYY-MM-DD -> YYYY年MM月DD日)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
    } catch {
      return dateString;
    }
  };

  // エスケープ処理
  const escapeHTML = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 初期化処理
  setupGithubLink();
  
  // 「もっと見る」ボタンのイベントリスナー
  loadMoreBtn.addEventListener('click', () => {
    displayedCount += ITEMS_PER_PAGE;
    renderNotes();
  });

  fetchNotes();
});
