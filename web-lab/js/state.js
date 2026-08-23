/**
 * CanopyChat App State Manager
 * Persistent conversations, workspaces, personas, themes, and configuration.
 */

export const WORKSPACES = [
  { id: 'personal', name: 'Personal', icon: 'user', color: '#6B4423', bg: 'rgba(107, 68, 35, 0.15)' },
  { id: 'work', name: 'Work', icon: 'briefcase', color: '#4A7C4A', bg: 'rgba(74, 124, 74, 0.15)' },
  { id: 'creative', name: 'Creative', icon: 'palette', color: '#B87333', bg: 'rgba(184, 115, 51, 0.15)' },
  { id: 'research', name: 'Research', icon: 'book', color: '#4A7CB8', bg: 'rgba(74, 124, 184, 0.15)' }
];

export const PERSONAS = [
  { id: 'default', name: 'Canopy', desc: 'Balanced, thoughtful assistant' },
  { id: 'analytical', name: 'Sage', desc: 'Deep analytical reasoning' },
  { id: 'creative', name: 'Muse', desc: 'Creative and imaginative thinking' },
  { id: 'concise', name: 'Swift', desc: 'Direct and to the point' }
];

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8790';
const RETIRED_AUDIT_BACKEND_URLS = new Set([
  'http://192.168.12.128:8791'
]);

function normalizeBackendUrl(value) {
  const normalized = String(value || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');
  return RETIRED_AUDIT_BACKEND_URLS.has(normalized) ? DEFAULT_BACKEND_URL : normalized;
}

const SEED_CONVERSATIONS = [
  {
    id: 'seed-conv-1',
    title: 'Welcome to CanopyChat',
    workspaceId: 'personal',
    personaId: 'default',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello Canopy! What makes CanopyChat special?',
        createdAt: Date.now() - 3600000 * 3
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Welcome to **CanopyChat**!\n\nCanopyChat is built on the philosophy of **Rooted Intelligence** — thoughtful, private intelligence that runs locally on your Mac.\n\n### Why On-Device Matters\n- **True Privacy**: Your conversations and thoughts stay strictly on your device.\n- **Eco-Friendly Intelligence**: Runs locally on Apple Silicon without consuming remote data center energy.\n- **Workspaces**: Seamlessly organize your focus across Personal, Work, Creative, and Research.\n\nHow can I help you create, plan, or explore today?',
        createdAt: Date.now() - 3600000 * 3 + 1000
      }
    ]
  },
  {
    id: 'seed-conv-2',
    title: 'Mindful Weekly Focus Plan',
    workspaceId: 'work',
    personaId: 'default',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 8,
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Can you help me design a balanced Monday-to-Friday schedule that protects deep work?',
        createdAt: Date.now() - 3600000 * 8
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Here is a structured, restorative approach to your work week:\n\n### 🌿 The Rhythmic Work Week\n1. **Monday (Alignment & Clarity)**: Review core priorities, plan key deliverables, and handle administrative communications early.\n2. **Tuesday & Wednesday (Deep Focus Blocks)**: Protect 2-3 hour morning windows with zero meetings for high-leverage creative or analytical tasks.\n3. **Thursday (Collaboration & Reviews)**: Schedule feedback sessions, team check-ins, and iteration reviews.\n4. **Friday (Reflection & Wrap-Up)**: Tidy up open tasks, document learnings, and set a clean slate for the weekend.\n\n> *"Focus is not about doing more; it is about protecting what matters most."*\n\nWould you like to tailor this to a specific project or goal?',
        createdAt: Date.now() - 3600000 * 8 + 1200
      }
    ]
  },
  {
    id: 'seed-conv-3',
    title: 'Eco-Friendly Local Computing',
    workspaceId: 'research',
    personaId: 'analytical',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'How does running intelligence on-device help reduce environmental impact?',
        createdAt: Date.now() - 3600000 * 24
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'On-device intelligence offers significant environmental advantages over traditional cloud AI:\n\n1. **Zero Data Center Overhead**: Running models directly on your hardware eliminates the continuous cooling and server power demanded by massive data facilities.\n2. **Reduced Network Transmission**: Queries do not travel through energy-intensive remote server routing.\n3. **Hardware Efficiency**: Unified memory architecture on Apple Silicon executes inferences at a fraction of the wattage consumed by cloud server racks.\n\nThis makes private computing both fast and genuinely sustainable.',
        createdAt: Date.now() - 3600000 * 24 + 1200
      }
    ]
  }
];

export class AppState {
  constructor() {
    this.listeners = new Map();
    this.conversations = [];
    this.activeConversationId = null;
    this.deletedBackup = null;

    this.theme = 'light';
    this.backendUrl = DEFAULT_BACKEND_URL;
    this.mockMode = false;
    this.fontScale = 1.0;
    this.webSearchEnabled = false;
    this.modelPreference = 'auto';
    this.browserLocalMode = false;

    this.isSending = false;
    this.currentStreamingText = '';
    this.generationStatusMessage = null;

    this.loadFromStorage();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in listener for ${event}:`, e); }
      });
    }
  }

  loadFromStorage() {
    try {
      const savedTheme = localStorage.getItem('canopy_theme');
      if (savedTheme) {
        this.theme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.theme = 'dark';
      }

      const savedBackendUrl = localStorage.getItem('canopy_backend_url');
      if (savedBackendUrl) {
        this.backendUrl = normalizeBackendUrl(savedBackendUrl);
        if (this.backendUrl !== savedBackendUrl.replace(/\/+$/, '')) {
          localStorage.setItem('canopy_backend_url', this.backendUrl);
        }
      }

      const savedMockMode = localStorage.getItem('canopy_mock_mode');
      if (savedMockMode !== null) this.mockMode = savedMockMode === 'true';

      const savedModelPreference = localStorage.getItem('canopy_model_preference');
      if (['auto', 'canopy-lore-v1', 'canopy-lite'].includes(savedModelPreference)) {
        this.modelPreference = savedModelPreference;
      }

      const savedBrowserLocalMode = localStorage.getItem('canopy_browser_local_mode');
      if (savedBrowserLocalMode !== null) this.browserLocalMode = savedBrowserLocalMode === 'true';

      const savedFontScale = localStorage.getItem('canopy_font_scale');
      if (savedFontScale) this.fontScale = parseFloat(savedFontScale);

      const savedConvs = localStorage.getItem('canopy_conversations');
      if (savedConvs) {
        // Conversation data is user state. Never reset it based on a title or
        // other test marker; web-lab experiments must not erase responses.
        this.conversations = JSON.parse(savedConvs);
      } else {
        this.conversations = JSON.parse(JSON.stringify(SEED_CONVERSATIONS));
        this.saveConversations();
      }
    } catch (err) {
      console.warn('Failed to load state from localStorage:', err);
      this.conversations = JSON.parse(JSON.stringify(SEED_CONVERSATIONS));
    }
  }

  saveConversations() {
    try {
      localStorage.setItem('canopy_conversations', JSON.stringify(this.conversations));
    } catch (e) {
      console.warn('Failed to persist conversations:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('canopy_theme', this.theme);
      localStorage.setItem('canopy_backend_url', this.backendUrl);
      localStorage.setItem('canopy_mock_mode', String(this.mockMode));
      localStorage.setItem('canopy_font_scale', String(this.fontScale));
      localStorage.setItem('canopy_model_preference', this.modelPreference);
      localStorage.setItem('canopy_browser_local_mode', String(this.browserLocalMode));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }
  }

  setTheme(theme) {
    this.theme = theme === 'dark' ? 'dark' : 'light';
    this.saveSettings();
    this.emit('themeChange', this.theme);
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setBackendUrl(url) {
    this.backendUrl = normalizeBackendUrl(url);
    this.saveSettings();
    this.emit('configChange', { backendUrl: this.backendUrl });
  }

  setMockMode(enabled) {
    this.mockMode = Boolean(enabled);
    this.saveSettings();
    this.emit('configChange', { mockMode: this.mockMode });
  }

  setModelPreference(modelId) {
    this.modelPreference = ['auto', 'canopy-lore-v1', 'canopy-lite'].includes(modelId) ? modelId : 'auto';
    this.saveSettings();
    this.emit('configChange', { modelPreference: this.modelPreference });
  }

  setBrowserLocalMode(enabled) {
    this.browserLocalMode = Boolean(enabled);
    this.saveSettings();
    this.emit('configChange', { browserLocalMode: this.browserLocalMode });
  }

  setFontScale(scale) {
    this.fontScale = Math.max(0.85, Math.min(1.3, Number(scale) || 1.0));
    this.saveSettings();
    this.emit('configChange', { fontScale: this.fontScale });
  }

  getWorkspace(id) {
    return WORKSPACES.find(w => w.id === id) || WORKSPACES[0];
  }

  getPersona(id) {
    return PERSONAS.find(p => p.id === id) || PERSONAS[0];
  }

  getActiveConversation() {
    if (!this.activeConversationId) return null;
    const targetId = typeof this.activeConversationId === 'object' && this.activeConversationId !== null ? this.activeConversationId.id : this.activeConversationId;
    return this.conversations.find(c => c.id === targetId) || null;
  }

  createConversation(title = '', workspaceId = 'personal', personaId = 'default') {
    const defaultTitle = title.trim() || 'New Conversation';
    const newConv = {
      id: 'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: defaultTitle,
      workspaceId: workspaceId,
      personaId: personaId,
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    this.conversations.unshift(newConv);
    this.saveConversations();
    this.activeConversationId = newConv.id;
    this.emit('conversationsUpdated');
    this.emit('activeConversationChanged', newConv.id);
    return newConv;
  }

  selectConversation(id) {
    const convId = typeof id === 'object' && id !== null ? id.id : id;
    this.activeConversationId = convId;
    this.saveConversations();
    this.emit('activeConversationChanged', convId);
  }

  renameConversation(id, newTitle) {
    const convId = typeof id === 'object' && id !== null ? id.id : id;
    const conv = this.conversations.find(c => c.id === convId);
    if (conv) {
      conv.title = (newTitle || 'Untitled').trim();
      conv.updatedAt = Date.now();
      this.saveConversations();
      this.emit('conversationsUpdated');
      if (this.activeConversationId === convId) {
        this.emit('activeConversationChanged', convId);
      }
    }
  }

  togglePin(id) {
    const conv = this.conversations.find(c => c.id === id);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      this.saveConversations();
      this.emit('conversationsUpdated');
    }
  }

  deleteConversation(id) {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index !== -1) {
      const [deleted] = this.conversations.splice(index, 1);
      this.deletedBackup = { conv: deleted, index };
      this.saveConversations();

      if (this.activeConversationId === id) {
        this.activeConversationId = null;
        this.emit('activeConversationChanged', null);
      }

      this.emit('conversationsUpdated');
      this.emit('conversationSoftDeleted', deleted);
    }
  }

  undoDelete() {
    if (this.deletedBackup) {
      const { conv, index } = this.deletedBackup;
      const insertAt = Math.min(index, this.conversations.length);
      this.conversations.splice(insertAt, 0, conv);
      this.deletedBackup = null;
      this.saveConversations();
      this.emit('conversationsUpdated');
      this.emit('undoDeleteComplete');
    }
  }

  addMessage(conversationId, role, content) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) return null;

    const msg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: role,
      content: content,
      createdAt: Date.now()
    };

    conv.messages.push(msg);
    conv.updatedAt = Date.now();

    // Auto-generate title from first user message if Untitled
    if (role === 'user' && (conv.title === 'New Conversation' || conv.title === 'Untitled')) {
      const snippet = content.trim().split('\n')[0].slice(0, 36);
      if (snippet) {
        conv.title = snippet.length === 36 ? snippet + '…' : snippet;
      }
    }

    this.saveConversations();
    this.emit('conversationsUpdated');
    this.emit('messagesUpdated', conv);
    return msg;
  }

  updateLastMessage(conversationId, content) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv || conv.messages.length === 0) return;

    const lastMsg = conv.messages[conv.messages.length - 1];
    lastMsg.content = content;
    conv.updatedAt = Date.now();

    this.saveConversations();
    this.emit('messagesUpdated', conv);
  }

  resetToSeed() {
    this.conversations = JSON.parse(JSON.stringify(SEED_CONVERSATIONS));
    this.activeConversationId = null;
    this.saveConversations();
    this.emit('conversationsUpdated');
    this.emit('activeConversationChanged', null);
  }
}
