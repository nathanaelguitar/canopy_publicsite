/**
 * CanopyChat UI Controller
 * Manages fitted Your Grove homepage, responsive sidebar, conversation stream, smart scroll anchoring, modals, and hotkeys.
 */

import { WORKSPACES, PERSONAS } from './state.js?v=20260823f';
import { PUBLIC_CANOPY_LITE_MODEL } from './browserLocal.js?v=20260823f';
import { cleanAssistantText, escapeHtml, renderMarkdown } from './markdown.js?v=20260823f';

// SVG Icon Library
export const ICONS = {
  tree: `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M 47.8,0.1 L 53.2,0.2 L 59.3,2.1 L 65.0,6.0 L 70.1,12.3 L 76.8,13.8 L 81.7,16.5 L 86.4,21.8 L 89.1,29.2 L 96.0,34.4 L 99.3,40.2 L 99.9,45.8 L 98.8,50.7 L 96.1,55.1 L 91.9,58.5 L 85.6,60.3 L 77.6,59.2 L 71.8,62.2 L 67.2,63.3 L 62.6,63.1 L 58.4,62.0 L 57.5,62.7 L 57.5,76.3 L 58.9,81.9 L 61.7,86.0 L 65.6,89.6 L 77.7,96.0 L 78.1,98.4 L 76.0,99.8 L 62.7,97.8 L 50.9,97.2 L 38.6,97.7 L 24.5,99.8 L 22.8,99.4 L 21.7,97.7 L 22.4,95.9 L 34.2,89.7 L 38.2,86.1 L 40.9,82.3 L 42.5,76.5 L 42.5,62.6 L 41.5,62.0 L 37.3,63.1 L 32.9,63.3 L 28.1,62.1 L 22.6,59.2 L 15.4,60.4 L 10.8,59.7 L 7.3,58.1 L 4.2,55.5 L 2.0,52.3 L 0.5,48.8 L 0.1,43.0 L 1.8,37.4 L 5.2,33.1 L 10.8,29.3 L 13.1,22.8 L 16.4,18.2 L 22.2,14.2 L 30.0,12.2 L 34.3,6.7 L 39.1,2.9 L 43.2,1.1 L 47.7,0.1 Z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  sidebarIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  stop: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`,
  exclamation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-2l-2-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6l-2 3v2z"></path></svg>`,
  pinFill: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17v5M5 17h14v-2l-2-3V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6l-2 3v2z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
};

const COMPOSING_PHRASES = [
  'Please keep this page open while the response loads.',
  'Canopy is composing…',
  'Gathering thoughts…',
  'Choosing the right words…',
  'Polishing the reply…',
  'Still composing, thanks for waiting…'
];

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'now';
  const diff = (Date.now() - timestamp) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function plainTextForEmail(text) {
  return String(text ?? '')
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)]\([^\)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .trim();
}

export function buildFeedbackMailto({
  conversationTitle = 'Unknown',
  prompt = '',
  response = '',
  messageId = 'Unknown',
  timestamp = new Date().toISOString(),
  userAgent = 'Unknown'
} = {}) {
  const body = `CanopyChat Model Feedback

Thanks for taking a moment to report this. Your feedback helps us improve CanopyChat and make it more useful.

WHAT WENT WRONG?
Please tell us what was incorrect, confusing, incomplete, or unexpected.


WHAT WERE YOU EXPECTING?
If you can, describe the answer or behavior you wanted instead.


USER PROMPT
${plainTextForEmail(prompt) || '(Prompt text unavailable.)'}


MODEL RESPONSE
${plainTextForEmail(response)}

Thank you for helping us make CanopyChat better.

TECHNICAL DETAILS FOR SUPPORT
Conversation: ${conversationTitle}
Model: Canopy Lore V1
Message ID: ${messageId}
Timestamp: ${timestamp}
Browser: ${userAgent}`;

  const query = new URLSearchParams({
    subject: 'CanopyChat feedback — help improve the model',
    body
  });
  return `mailto:support@canopychat.app?${query.toString()}`;
}

export class CanopyUI {
  constructor(state, api, browserLocal = null) {
    this.state = state;
    this.api = api;
    this.browserLocal = browserLocal;
    this.currentView = 'grove'; // 'grove' | 'chat'
    this.selectedWorkspaceFilter = null;
    this.typingInterval = null;
    this.typingStartTime = null;
    this.undoTimeout = null;
    this.healthCheckSequence = 0;

    this.cacheDom();
    this.bindEvents();
    this.applyTheme(this.state.theme);
    this.applyFontScale(this.state.fontScale);

    // Initial view rendering
    this.showGrove();
    this.renderSidebar();
    this.initializeModelPreference();
    setInterval(() => this.checkBackendHealth(), 12000);
  }

  async initializeModelPreference() {
    try {
      await this.api.selectModel(this.state.modelPreference);
    } catch (error) {
      console.warn('Could not restore model preference:', error);
    }
    this.checkBackendHealth();
  }

  cacheDom() {
    this.app = document.getElementById('app');

    // Views
    this.viewGrove = document.getElementById('view-grove');
    this.viewChat = document.getElementById('view-chat');

    // Sidebar
    this.sidebar = document.getElementById('sidebar');
    this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this.btnSidebarBrand = document.getElementById('btn-sidebar-brand');
    this.btnSidebarCollapse = document.getElementById('btn-sidebar-collapse');
    this.btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
    this.btnNavGrove = document.getElementById('btn-nav-grove');
    this.btnSidebarNewChat = document.getElementById('btn-sidebar-new-chat');
    this.sidebarWorkspaces = document.getElementById('sidebar-workspaces');
    this.pinnedSection = document.getElementById('pinned-section');
    this.recentSection = document.getElementById('recent-section');
    this.pinnedList = document.getElementById('pinned-list');
    this.recentList = document.getElementById('recent-list');
    this.sidebarEmptyState = document.getElementById('sidebar-empty-state');

    // Grove View Elements
    this.btnGroveSidebarToggle = document.getElementById('btn-grove-sidebar-toggle');
    this.groveWorkspaceTray = document.getElementById('grove-workspace-tray');
    this.grovePinnedSection = document.getElementById('grove-pinned-section');
    this.grovePinnedGrid = document.getElementById('grove-pinned-grid');
    this.groveRecentSection = document.getElementById('grove-recent-section');
    this.groveRecentGrid = document.getElementById('grove-recent-grid');
    this.groveEmptyState = document.getElementById('grove-empty-state');
    this.btnGroveEmptyNew = document.getElementById('btn-grove-empty-new');

    // Main Chat Canvas
    this.chatTitleBtn = document.getElementById('chat-title-btn');
    this.chatTitleText = document.getElementById('chat-title-text');
    this.chatSubtitleText = document.getElementById('chat-subtitle-text');
    this.chatShareBtn = document.getElementById('chat-share-btn');
    this.messagesArea = document.getElementById('messages-area');
    this.messagesInnerColumn = document.getElementById('messages-inner-column');
    this.messagesList = document.getElementById('messages-list');
    this.chatEmptyState = document.getElementById('chat-empty-state');
    this.chatEmptyPersona = document.getElementById('chat-empty-persona');
    this.chatSuggestionsGrid = document.getElementById('chat-suggestions-grid');

    // Composer
    this.composerBar = document.getElementById('composer-bar');
    this.composerPlusBtn = document.getElementById('composer-plus-btn');
    this.composerTextarea = document.getElementById('composer-textarea');
    this.composerSendBtn = document.getElementById('composer-send-btn');
    this.attachPopover = document.getElementById('attach-popover');

    // Header buttons
    this.themeToggleBtns = document.querySelectorAll('.btn-theme-toggle');
    this.settingsBtns = document.querySelectorAll('.btn-settings');
    this.statusPills = document.querySelectorAll('.status-pill');

    // Modals
    this.modalNewChat = document.getElementById('modal-new-chat');
    this.modalRename = document.getElementById('modal-rename');
    this.modalShare = document.getElementById('modal-share');
    this.modalSettings = document.getElementById('modal-settings');
    this.undoToast = document.getElementById('undo-toast');
    this.undoToastText = document.getElementById('undo-toast-text');
    this.btnUndo = document.getElementById('btn-undo');
  }

  bindEvents() {
    // State Listeners
    this.state.on('themeChange', theme => this.applyTheme(theme));
    this.state.on('configChange', ({ fontScale }) => {
      if (fontScale) this.applyFontScale(fontScale);
    });
    this.browserLocal?.setStatusListener?.(status => {
      this.browserLocalStatus = status;
      if (this.currentView === 'chat' && !this.state.isSending) this.renderCurrentChat();
      const statusText = status.ready ? 'Canopy Lite in browser' : status.loading ? 'Preparing Canopy Lite…' : null;
      if (statusText) document.querySelectorAll('.status-text').forEach(el => { el.textContent = statusText; });
    });
    this.state.on('conversationsUpdated', () => {
      this.renderSidebar();
      if (this.currentView === 'grove') {
        this.renderGroveView();
      }
    });
    this.state.on('activeConversationChanged', id => {
      if (id) {
        this.showChat(id);
      }
      this.renderSidebar();
    });
    this.state.on('messagesUpdated', conv => {
      if (this.currentView === 'chat' && this.state.activeConversationId === conv.id) {
        this.renderMessages(conv);
      }
    });
    this.state.on('conversationSoftDeleted', conv => {
      this.showUndoToast(conv);
    });
    this.state.on('undoDeleteComplete', () => {
      this.hideUndoToast();
    });

    // Navigation Events
    if (this.btnNavGrove) this.btnNavGrove.addEventListener('click', () => this.showGrove());
    if (this.btnSidebarBrand) this.btnSidebarBrand.addEventListener('click', () => this.showGrove());
    if (this.btnGroveEmptyNew) this.btnGroveEmptyNew.addEventListener('click', () => this.openNewChatModal());

    // Sidebar Toggle Events
    if (this.btnSidebarCollapse) this.btnSidebarCollapse.addEventListener('click', () => this.toggleSidebar(false));
    if (this.btnSidebarToggle) this.btnSidebarToggle.addEventListener('click', () => this.toggleSidebar(true));
    if (this.btnGroveSidebarToggle) this.btnGroveSidebarToggle.addEventListener('click', () => this.toggleSidebar(true));
    if (this.sidebarBackdrop) this.sidebarBackdrop.addEventListener('click', () => this.toggleSidebar(false));

    // New Chat Action
    if (this.btnSidebarNewChat) this.btnSidebarNewChat.addEventListener('click', () => this.openNewChatModal());

    // Theme toggles
    this.themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.state.toggleTheme());
    });

    // Settings buttons
    this.settingsBtns.forEach(btn => {
      btn.addEventListener('click', () => this.openSettingsModal());
    });

    // Status Pill click
    this.statusPills.forEach(pill => {
      pill.addEventListener('click', () => this.openSettingsModal());
    });

    // Chat Header Rename
    if (this.chatTitleBtn) {
      this.chatTitleBtn.addEventListener('click', () => {
        const conv = this.state.getActiveConversation();
        if (conv) this.openRenameModal(conv);
      });
    }

    // Chat Share Action
    if (this.chatShareBtn) {
      this.chatShareBtn.addEventListener('click', () => {
        const conv = this.state.getActiveConversation();
        if (conv) this.openShareModal(conv);
      });
    }

    // Composer Input & Auto-resize
    if (this.composerTextarea) {
      this.composerTextarea.addEventListener('input', () => {
        this.autoResizeTextarea();
        this.updateSendButtonState();
      });

      this.composerTextarea.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        } else if (e.key === 'Escape') {
          if (this.state.isSending) {
            this.handleStop();
          } else {
            this.composerTextarea.blur();
          }
        }
      });
    }

    if (this.composerSendBtn) {
      this.composerSendBtn.addEventListener('click', () => {
        if (this.state.isSending) {
          this.handleStop();
        } else {
          this.handleSend();
        }
      });
    }

    // Attach menu toggle
    if (this.composerPlusBtn) {
      this.composerPlusBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.toggleAttachPopover();
      });
    }

    document.addEventListener('click', e => {
      if (this.attachPopover && this.attachPopover.classList.contains('open') && !this.attachPopover.contains(e.target) && e.target !== this.composerPlusBtn) {
        this.attachPopover.classList.remove('open');
      }
    });

    // Quick Suggestions click
    if (this.chatSuggestionsGrid) {
      this.chatSuggestionsGrid.addEventListener('click', e => {
        const card = e.target.closest('.suggestion-card');
        if (card && card.dataset.prompt) {
          this.composerTextarea.value = card.dataset.prompt;
          this.autoResizeTextarea();
          this.updateSendButtonState();
          this.handleSend();
        }
      });
    }

    // Undo delete action
    if (this.btnUndo) {
      this.btnUndo.addEventListener('click', () => this.state.undoDelete());
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openNewChatModal();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          const isOpen = this.sidebar.classList.contains('mobile-open');
          this.toggleSidebar(!isOpen);
        } else {
          const isCollapsed = this.sidebar.classList.contains('collapsed');
          this.toggleSidebar(isCollapsed);
        }
      }
    });

    // Global Code Copy Delegator
    document.addEventListener('click', e => {
      const copyBtn = e.target.closest('.code-block-copy-btn');
      if (copyBtn) {
        const codeId = copyBtn.dataset.codeId;
        const codeElem = document.getElementById(codeId);
        if (codeElem) {
          navigator.clipboard.writeText(codeElem.textContent).then(() => {
            const span = copyBtn.querySelector('span');
            if (span) span.textContent = 'Copied!';
            setTimeout(() => { if (span) span.textContent = 'Copy'; }, 1500);
          });
        }
      }
    });

    // Global Message Action Delegators
    if (this.messagesArea) {
      this.messagesArea.addEventListener('click', e => {
        const btn = e.target.closest('.btn-msg-action');
        if (!btn) return;
        const action = btn.dataset.action;
        const msgId = btn.dataset.msgId;
        const conv = this.state.getActiveConversation();
        if (!conv) return;
        const msg = conv.messages.find(m => m.id === msgId);
        if (!msg) return;

        if (action === 'copy') {
          navigator.clipboard.writeText(msg.content).then(() => {
            btn.innerHTML = ICONS.check;
            setTimeout(() => { btn.innerHTML = ICONS.copy; }, 1400);
          });
        } else if (action === 'report') {
          this.openFeedbackEmail(msg);
        } else if (action === 'resend') {
          this.handleResend(msg.content);
        } else if (action === 'edit') {
          this.composerTextarea.value = msg.content;
          this.autoResizeTextarea();
          this.updateSendButtonState();
          this.composerTextarea.focus();
        }
      });
    }
  }

  showGrove() {
    this.currentView = 'grove';
    if (this.app) {
      this.app.classList.remove('in-chat-mode');
      this.app.classList.add('in-grove-mode');
    }
    this.viewGrove.style.display = 'flex';
    this.viewChat.style.display = 'none';
    this.renderGroveView();
  }

  showChat(convOrId) {
    const convId = typeof convOrId === 'object' && convOrId !== null ? convOrId.id : convOrId;
    this.currentView = 'chat';
    if (this.app) {
      this.app.classList.remove('in-grove-mode');
      this.app.classList.add('in-chat-mode');
    }
    this.viewGrove.style.display = 'none';
    this.viewChat.style.display = 'flex';
    if (convId && this.state.activeConversationId !== convId) {
      this.state.selectConversation(convId);
    } else {
      this.renderCurrentChat();
    }
    this.renderSidebar();
  }

  toggleSidebar(openOrExpand) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const isCurrentlyOpen = this.sidebar.classList.contains('mobile-open');
      const shouldOpen = openOrExpand !== undefined ? openOrExpand : !isCurrentlyOpen;
      if (shouldOpen) {
        this.sidebar.classList.add('mobile-open');
        this.sidebarBackdrop.classList.add('active');
        if (this.app) this.app.classList.remove('sidebar-collapsed');
      } else {
        this.sidebar.classList.remove('mobile-open');
        this.sidebarBackdrop.classList.remove('active');
        if (this.app) this.app.classList.add('sidebar-collapsed');
      }
    } else {
      const isCurrentlyCollapsed = this.sidebar.classList.contains('collapsed');
      const shouldExpand = openOrExpand !== undefined ? openOrExpand : isCurrentlyCollapsed;
      if (shouldExpand) {
        this.sidebar.classList.remove('collapsed');
        if (this.app) this.app.classList.remove('sidebar-collapsed');
      } else {
        this.sidebar.classList.add('collapsed');
        if (this.app) this.app.classList.add('sidebar-collapsed');
      }
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.themeToggleBtns.forEach(btn => {
      btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    });
  }

  applyFontScale(scale) {
    document.documentElement.style.setProperty('--font-scale', scale);
  }

  async checkBackendHealth() {
    const sequence = ++this.healthCheckSequence;
    const health = await this.api.checkHealth();
    if (sequence !== this.healthCheckSequence) return;
    if (health.recoveredFrom && health.baseUrl) {
      this.state.setBackendUrl(health.baseUrl);
      this.api.setBaseUrl(health.baseUrl);
    }
    const dots = document.querySelectorAll('.status-dot');
    const texts = document.querySelectorAll('.status-text');

    if (!health.ok) {
      // A long local generation can temporarily delay a control-plane request.
      // Do not turn a known-good model into "Backend Offline" while the user
      // is waiting for the current response.
      if (this.state.isSending && this.modelStatus?.ready) return;
      this.modelStatus = { status: 'offline', ready: false };
      dots.forEach(dot => { dot.className = 'status-dot offline'; });
      texts.forEach(t => { t.textContent = 'Backend Offline'; });
      if (this.currentView === 'chat' && !this.state.isSending) this.renderCurrentChat();
      return;
    }

    const modelStatus = await this.api.getModelStatus();
    if (sequence !== this.healthCheckSequence) return;
    if (modelStatus.status === 'offline' && this.state.isSending && this.modelStatus?.ready) return;
    this.modelStatus = modelStatus;

    dots.forEach(dot => {
      dot.className = 'status-dot ' + (modelStatus.ready ? 'online' : 'checking');
    });

    texts.forEach(t => {
      if (this.state.mockMode) {
        t.textContent = 'Local simulation';
      } else if (modelStatus.status === 'downloading' || modelStatus.status === 'loading') {
        t.textContent = 'Preparing…';
      } else if (modelStatus.ready) {
        t.textContent = 'Canopy Lore V1';
      } else if (modelStatus.status === 'error' || modelStatus.status === 'unavailable') {
        t.textContent = 'Setup Error';
      } else {
        t.textContent = 'Setup Needed';
      }
    });

    if (modelStatus.status === 'downloading' || modelStatus.status === 'loading') {
      this.pollModelSetup();
    }

    // The first health check is asynchronous. Refresh the empty chat after
    // it resolves so a fresh `not_loaded` backend shows the setup card instead
    // of leaving the composer in an ambiguous disabled state.
    if (this.currentView === 'chat' && !this.state.isSending) this.renderCurrentChat();
  }

  async handleModelDownload() {
    this.isSettingUpModel = true;
    this.modelSetupError = null;
    this.renderCurrentChat();
    try {
      await this.api.downloadModel(this.modelStatus?.selectedModel || this.api.selectedModelId);
      this.pollModelSetup();
    } catch (err) {
      this.modelSetupError = err.message;
      this.isSettingUpModel = false;
      this.renderCurrentChat();
    }
  }

  async pollModelSetup() {
    if (this.setupPollInterval) return;
    this.setupPollInterval = setInterval(async () => {
      const status = await this.api.getModelStatus();
      this.modelStatus = status;
      if (status.ready) {
        clearInterval(this.setupPollInterval);
        this.setupPollInterval = null;
        this.isSettingUpModel = false;
        this.checkBackendHealth();
        this.renderCurrentChat();
      } else if (status.status === 'error') {
        clearInterval(this.setupPollInterval);
        this.setupPollInterval = null;
        this.isSettingUpModel = false;
        this.modelSetupError = status.error || 'Setup failed';
        this.renderCurrentChat();
      } else {
        this.renderCurrentChat();
      }
    }, 2000);
  }

  renderGroveView() {
    // 1. Workspace chips in Grove
    let trayHtml = `
      <button class="grove-ws-chip ${!this.selectedWorkspaceFilter ? 'active' : ''}" data-ws="all">
        All
      </button>
    `;

    WORKSPACES.forEach(ws => {
      const activeClass = this.selectedWorkspaceFilter === ws.id ? 'active' : '';
      trayHtml += `
        <button class="grove-ws-chip ${activeClass}" data-ws="${ws.id}" style="--chip-color: ${ws.color}; --chip-pale-bg: ${ws.bg};">
          ${ICONS[ws.icon] || ICONS.tree}
          <span>${ws.name}</span>
        </button>
      `;
    });

    this.groveWorkspaceTray.innerHTML = trayHtml;

    // Attach click listeners to workspace chips
    this.groveWorkspaceTray.querySelectorAll('.grove-ws-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wsId = chip.dataset.ws;
        this.selectedWorkspaceFilter = wsId === 'all' ? null : wsId;
        this.renderGroveView();
        this.renderSidebar();
      });
    });

    // 2. Filter conversations
    let filtered = this.state.conversations;
    if (this.selectedWorkspaceFilter) {
      filtered = filtered.filter(c => c.workspaceId === this.selectedWorkspaceFilter);
    }

    const pinned = filtered.filter(c => c.isPinned);
    const recent = filtered.filter(c => !c.isPinned);

    // 3. Render Pinned Cards Section
    if (pinned.length > 0) {
      this.grovePinnedSection.style.display = 'block';
      this.grovePinnedGrid.innerHTML = pinned.map(c => this.renderGroveCard(c)).join('');
    } else {
      this.grovePinnedSection.style.display = 'none';
      this.grovePinnedGrid.innerHTML = '';
    }

    // 4. Render Recent Cards Section (always includes the "+ Start New Conversation" hero card)
    const newChatCardHtml = `
      <div class="grove-card grove-card-new" id="btn-grove-new-chat" role="button" tabindex="0">
        <div class="grove-card-new-icon">
          ${ICONS.plus}
        </div>
        <span class="grove-card-new-title">Start New Conversation</span>
      </div>
    `;

    this.groveRecentSection.style.display = 'block';
    this.groveRecentGrid.innerHTML = newChatCardHtml + recent.map(c => this.renderGroveCard(c)).join('');

    // Bind card click & action events
    this.bindGroveCardEvents();
  }

  renderSidebar() {
    // 1. Workspace chips in Sidebar
    let trayHtml = `
      <button class="sidebar-ws-chip ${!this.selectedWorkspaceFilter ? 'active' : ''}" data-ws="all">
        All
      </button>
    `;

    WORKSPACES.forEach(ws => {
      const activeClass = this.selectedWorkspaceFilter === ws.id ? 'active' : '';
      trayHtml += `
        <button class="sidebar-ws-chip ${activeClass}" data-ws="${ws.id}" style="--chip-color: ${ws.color}; --chip-pale: ${ws.bg};">
          ${ws.name}
        </button>
      `;
    });

    this.sidebarWorkspaces.innerHTML = trayHtml;

    // Attach click listeners to workspace chips
    this.sidebarWorkspaces.querySelectorAll('.sidebar-ws-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wsId = chip.dataset.ws;
        this.selectedWorkspaceFilter = wsId === 'all' ? null : wsId;
        this.renderSidebar();
        if (this.currentView === 'grove') {
          this.renderGroveView();
        }
      });
    });

    // 2. Filter conversations
    let filtered = this.state.conversations;
    if (this.selectedWorkspaceFilter) {
      filtered = filtered.filter(c => c.workspaceId === this.selectedWorkspaceFilter);
    }

    const pinned = filtered.filter(c => c.isPinned);
    const recent = filtered.filter(c => !c.isPinned);

    if (filtered.length === 0) {
      this.pinnedSection.style.display = 'none';
      this.recentSection.style.display = 'none';
      this.sidebarEmptyState.style.display = 'block';
      return;
    }

    this.sidebarEmptyState.style.display = 'none';

    // 3. Render Pinned List
    if (pinned.length > 0) {
      this.pinnedSection.style.display = 'block';
      this.pinnedList.innerHTML = pinned.map(c => this.renderSidebarItem(c)).join('');
    } else {
      this.pinnedSection.style.display = 'none';
    }

    // 4. Render Recent List
    if (recent.length > 0) {
      this.recentSection.style.display = 'block';
      this.recentList.innerHTML = recent.map(c => this.renderSidebarItem(c)).join('');
    } else {
      this.recentSection.style.display = 'none';
    }

    // Bind item click & action events
    this.bindSidebarItemEvents();
  }

  renderGroveCard(conv) {
    const ws = this.state.getWorkspace(conv.workspaceId);
    const persona = this.state.getPersona(conv.personaId);
    const lastMsg = conv.messages[conv.messages.length - 1];
    const cleanPreview = lastMsg
      ? cleanAssistantText(lastMsg.content)
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_~`#]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      : '';
    const previewText = cleanPreview
      ? (cleanPreview.length > 110 ? `${cleanPreview.slice(0, 110).trimEnd()}…` : cleanPreview)
      : 'No messages yet…';

    return `
      <div class="grove-card" data-id="${conv.id}">
        <div class="grove-card-top">
          <div class="grove-card-badge-group">
            <span class="grove-card-ws-pill" style="--ws-bg: ${ws.bg}; --ws-color: ${ws.color};">
              ${ICONS[ws.icon]}
              <span>${ws.name}</span>
            </span>
            <span class="grove-card-persona-pill">${persona.name}</span>
          </div>
          <span class="grove-card-time">${formatRelativeTime(conv.updatedAt)}</span>
        </div>

        <div>
          <div class="grove-card-title">
            <span>${escapeHtml(conv.title)}</span>
            ${conv.isPinned ? `<span style="color: var(--amber); display: inline-flex; width: 13px; height: 13px;">${ICONS.pinFill}</span>` : ''}
          </div>
          <div class="grove-card-preview">${escapeHtml(previewText)}</div>
        </div>

        <div class="grove-card-footer">
          <div class="grove-card-actions">
            <button class="btn-grove-card-action btn-grove-pin" data-id="${conv.id}" title="${conv.isPinned ? 'Unpin' : 'Pin to top'}">
              ${conv.isPinned ? ICONS.pinFill : ICONS.pin}
            </button>
            <button class="btn-grove-card-action btn-grove-del" data-id="${conv.id}" title="Delete conversation">
              ${ICONS.trash}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindGroveCardEvents() {
    // New Card click
    const newCard = document.getElementById('btn-grove-new-chat');
    if (newCard) {
      newCard.addEventListener('click', () => this.openNewChatModal());
    }

    // Card clicks
    this.viewGrove.querySelectorAll('.grove-card:not(.grove-card-new)').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.grove-card-actions')) return;
        const id = card.dataset.id;
        this.showChat(id);
      });
    });

    // Pin clicks
    this.viewGrove.querySelectorAll('.btn-grove-pin').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.state.togglePin(btn.dataset.id);
      });
    });

    // Delete clicks
    this.viewGrove.querySelectorAll('.btn-grove-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.state.deleteConversation(btn.dataset.id);
      });
    });
  }

  renderSidebarItem(conv) {
    const ws = this.state.getWorkspace(conv.workspaceId);
    const persona = this.state.getPersona(conv.personaId);
    const isActive = this.currentView === 'chat' && this.state.activeConversationId === conv.id;

    return `
      <div class="sidebar-conv-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
        <div class="sidebar-conv-main">
          <div class="sidebar-conv-title-row">
            <span class="sidebar-conv-title">${escapeHtml(conv.title)}</span>
            ${conv.isPinned ? `<span style="color: var(--amber); display: inline-flex; width: 11px; height: 11px;">${ICONS.pinFill}</span>` : ''}
          </div>
          <div class="sidebar-conv-meta">
            <span class="sidebar-conv-persona" style="--ws-bg: ${ws.bg}; --ws-color: ${ws.color};">${persona.name}</span>
            <span>&bull;</span>
            <span>${formatRelativeTime(conv.updatedAt)}</span>
          </div>
        </div>
        <div class="sidebar-conv-actions">
          <button class="btn-sidebar-item-action btn-pin" data-id="${conv.id}" title="${conv.isPinned ? 'Unpin' : 'Pin to top'}">
            ${conv.isPinned ? ICONS.pinFill : ICONS.pin}
          </button>
          <button class="btn-sidebar-item-action btn-del" data-id="${conv.id}" title="Delete conversation">
            ${ICONS.trash}
          </button>
        </div>
      </div>
    `;
  }

  bindSidebarItemEvents() {
    this.sidebar.querySelectorAll('.sidebar-conv-item').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.sidebar-conv-actions')) return;
        const id = item.dataset.id;
        this.showChat(id);
        if (window.innerWidth <= 768) {
          this.toggleSidebar(false);
        }
      });
    });

    this.sidebar.querySelectorAll('.btn-pin').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.state.togglePin(btn.dataset.id);
      });
    });

    this.sidebar.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.state.deleteConversation(btn.dataset.id);
      });
    });
  }

  renderCurrentChat() {
    const conv = this.state.getActiveConversation();
    if (!conv) {
      this.chatTitleText.textContent = 'New Conversation';
      this.chatSubtitleText.textContent = 'with Canopy';
      this.chatEmptyState.style.display = 'flex';
      if (this.messagesList) {
        this.messagesList.style.display = 'none';
        this.messagesList.innerHTML = '';
      }
      this.updateSendButtonState();
      return;
    }

    const persona = this.state.getPersona(conv.personaId);
    this.chatTitleText.textContent = conv.title;
    this.chatSubtitleText.textContent = `with ${persona.name}`;
    this.chatEmptyPersona.textContent = persona.name;
    this.renderMessages(conv);
    this.updateSendButtonState();
    this.composerTextarea.focus();
  }

  renderMessages(conv) {
    if (!conv || conv.messages.length === 0) {
      this.chatEmptyState.style.display = 'flex';
      if (this.messagesList) {
        this.messagesList.style.display = 'none';
        this.messagesList.innerHTML = '';
      }
      this.messagesInnerColumn.querySelectorAll('.model-setup-card').forEach(el => el.remove());
      const browserSetupActive = this.state.browserLocalMode && this.browserLocal && !this.browserLocal.ready;
      this.chatEmptyState.classList.toggle('setup-active', browserSetupActive);

      // Browser-local Canopy Lite setup uses the same planting/download treatment
      // as the native local-model path, without sending the user to Settings.
      if (browserSetupActive) {
        const setupCard = document.createElement('div');
        setupCard.className = 'model-setup-card browser-model-setup-card';
        const status = this.browserLocalStatus || this.browserLocal.getStatus();
        const loading = status.loading || this.browserLocal.loading;
        const detail = escapeHtml(status.detail || 'Preparing local intelligence…');
        if (loading) {
          setupCard.innerHTML = `
            <div class="model-setup-icon">${ICONS.tree}</div>
            <h3 class="model-setup-title">Planting Canopy Lite</h3>
            <p class="model-setup-desc">A one-time download lets Canopy respond locally on this computer.</p>
            <div class="indeterminate-progress-bar"></div>
            <span class="form-hint">${detail} Please keep this page open.</span>
          `;
          this.composerTextarea.disabled = true;
          this.composerTextarea.placeholder = 'Canopy Lite is getting ready…';
        } else if (this.modelSetupError || status.status === 'error') {
          setupCard.innerHTML = `
            <div class="model-setup-icon" style="color: var(--error); background: rgba(200, 64, 64, 0.1);">${ICONS.exclamation}</div>
            <h3 class="model-setup-title">Canopy Lite could not start</h3>
            <p class="model-setup-desc">${escapeHtml(this.modelSetupError || 'Canopy Lite could not be prepared in this browser.')}</p>
            <div class="model-setup-actions">
              <button class="btn-primary" id="btn-retry-browser-model">Try again</button>
              <button class="btn-secondary" id="btn-use-browser-fallback">Use fallback</button>
            </div>
          `;
          this.composerTextarea.disabled = true;
        } else {
          setupCard.innerHTML = `
            <div class="model-setup-icon">${ICONS.tree}</div>
            <h3 class="model-setup-title">Start Canopy Lite</h3>
            <p class="model-setup-desc">Canopy Lite will prepare itself once, then run locally in this browser.</p>
            <button class="btn-primary" id="btn-start-browser-model">Try the model locally</button>
          `;
          this.composerTextarea.disabled = true;
        }
        this.messagesInnerColumn.appendChild(setupCard);
        setupCard.querySelector('#btn-start-browser-model')?.addEventListener('click', () => this.startPublicBrowserModelSetup());
        setupCard.querySelector('#btn-retry-browser-model')?.addEventListener('click', () => this.startPublicBrowserModelSetup());
        setupCard.querySelector('#btn-use-browser-fallback')?.addEventListener('click', () => {
          this.state.setBrowserLocalMode(false);
          this.state.setMockMode(true);
          this.api.setMockMode(true);
          this.modelSetupError = null;
          this.renderCurrentChat();
        });
        return;
      }

      // If model is downloading or needs setup on first run
      if (this.modelStatus && !this.modelStatus.ready && !this.state.mockMode && this.modelStatus.status !== 'offline') {
        const setupCard = document.createElement('div');
        setupCard.className = 'model-setup-card';

        const modelName = escapeHtml(this.modelStatus.displayName || this.api.selectedModelName || 'Canopy');
        if (this.isSettingUpModel || this.modelStatus.status === 'downloading' || this.modelStatus.status === 'loading') {
          const total = this.modelStatus.totalBytes || 0;
          const downloaded = this.modelStatus.downloadedBytes || 0;
          const progress = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
          const progressLabel = total > 0 ? `${progress}% downloaded` : 'Preparing the local runtime';
          setupCard.innerHTML = `
            <div class="model-setup-icon">
              ${ICONS.tree}
            </div>
            <h3 class="model-setup-title">${modelName} is getting ready</h3>
            <p class="model-setup-desc">Planting ${modelName} on this computer. This one-time setup keeps the model available locally.</p>
            <div class="indeterminate-progress-bar"></div>
            <span class="form-hint">${progressLabel}. Please keep this page open.</span>
          `;
          this.composerTextarea.disabled = true;
          this.composerTextarea.placeholder = 'Canopy Lore is getting ready…';
        } else if (this.modelSetupError || this.modelStatus.status === 'error' || this.modelStatus.status === 'unavailable') {
          const setupError = this.modelSetupError || this.modelStatus.error || this.modelStatus.detail || `The local runtime could not load ${modelName}.`;
          setupCard.innerHTML = `
            <div class="model-setup-icon" style="color: var(--error); background: rgba(200, 64, 64, 0.1);">
              ${ICONS.exclamation}
            </div>
            <h3 class="model-setup-title">${modelName} needs attention</h3>
            <p class="model-setup-desc">The local model could not finish preparing. Check the backend status, then try setup again.</p>
            <button class="btn-primary" id="btn-retry-setup">Retry Setup</button>
            <details class="technical-disclosure">
              <summary>Technical Details</summary>
              <pre>${escapeHtml(setupError)}</pre>
            </details>
          `;
          this.composerTextarea.disabled = true;
        } else {
          setupCard.innerHTML = `
            <div class="model-setup-icon">
              ${ICONS.tree}
            </div>
            <h3 class="model-setup-title">Set up ${modelName}</h3>
            <p class="model-setup-desc">${modelName} runs locally on this computer. First-time setup downloads and prepares the model files on your device.</p>
            <button class="btn-primary" id="btn-start-model-setup">Start chatting</button>
          `;
          this.composerTextarea.disabled = true;
          this.composerTextarea.placeholder = `Choose Start chatting to prepare ${modelName}…`;
        }

        this.messagesInnerColumn.appendChild(setupCard);

        const startBtn = setupCard.querySelector('#btn-start-model-setup');
        if (startBtn) {
          startBtn.addEventListener('click', () => this.handleModelDownload());
        }

        const retryBtn = setupCard.querySelector('#btn-retry-setup');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => this.handleModelDownload());
        }
      } else {
        this.composerTextarea.disabled = false;
        this.composerTextarea.placeholder = 'Message your assistant…';
      }

      return;
    }

    this.composerTextarea.disabled = false;
    this.composerTextarea.placeholder = 'Message your assistant…';
    this.chatEmptyState.style.display = 'none';
    this.chatEmptyState.classList.remove('setup-active');
    this.messagesInnerColumn.querySelectorAll('.model-setup-card').forEach(el => el.remove());

    if (this.messagesList) {
      this.messagesList.style.display = 'flex';
    }

    let html = '';
    conv.messages.forEach(msg => {
      const isUser = msg.role === 'user';

      if (isUser) {
        html += `
          <div class="message-row user" id="msg-row-${msg.id}">
          <div class="user-bubble">${escapeHtml(msg.content)}</div>
            <div class="message-actions-row">
              <button class="btn-msg-action" data-action="copy" data-msg-id="${msg.id}" title="Copy prompt">${ICONS.copy}</button>
              <button class="btn-msg-action" data-action="edit" data-msg-id="${msg.id}" title="Edit prompt">${ICONS.pencil}</button>
              <button class="btn-msg-action" data-action="resend" data-msg-id="${msg.id}" title="Resend prompt">${ICONS.refresh}</button>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="message-row assistant" id="msg-row-${msg.id}">
            <div class="assistant-bubble markdown-body">${renderMarkdown(msg.content)}</div>
            <div class="message-actions-row">
              <button class="btn-msg-action" data-action="copy" data-msg-id="${msg.id}" title="Copy response">${ICONS.copy}</button>
              <button class="btn-msg-action" data-action="report" data-msg-id="${msg.id}" title="Report an issue" aria-label="Report an issue with this response">${ICONS.exclamation}</button>
            </div>
          </div>
        `;
      }
    });

    if (this.messagesList) {
      this.messagesList.innerHTML = html;
    } else {
      this.messagesInnerColumn.innerHTML = html;
    }
  }

  autoResizeTextarea() {
    this.composerTextarea.style.height = 'auto';
    this.composerTextarea.style.height = Math.min(this.composerTextarea.scrollHeight, 140) + 'px';
  }

  updateSendButtonState() {
    const hasText = Boolean(this.composerTextarea.value.trim());
    if (this.state.isSending) {
      this.composerSendBtn.className = 'composer-send-btn stop';
      this.composerSendBtn.innerHTML = ICONS.stop;
      this.composerSendBtn.disabled = false;
      this.composerSendBtn.setAttribute('aria-label', 'Stop generating');
    } else {
      this.composerSendBtn.className = 'composer-send-btn' + (hasText ? ' active' : '');
      this.composerSendBtn.innerHTML = ICONS.arrowUp;
      this.composerSendBtn.disabled = !hasText;
      this.composerSendBtn.setAttribute('aria-label', 'Send message');
    }
  }

  toggleAttachPopover() {
    this.attachPopover.classList.toggle('open');
  }

  startTypingAnimation() {
    this.typingStartTime = Date.now();
    const typingCard = document.createElement('div');
    typingCard.id = 'active-typing-indicator';
    typingCard.className = 'typing-indicator-card';
    typingCard.innerHTML = `
      <div class="typing-orb-wrapper">
        <div class="typing-orb-glow"></div>
        <div class="typing-orb-core"></div>
      </div>
      <span class="typing-text-shimmer" id="typing-shimmer-text">${COMPOSING_PHRASES[0]}</span>
    `;
    if (this.messagesList) {
      this.messagesList.appendChild(typingCard);
    } else {
      this.messagesInnerColumn.appendChild(typingCard);
    }
    this.scrollToBottom();

    let phraseIdx = 0;
    this.typingInterval = setInterval(() => {
      const elapsedSec = (Date.now() - this.typingStartTime) / 1000;
      if (elapsedSec >= 5) {
        phraseIdx = Math.min(Math.floor((elapsedSec - 5) / 5) + 1, COMPOSING_PHRASES.length - 1);
        const textEl = document.getElementById('typing-shimmer-text');
        if (textEl) textEl.textContent = COMPOSING_PHRASES[phraseIdx];
      }
    }, 1000);
  }

  stopTypingAnimation() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
    const typingCard = document.getElementById('active-typing-indicator');
    if (typingCard) typingCard.remove();
  }

  scrollToBottom() {
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }

  scrollToAssistantTop(element) {
    if (!element) return;
    const conv = this.state.getActiveConversation();
    if (conv && conv.messages.length <= 1) {
      this.messagesArea.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const headerHeight = 70;
    const rect = element.getBoundingClientRect();
    const areaRect = this.messagesArea.getBoundingClientRect();
    const targetScrollTop = this.messagesArea.scrollTop + (rect.top - areaRect.top) - headerHeight;
    this.messagesArea.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }

  async handleSend() {
    const text = this.composerTextarea.value.trim();
    if (!text || this.state.isSending) return;

    let conv = this.state.getActiveConversation();
    
    // If no active conversation, create one cleanly
    if (!conv) {
      conv = this.state.createConversation(text.slice(0, 32) || 'New Conversation', 'personal', 'default');
      this.currentView = 'chat';
      this.app.classList.remove('in-grove-mode');
      this.app.classList.add('in-chat-mode');
      this.viewGrove.style.display = 'none';
      this.viewChat.style.display = 'flex';
      this.sidebar.classList.remove('collapsed');
      this.app.classList.remove('sidebar-collapsed');
    } else if (conv.messages.length === 0) {
      const autoTitle = text.length > 36 ? text.slice(0, 36) + '…' : text;
      this.state.renameConversation(conv.id, autoTitle);
      this.chatTitleText.textContent = autoTitle;
    }

    this.composerTextarea.value = '';
    this.autoResizeTextarea();
    this.updateSendButtonState();

    // 1. Add User Message & Immediately Render
    this.state.addMessage(conv.id, 'user', text);
    this.renderMessages(conv);
    this.scrollToBottom();

    // 2. Start Streaming Process
    this.state.isSending = true;
    this.updateSendButtonState();
    this.startTypingAnimation();

    this.abortController = new AbortController();

    try {
      const apiMessages = conv.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let assistantMsgRow = null;
      let assistantBubble = null;
      let firstTokenReceived = false;
      let streamedFullText = '';

      const streamRunner = this.state.browserLocalMode ? this.browserLocal : this.api;
      await streamRunner.streamChat(
        apiMessages,
        // Canopy Lore is a large local model on a laptop. Keep the default web
        // response bounded so a reasoning-heavy completion does not leave the
        // composer spinning indefinitely; callers can still override this in
        // the API client when they need a longer answer.
        { max_tokens: 64 },
        (chunk, accumulated) => {
          streamedFullText = accumulated;
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            this.stopTypingAnimation();

            // Create assistant message container
            assistantMsgRow = document.createElement('div');
            assistantMsgRow.className = 'message-row assistant streaming';
            assistantMsgRow.innerHTML = `
              <div class="assistant-bubble markdown-body"></div>
            `;
            if (this.messagesList) {
              this.messagesList.appendChild(assistantMsgRow);
            } else {
              this.messagesInnerColumn.appendChild(assistantMsgRow);
            }
            assistantBubble = assistantMsgRow.querySelector('.assistant-bubble');
            
            // Anchor to top of new assistant response
            this.scrollToAssistantTop(assistantMsgRow);
          }

          if (assistantBubble) {
            assistantBubble.innerHTML = renderMarkdown(accumulated) + '<span class="streaming-cursor"></span>';
          }
        },
        this.abortController.signal
      );

      // Save complete raw markdown text to state
      if (streamedFullText) {
        const cleanedResponse = cleanAssistantText(streamedFullText);
        if (cleanedResponse) {
          this.state.addMessage(conv.id, 'assistant', cleanedResponse);
        }
      }

    } catch (err) {
      this.stopTypingAnimation();
      if (err.message !== 'Request cancelled') {
        this.showChatError(err.message);
      }
    } finally {
      this.state.isSending = false;
      this.abortController = null;
      this.stopTypingAnimation();
      this.updateSendButtonState();
      this.renderMessages(this.state.getActiveConversation());
    }
  }

  handleStop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state.isSending = false;
    this.stopTypingAnimation();
    this.updateSendButtonState();
  }

  handleResend(promptText) {
    this.composerTextarea.value = promptText;
    this.autoResizeTextarea();
    this.updateSendButtonState();
    this.handleSend();
  }

  showChatError(errorMessage) {
    const rawError = errorMessage || 'The local model did not return a response.';
    const isBrowserSetupError = this.state.browserLocalMode && !this.browserLocalStatus?.ready;
    const isModelSetupError = isBrowserSetupError || /Canopy Lore (?:is not ready|couldn’t get ready)|model_unavailable|local model/i.test(rawError);
    const headline = isBrowserSetupError ? 'Canopy Lite needs a model file.' : isModelSetupError ? 'Canopy Lore needs to finish setup.' : 'Canopy couldn’t finish responding.';
    const safeError = escapeHtml(rawError);
    const errEl = document.createElement('div');
    errEl.className = 'chat-error-banner';
    errEl.innerHTML = `
      ${ICONS.exclamation}
      <div>
        <strong>${headline}</strong>
        <span class="chat-error-detail">${safeError}</span>
      </div>
      <button class="btn-retry" type="button">Try again</button>
    `;
    errEl.querySelector('.btn-retry').addEventListener('click', () => {
      errEl.remove();
      if (isBrowserSetupError) {
        this.openSettingsModal();
      } else if (isModelSetupError && !this.modelStatus?.ready) {
        this.handleModelDownload();
      } else {
        this.handleSend();
      }
    });
    this.messagesInnerColumn.appendChild(errEl);
    this.scrollToBottom();
  }

  showUndoToast(conv) {
    this.undoToastText.textContent = `“${conv.title}” deleted`;
    this.undoToast.classList.add('show');

    if (this.undoTimeout) clearTimeout(this.undoTimeout);
    this.undoTimeout = setTimeout(() => {
      this.hideUndoToast();
    }, 4500);
  }

  hideUndoToast() {
    this.undoToast.classList.remove('show');
    if (this.undoTimeout) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = null;
    }
  }

  // Modals & Sheets
  openNewChatModal() {
    let wsOptions = '';
    WORKSPACES.forEach(ws => {
      wsOptions += `
        <div class="option-card ${ws.id === 'personal' ? 'selected' : ''}" data-opt-type="ws" data-id="${ws.id}" style="--opt-color: ${ws.color}; --opt-bg: ${ws.bg};">
          <div class="option-card-header">
            ${ICONS[ws.icon]}
            <span>${ws.name}</span>
          </div>
        </div>
      `;
    });

    let personaOptions = '';
    PERSONAS.forEach(p => {
      personaOptions += `
        <div class="option-card ${p.id === 'default' ? 'selected' : ''}" data-opt-type="persona" data-id="${p.id}">
          <div class="option-card-header">
            ${ICONS.tree}
            <span>${p.name}</span>
          </div>
          <div class="option-card-desc">${p.desc}</div>
        </div>
      `;
    });

    this.modalNewChat.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">New Conversation</h2>
          <button class="btn-close-modal" id="btn-close-new-chat">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Conversation Title (Optional)</label>
            <input class="form-input" id="new-chat-title" placeholder="Untitled" />
          </div>
          <div class="form-group">
            <label class="form-label">Workspace</label>
            <div class="option-grid" id="new-chat-ws-grid">${wsOptions}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Assistant Persona</label>
            <div class="option-grid" id="new-chat-persona-grid">${personaOptions}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-cancel-new-chat">Cancel</button>
          <button class="btn-primary" id="btn-submit-new-chat">Create Conversation</button>
        </div>
      </div>
    `;

    this.modalNewChat.classList.add('open');

    const hardware = this.browserLocal?.getHardwareAssessment?.();
    const hardwareHint = hardware?.likelyCompatible
      ? 'This computer looks ready for local intelligence.'
      : 'This computer may be happier with the fallback.';
    const setupChoice = document.createElement('div');
    setupChoice.className = 'new-chat-model-choice';
    const recommendedRunMode = hardware?.likelyCompatible === false ? 'fallback' : 'local';
    setupChoice.innerHTML = `
      <div class="new-chat-model-choice-heading">Choose how to begin</div>
      <div class="new-chat-model-choice-copy">${hardwareHint} You can change this later.</div>
      <div class="new-chat-model-choice-actions">
        <button class="new-chat-model-card ${recommendedRunMode === 'local' ? 'selected' : ''}" id="btn-new-chat-local-model" type="button">
          <span class="new-chat-model-icon">${ICONS.tree}</span>
          <span><strong>Try Canopy Lite locally</strong><small>Runs on this computer · one-time setup</small></span>
        </button>
        <button class="new-chat-model-card ${recommendedRunMode === 'fallback' ? 'selected' : ''}" id="btn-new-chat-fallback" type="button">
          <span class="new-chat-model-icon">${ICONS.refresh}</span>
          <span><strong>Start with fallback</strong><small>Begins immediately · no setup</small></span>
        </button>
      </div>
    `;
    const body = this.modalNewChat.querySelector('.modal-body');
    body.prepend(setupChoice);
    let runMode = recommendedRunMode;
    const localChoice = setupChoice.querySelector('#btn-new-chat-local-model');
    const fallbackChoice = setupChoice.querySelector('#btn-new-chat-fallback');
    const selectRunMode = (mode) => {
      runMode = mode;
      localChoice.classList.toggle('selected', mode === 'local');
      fallbackChoice.classList.toggle('selected', mode === 'fallback');
    };
    localChoice.addEventListener('click', () => selectRunMode('local'));
    fallbackChoice.addEventListener('click', () => selectRunMode('fallback'));

    let selectedWs = 'personal';
    let selectedPersona = 'default';

    this.modalNewChat.querySelectorAll('#new-chat-ws-grid .option-card').forEach(card => {
      card.addEventListener('click', () => {
        this.modalNewChat.querySelectorAll('#new-chat-ws-grid .option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedWs = card.dataset.id;
      });
    });

    this.modalNewChat.querySelectorAll('#new-chat-persona-grid .option-card').forEach(card => {
      card.addEventListener('click', () => {
        this.modalNewChat.querySelectorAll('#new-chat-persona-grid .option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPersona = card.dataset.id;
      });
    });

    const closeModal = () => this.modalNewChat.classList.remove('open');
    document.getElementById('btn-close-new-chat').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-new-chat').addEventListener('click', closeModal);

    document.getElementById('btn-submit-new-chat').addEventListener('click', () => {
      const title = document.getElementById('new-chat-title').value;
      const conv = this.state.createConversation(title, selectedWs, selectedPersona);
      if (runMode === 'fallback') {
        this.state.setMockMode(true);
        this.api.setMockMode(true);
      } else {
        this.state.setMockMode(false);
        this.api.setMockMode(false);
        this.state.setModelPreference('canopy-lite');
        this.state.setBrowserLocalMode(true);
      }
      closeModal();
      this.showChat(conv.id);
      if (runMode === 'local' && !this.browserLocal?.ready) {
        this.startPublicBrowserModelSetup();
      }
      if (window.innerWidth <= 768) {
        this.toggleSidebar(false);
      }
    });
  }

  async startPublicBrowserModelSetup() {
    if (!this.browserLocal || this.browserLocal.loading || this.browserLocal.ready) return;
    this.modelSetupError = null;
    const hardware = this.browserLocal.getHardwareAssessment?.();
    if (hardware && hardware.likelyCompatible === false) {
      this.modelSetupError = 'This browser may not have enough memory for local intelligence. Use the fallback on this computer.';
      this.browserLocalStatus = { loading: false, status: 'error' };
      this.renderCurrentChat();
      return;
    }
    this.browserLocalStatus = { loading: true, detail: 'Downloading local intelligence…' };
    this.renderCurrentChat();
    try {
      await this.browserLocal.loadPublicModel(PUBLIC_CANOPY_LITE_MODEL);
      this.renderCurrentChat();
    } catch (error) {
      this.modelSetupError = 'Canopy Lite could not be prepared in this browser. Try again, or choose a local model in Settings.';
      this.renderCurrentChat();
    }
  }

  openRenameModal(conv) {
    this.modalRename.innerHTML = `
      <div class="modal-card" style="max-width: 420px;">
        <div class="modal-header">
          <h2 class="modal-title">Rename Conversation</h2>
          <button class="btn-close-modal" id="btn-close-rename">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <input class="form-input" id="rename-input" value="${escapeHtml(conv.title)}" />
            <span class="form-hint">Leave blank to keep as Untitled.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-clear-rename">Clear</button>
          <button class="btn-secondary" id="btn-cancel-rename">Cancel</button>
          <button class="btn-primary" id="btn-save-rename">Save</button>
        </div>
      </div>
    `;

    this.modalRename.classList.add('open');
    const input = document.getElementById('rename-input');
    input.focus();
    input.select();

    const closeModal = () => this.modalRename.classList.remove('open');
    document.getElementById('btn-close-rename').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-rename').addEventListener('click', closeModal);
    document.getElementById('btn-clear-rename').addEventListener('click', () => { input.value = ''; });

    document.getElementById('btn-save-rename').addEventListener('click', () => {
      this.state.renameConversation(conv.id, input.value);
      closeModal();
    });
  }

  openShareModal(conv) {
    const persona = this.state.getPersona(conv.personaId);
    let transcript = `CanopyChat conversation: ${conv.title}\nwith ${persona.name}\n\n`;
    conv.messages.forEach(m => {
      transcript += `${m.role === 'user' ? 'You' : persona.name}: ${m.content}\n\n`;
    });

    const mailtoLink = `mailto:?subject=${encodeURIComponent('CanopyChat Transcript: ' + conv.title)}&body=${encodeURIComponent(transcript)}`;

    this.modalShare.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Share Conversation</h2>
          <button class="btn-close-modal" id="btn-close-share">&times;</button>
        </div>
        <div class="modal-body">
          <div class="share-transcript-box">${transcript}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-copy-transcript">Copy Transcript</button>
          <a class="btn-primary" href="${mailtoLink}" target="_blank">Email Transcript</a>
        </div>
      </div>
    `;

    this.modalShare.classList.add('open');
    const closeModal = () => this.modalShare.classList.remove('open');
    document.getElementById('btn-close-share').addEventListener('click', closeModal);

    document.getElementById('btn-copy-transcript').addEventListener('click', () => {
      navigator.clipboard.writeText(transcript).then(() => {
        const btn = document.getElementById('btn-copy-transcript');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Transcript'; }, 1500);
      });
    });
  }

  openFeedbackEmail(msg) {
    const conv = this.state.getActiveConversation();
    const responseIndex = conv?.messages.findIndex(item => item.id === msg.id) ?? -1;
    const prompt = responseIndex > 0
      ? [...conv.messages.slice(0, responseIndex)].reverse().find(item => item.role === 'user')?.content
      : '';

    window.location.href = buildFeedbackMailto({
      conversationTitle: conv?.title,
      prompt,
      response: msg.content,
      messageId: msg.id,
      userAgent: navigator.userAgent
    });
  }

  async openSettingsModal() {
    let capabilities = null;
    try {
      capabilities = await this.api.getCapabilities();
    } catch (error) {
      console.warn('Could not load system capabilities:', error);
    }
    const hardware = capabilities?.hardware;
    const models = capabilities?.models || [];
    const recommendation = capabilities?.selection_reason || 'Recommended automatically from this computer’s available memory.';
    const modelOptions = [
      {
        id: 'auto',
        name: 'Recommended',
        description: recommendation,
        meta: hardware ? `${hardware.memory_gib} GB memory · ${hardware.operating_system}` : 'Best fit for this computer'
      },
      ...models.map(model => ({
        id: model.id,
        name: model.display_name || model.name,
        description: model.description,
        meta: `${model.parameters} · ${model.runtime.toUpperCase()} · ${model.recommended_memory_gib} GB memory recommended`,
        disabled: !model.available
      })),
      ...(models.some(model => model.id === 'canopy-lite') ? [] : [{
        id: 'canopy-lite',
        name: 'Canopy Lite',
        description: 'A lightweight local option for testing in your browser.',
        meta: 'Browser-local · runs on this computer'
      }])
    ];
    const modelChoiceHtml = modelOptions.map(option => `
      <label class="model-choice ${this.state.modelPreference === option.id ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}">
        <input type="radio" name="model-preference" value="${option.id}" ${this.state.modelPreference === option.id ? 'checked' : ''} ${option.disabled ? 'disabled' : ''}>
        <span class="model-choice-copy">
          <span class="model-choice-title">${escapeHtml(option.name)}</span>
          <span class="model-choice-desc">${escapeHtml(option.description)}</span>
          <span class="model-choice-meta">${escapeHtml(option.meta)}</span>
        </span>
      </label>
    `).join('');
    this.modalSettings.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Settings & Backend</h2>
          <button class="btn-close-modal" id="btn-close-settings">&times;</button>
        </div>
        <div class="modal-body">
          <div class="info-callout">
            ${ICONS.tree}
            <div>
              <strong>Local, text-only intelligence</strong><br>
              Pick the model that fits this computer. Only one model is kept in memory at a time.
            </div>
          </div>

          <div class="form-group">
            <span class="form-label">Local model</span>
            <div class="model-choice-list" id="setting-model-choice-list">${modelChoiceHtml}</div>
          </div>

          <div class="browser-local-panel ${this.state.browserLocalMode ? 'active' : ''}">
            <div class="browser-local-panel-heading">
              <div>
                <span class="form-label">Canopy Lite in this browser</span>
                <span class="form-hint">Experimental: runs locally in this browser. The first setup may take a moment.</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="setting-browser-local-toggle" ${this.state.browserLocalMode ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <input type="file" id="browser-local-model-file" accept=".gguf,application/octet-stream" hidden>
            <div class="browser-local-actions">
              <button class="btn-secondary" id="btn-choose-browser-model" type="button">Choose a local model</button>
              <span class="form-hint" id="browser-local-status">${this.browserLocal?.ready ? 'Ready in this browser' : this.browserLocal?.loading ? 'Preparing…' : 'No local model ready'}</span>
            </div>
            <span class="form-hint">This browser path is for testing. Local model files can be inspected by the browser.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Backend Server Endpoint</label>
            <input class="form-input" id="setting-backend-url" value="${this.state.backendUrl}" />
            <span class="form-hint">Default is <code>http://127.0.0.1:8790</code>.</span>
          </div>

          <div class="toggle-row">
            <div class="toggle-label-group">
              <span class="form-label">Local Simulation Mode</span>
              <span class="form-hint">Generates realistic local responses when the inference service is offline.</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-mock-toggle" ${this.state.mockMode ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Message Font Scale</label>
            <select class="form-select" id="setting-font-scale">
              <option value="0.9" ${this.state.fontScale === 0.9 ? 'selected' : ''}>Compact (90%)</option>
              <option value="1.0" ${this.state.fontScale === 1.0 ? 'selected' : ''}>Standard (100%)</option>
              <option value="1.1" ${this.state.fontScale === 1.1 ? 'selected' : ''}>Comfortable (110%)</option>
              <option value="1.2" ${this.state.fontScale === 1.2 ? 'selected' : ''}>Large (120%)</option>
            </select>
          </div>

          <div class="form-group">
            <button class="btn-secondary" id="btn-test-health" style="align-self: flex-start;">
              ${ICONS.refresh} Test Connection
            </button>
            <span class="form-hint" id="health-test-result">Click to test connection to endpoint.</span>
          </div>

          <hr style="border: none; height: 1px; background: var(--color-border-subtle);" />

          <div class="form-group">
            <button class="btn-secondary" id="btn-reset-seeds" style="color: var(--error); border-color: rgba(200,64,64,0.3);">
              ${ICONS.trash} Reset to Seed Conversations
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="btn-save-settings">Done</button>
        </div>
      </div>
    `;

    this.modalSettings.classList.add('open');
    const closeModal = () => this.modalSettings.classList.remove('open');
    document.getElementById('btn-close-settings').addEventListener('click', closeModal);
    document.querySelectorAll('input[name="model-preference"]').forEach(input => {
      input.addEventListener('change', () => {
        document.querySelectorAll('.model-choice').forEach(choice => choice.classList.remove('selected'));
        input.closest('.model-choice')?.classList.add('selected');
        if (input.value === 'canopy-lite') {
          const toggle = document.getElementById('setting-browser-local-toggle');
          if (toggle) toggle.checked = true;
          // Selecting Canopy Lite is the action: immediately open the picker
          // so the user does not have to discover a second setup control.
          window.setTimeout(() => document.getElementById('browser-local-model-file')?.click(), 0);
        }
      });
    });
    document.getElementById('btn-save-settings').addEventListener('click', async () => {
      const newUrl = document.getElementById('setting-backend-url').value;
      const mockChecked = document.getElementById('setting-mock-toggle').checked;
      const scale = document.getElementById('setting-font-scale').value;
      const modelPreference = document.querySelector('input[name="model-preference"]:checked')?.value || 'auto';
      const browserLocalChecked = document.getElementById('setting-browser-local-toggle')?.checked || false;

      this.state.setBackendUrl(newUrl);
      this.api.setBaseUrl(newUrl);
      this.state.setMockMode(mockChecked);
      this.api.setMockMode(mockChecked);
      this.state.setFontScale(scale);
      this.state.setModelPreference(modelPreference);
      this.state.setBrowserLocalMode(browserLocalChecked && modelPreference === 'canopy-lite');
      try {
        await this.api.selectModel(modelPreference);
        this.modelSetupError = null;
      } catch (error) {
        this.modelSetupError = error.message;
      }
      await this.checkBackendHealth();
      closeModal();
    });

    const browserToggle = document.getElementById('setting-browser-local-toggle');
    const browserFileInput = document.getElementById('browser-local-model-file');
    const browserStatus = document.getElementById('browser-local-status');
    document.getElementById('btn-choose-browser-model')?.addEventListener('click', () => browserFileInput?.click());
    browserFileInput?.addEventListener('change', async () => {
      const file = browserFileInput.files?.[0];
      if (!file || !this.browserLocal) return;
      this.state.setModelPreference('canopy-lite');
      this.state.setBrowserLocalMode(true);
      browserStatus.textContent = 'Preparing local intelligence…';
      try {
        await this.browserLocal.loadFile(file);
        browserStatus.textContent = 'Ready in this browser';
      } catch (error) {
        browserStatus.textContent = 'Could not prepare the local model. Try again.';
      }
    });

    document.getElementById('btn-test-health').addEventListener('click', async () => {
      const resultSpan = document.getElementById('health-test-result');
      resultSpan.textContent = 'Testing connection…';
      const candidateUrl = document.getElementById('setting-backend-url').value;
      const previousUrl = this.api.baseUrl;
      this.api.setBaseUrl(candidateUrl);
      const health = await this.api.checkHealth({ allowDefaultFallback: false });
      if (health.ok) {
        resultSpan.textContent = `Online! Latency: ${health.latencyMs}ms.`;
        resultSpan.style.color = 'var(--forest-medium)';
      } else {
        resultSpan.textContent = `Failed: ${health.error || 'HTTP ' + health.httpStatus}`;
        resultSpan.style.color = 'var(--error)';
      }
      // Testing a draft value should not silently change the live endpoint;
      // the Done action remains the single place that saves configuration.
      this.api.setBaseUrl(previousUrl);
      this.checkBackendHealth();
    });

    document.getElementById('btn-reset-seeds').addEventListener('click', () => {
      if (confirm('Reset all conversations to initial seed data?')) {
        this.state.resetToSeed();
        closeModal();
      }
    });
  }
}
