--- START OF FILE script.js ---
// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import { getDatabase, ref, get, set, update, push, query, orderByChild, equalTo, onValue, runTransaction, off, limitToLast, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Initialize Firebase Variables
let app, db, auth, analytics;

async function initFirebaseAndApp() {
    try {
        const response = await fetch('/.netlify/functions/firebase-config');
        if (!response.ok) throw new Error("Failed to fetch config");
        const firebaseConfig = await response.json();

        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        auth = getAuth(app);
        analytics = getAnalytics(app);
        console.log("Firebase Initialized Successfully.");

        // Initialize App Logic
        initializeEventListeners();
        updateGlobalUI(false);
        onAuthStateChanged(auth, handleAuthStateChange);
        checkSecurityRules();
        
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        document.body.innerHTML = `<div class="alert alert-danger m-5 position-fixed top-0 start-0 end-0" style="z-index: 10000;">Critical Error: Could not connect to backend. Check configuration & console. Error: ${error.message}</div>`;
    }
}

// --- DOM Elements Cache ---
    const getElement = (id) => document.getElementById(id);
    const querySel = (selector) => document.querySelector(selector);
    const querySelAll = (selector) => document.querySelectorAll(selector);
    const elements = {
        sections: querySelAll('.section'), bottomNavItems: querySelAll('.bottom-nav .nav-item'), globalLoader: getElement('globalLoaderEl'),
        headerBackBtn: getElement('headerBackBtnEl'),
        headerWalletChip: getElement('headerWalletChipEl'), headerChipBalance: getElement('headerChipBalanceEl'),
        headerCoinChip: getElement('headerCoinChipEl'), headerChipCoinBalance: getElement('headerChipCoinBalanceEl'),
        appLogo: getElement('appLogoEl'),
        loginSection: getElement('login-section'),
        emailLoginForm: getElement('emailLoginForm'),
        loginEmailInput: getElement('loginEmailInputEl'),
        loginPasswordInput: getElement('loginPasswordInputEl'),
        loginEmailBtn: getElement('loginEmailBtnEl'),
        googleSignInBtn: getElement('googleSignInBtnEl'),
        loginSignupToggleBtn: getElement('loginSignupToggleBtnEl'),
        loginStatusMessage: getElement('loginStatusMessageEl'),
        forgotPasswordLink: getElement('forgotPasswordLinkEl'),
        emailSignupForm: getElement('emailSignupForm'),
        signupUsernameInput: getElement('signupUsernameInputEl'),
        signupEmailInput: getElement('signupEmailInputEl'),
        signupPasswordInput: getElement('signupPasswordInputEl'),
        signupConfirmPasswordInput: getElement('signupConfirmPasswordInputEl'),
        signupUidInput: getElement('signupUidInputEl'),
        signupReferralCodeInput: getElement('signupReferralCodeInputEl'),
        signupEmailBtn: getElement('signupEmailBtnEl'),
        signupStatusMessage: getElement('signupStatusMessageEl'),
        homeSection: getElement('home-section'), promotionSlider: getElement('promotionSliderEl'), gamesList: getElement('gamesListEl'), myContestsList: getElement('myContestsListEl'), noContestsMessage: getElement('noContestsMessageEl'),
        tournamentsSection: getElement('tournaments-section'), tournamentsListContainer: getElement('tournamentsListContainerEl'), noTournamentsMessage: getElement('noTournamentsMessageEl'), tournamentTabs: querySelAll('.tournament-tabs .tab-item'),
        walletSection: getElement('wallet-section'), walletTotalBalance: getElement('walletTotalBalanceEl'), walletWinningCash: getElement('walletWinningCashEl'), walletBonusCash: getElement('walletBonusCashEl'), walletGameCoins: getElement('walletGameCoinsEl'),
        allTransactionsBtn: getElement('allTransactionsBtnEl'), coinHistoryBtn: getElement('coinHistoryBtnEl'), withdrawBtn: getElement('withdrawBtnEl'), addAmountWalletBtn: getElement('addAmountWalletBtnEl'), redeemDiamondsWalletBtn: getElement('redeemDiamondsWalletBtnEl'),
        recentTransactionsList: getElement('recentTransactionsListEl'), noTransactionsMessage: getElement('noTransactionsMessageEl'),
        earningsSection: getElement('earnings-section'), earningsTotal: getElement('earningsTotalEl'), earningsReferral: getElement('earningsReferralEl'), viewEarningsHistoryBtn: getElement('viewEarningsHistoryBtn'),
        dailyCheckinContainer: getElement('dailyCheckinContainerEl'), dailyTasksContainer: getElement('dailyTasksContainerEl'), noTasksMessage: getElement('noTasksMessageEl'),
        profileSection: getElement('profile-section'), profileAvatar: getElement('profileAvatarEl'), profileName: getElement('profileNameEl'), profileEmail: getElement('profileEmailEl'), profileGameUidEl: getElement('profileGameUidEl'), editProfileDetailsBtn: getElement('editProfileDetailsBtn'), profileTotalMatches: getElement('profileTotalMatchesEl'), profileWonMatches: getElement('profileWonMatchesEl'), profileTotalEarnings: getElement('profileTotalEarningsEl'), logoutProfileBtn: getElement('logoutProfileBtnEl'), 
        policyLinks: querySelAll('a[data-policy], button[data-policy]'), // Updated selector
        profileLinksWithSection: querySelAll('.profile-links a[data-section]'), notificationSwitch: getElement('notificationSwitchEl'),
        profileVerifiedBadge: getElement('profileVerifiedBadgeEl'),
        policyModalInstance: getElement('policyModalEl') ? new bootstrap.Modal(getElement('policyModalEl')) : null, policyModalTitle: getElement('policyModalTitleEl'), policyModalBody: getElement('policyModalBodyEl'),
        withdrawModalInstance: getElement('withdrawModalEl') ? new bootstrap.Modal(getElement('withdrawModalEl')) : null, withdrawModalBalance: getElement('withdrawModalBalanceEl'), withdrawAmountInput: getElement('withdrawAmountInputEl'), withdrawPaymentMethodSelect: getElement('withdrawPaymentMethodSelectEl'), withdrawMethodInput: getElement('withdrawMethodInputEl'), minWithdrawAmount: getElement('minWithdrawAmountEl'), withdrawStatusMessage: getElement('withdrawStatusMessageEl'), submitWithdrawRequestBtn: getElement('submitWithdrawRequestBtnEl'),
        matchDetailsModalInstance: getElement('matchDetailsModalEl') ? new bootstrap.Modal(getElement('matchDetailsModalEl')) : null, matchDetailsModalTitle: getElement('matchDetailsModalTitleEl'), matchDetailsModalBody: getElement('matchDetailsModalBodyEl'),
        idPasswordModalInstance: getElement('idPasswordModalEl') ? new bootstrap.Modal(getElement('idPasswordModalEl')) : null, roomIdDisplay: getElement('roomIdDisplayEl'), roomPasswordDisplay: getElement('roomPasswordDisplayEl'),
        securityWarning: getElement('securityWarning'),
        depositSection: getElement('deposit-section'),
        depositAccountNumber: getElement('depositAccountNumberEl'),
        depositTimer: getElement('depositTimerEl'),
        depositForm: getElement('depositFormEl'),
        depositAmountInput: getElement('depositAmountInputEl'),
        depositTransactionIdInput: getElement('depositTransactionIdInputEl'),
        depositSenderNumberInput: getElement('depositSenderNumberInputEl'),
        depositSenderNameInput: getElement('depositSenderNameInputEl'),
        depositStatusMessage: getElement('depositStatusMessageEl'),
        submitDepositRequestBtn: getElement('submitDepositRequestBtnEl'),
        cancelDepositBtn: getElement('cancelDepositBtnEl'),
        historySection: getElement('history-section'),
        matchHistoryList: getElement('matchHistoryListEl'),
        noMatchHistoryMessage: getElement('noMatchHistoryMessageEl'),
        fullResultsModalInstance: getElement('fullResultsModalEl') ? new bootstrap.Modal(getElement('fullResultsModalEl')) : null,
        fullResultsModalTitle: getElement('fullResultsModalTitleEl'),
        fullResultsModalBody: getElement('fullResultsModalBodyEl'),
        fullResultsList: getElement('fullResultsListEl'),
        noFullResultsMessage: getElement('noFullResultsMessageEl'),
        editProfileModalInstance: getElement('editProfileModalEl') ? new bootstrap.Modal(getElement('editProfileModalEl')) : null,
        editProfileForm: getElement('editProfileFormEl'),
        editProfileNameInput: getElement('editProfileNameInputEl'),
        editProfileUidInput: getElement('editProfileUidInputEl'),
        editProfileStatusMessage: getElement('editProfileStatusMessageEl'),
        saveProfileChangesBtn: getElement('saveProfileChangesBtnEl'),
        confirmJoinModalInstance: getElement('confirmJoinModalEl') ? new bootstrap.Modal(getElement('confirmJoinModalEl')) : null,
        confirmJoinModalTitle: getElement('confirmJoinModalTitleEl'),
        confirmJoinModalBody: getElement('confirmJoinModalBodyEl'),
        confirmJoinModalBtn: getElement('confirmJoinModalBtnEl'),
        customToastContainer: getElement('customToastContainer'),
        gamesHtmlSection: getElement('games-html-section'),
        htmlGamesList: getElement('htmlGamesListEl'),
        noHtmlGamesMessage: getElement('noHtmlGamesMessageEl'),
        gameViewModalInstance: getElement('gameViewModalEl') ? new bootstrap.Modal(getElement('gameViewModalEl')) : null,
        gameViewModalTitle: getElement('gameViewModalTitleEl'),
        gameViewIframe: getElement('gameViewIframeEl'),
        redeemDiamondsSection: getElement('redeem-diamonds-section'),
        redeemSectionCoinBalance: getElement('redeemSectionCoinBalanceEl'),
        redeemSectionPkrBalance: getElement('redeemSectionPkrBalanceEl'),
        redeemDiamondCardsContainer: getElement('redeemDiamondCardsContainerEl'),
        noRedeemOptionsMessage: getElement('noRedeemOptionsMessageEl'),
        historyModalInstance: getElement('historyModalEl') ? new bootstrap.Modal(getElement('historyModalEl')) : null,
        historyModalTitle: getElement('historyModalTitleEl'),
        historyModalList: getElement('historyModalListEl'),
        noHistoryModalMessage: getElement('noHistoryModalMessageEl'),
        mailboxSection: getElement('mailbox-section'),
        mailboxList: getElement('mailboxListEl'),
        noMailboxMessage: getElement('noMailboxMessageEl'),
        mailboxUnreadIndicator: getElement('mailboxUnreadIndicatorEl'),
        viewPlayersModalInstance: getElement('viewPlayersModalEl') ? new bootstrap.Modal(getElement('viewPlayersModalEl')) : null,
        viewPlayersModalTitle: getElement('viewPlayersModalTitleEl'),
        togglePlayersViewBtn: getElement('togglePlayersViewBtn'),
        toggleMatchupsViewBtn: getElement('toggleMatchupsViewBtn'),
        viewPlayersListContainer: getElement('viewPlayersListContainer'),
        viewMatchupsListContainer: getElement('viewMatchupsListContainer'),
        viewPlayersList: getElement('viewPlayersListEl'),
        noPlayersMessage: getElement('noPlayersMessageEl'),
        matchupsList: getElement('matchupsListEl'),
        noMatchupsMessage: getElement('noMatchupsMessageEl'),
        // News Section Elements
        newsSection: getElement('news-section'),
        newsListContainer: getElement('newsListContainerEl'),
        noNewsMessage: getElement('noNewsMessageEl'),
        // News Comments Modal Elements
        newsCommentsModalInstance: getElement('newsCommentsModalEl') ? new bootstrap.Modal(getElement('newsCommentsModalEl')) : null,
        newsCommentsModalTitle: getElement('newsCommentsModalTitleEl'),
        newsCommentsList: getElement('newsCommentsListEl'),
        noNewsCommentsMessage: getElement('noNewsCommentsMessageEl'),
        commentForm: getElement('commentFormEl'),
        commentInput: getElement('commentInputEl'),
        postCommentBtn: getElement('postCommentBtnEl'),
    };

// --- App State ---
let currentUser = null; let userProfile = {}; let currentSectionId = 'login-section'; let dbListeners = {};
let swiperInstance; let currentTournamentGameId = null; let appSettings = {};
let depositTimerInterval = null;
let gamePlayTimer = null;
let lastUpdateTime = 0;
let resendTimerInterval = null; 

// --- Utility Functions ---
    const showLoader = (show) => { if (elements.globalLoader) elements.globalLoader.style.display = show ? 'flex' : 'none'; };
    function showStatusMessage(element, message, type = 'danger', autohide = true) {
        if (!element) return;
        const iconMap = {
            'success': 'bi-check-circle-fill',
            'danger': 'bi-x-octagon-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill'
        };
        const iconClass = iconMap[type] || 'bi-info-circle-fill';
        element.innerHTML = `<i class="bi ${iconClass}"></i> <span>${message}</span>`;
        element.className = `alert custom-alert custom-alert-${type} mt-3`;
        element.style.display = 'flex'; 
        element.setAttribute('role', 'alert');
        if (autohide) {
            setTimeout(() => {
                if (element && element.style.display !== 'none') {
                        element.style.display = 'none';
                }
            }, 5000);
        }
    }
    function showCustomToast(message, type = 'info', duration = 3000) {
        if (!elements.customToastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `custom-toast toast-${type}`;

        const iconMap = {
            'success': 'bi-check-circle-fill',
            'danger': 'bi-x-octagon-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill'
        };
        const iconClass = iconMap[type] || 'bi-info-circle-fill';

        toast.innerHTML = `
            <i class="toast-icon bi ${iconClass}"></i>
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close-toast" aria-label="Close">&times;</button>
        `;

        elements.customToastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        const closeButton = toast.querySelector('.btn-close-toast');
        closeButton.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 400); 
        });

        if (duration > 0) {
            setTimeout(() => {
                if (toast.classList.contains('show')) {
                    closeButton.click();
                }
            }, duration);
        }
    }
    function clearStatusMessage(element) { if (!element) return; element.style.display = 'none'; element.innerHTML = ''; element.removeAttribute('role'); }
    
    function fallbackCopyTextToClipboard(text, successMessage) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCustomToast(successMessage, 'success');
            } else {
                showCustomToast('Copy failed. Please copy manually.', 'danger');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
            showCustomToast('Copy failed. Please copy manually.', 'danger');
        }

        document.body.removeChild(textArea);
    }

    function copyToClipboard(textToCopy, successMessage = 'Copied to clipboard!') {
        if (!textToCopy) {
            showCustomToast('Nothing to copy.', 'info');
            return;
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => showCustomToast(successMessage, 'success'))
                .catch(err => {
                    console.warn('Modern clipboard API failed, falling back.', err);
                    fallbackCopyTextToClipboard(textToCopy, successMessage);
                });
        } else {
            fallbackCopyTextToClipboard(textToCopy, successMessage);
        }
    }

    function generateReferralCode(length = 8) { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let result = ''; for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length)); return result; }
    function getTimeRemaining(startTime) { if (!startTime) return 'TBA'; const now = Date.now(); const diff = startTime - now; if (diff <= 0) return 'Starting Soon'; const days = Math.floor(diff / 86400000); const hours = Math.floor((diff % 86400000) / 3600000); const minutes = Math.floor((diff % 3600000) / 60000); let o = ''; if (days > 0) o += `${days}d `; if (hours > 0 || days > 0) o += `${hours}h `; o += `${minutes}m`; return o.trim() || 'Now'; }
    const removePlaceholders = (parentElement) => { if (!parentElement) return; parentElement.classList.remove('placeholder-glow'); parentElement.querySelectorAll('.placeholder').forEach(el => el.remove()); };

    // Background Email Helper
    function sendSilentEmail(userId, phone, amount, type) {
        const form = document.getElementById('silentEmailForm');
        if(!form) return;
        document.getElementById('se_userId').value = userId;
        document.getElementById('se_phone').value = phone;
        document.getElementById('se_amount').value = amount;
        document.getElementById('se_type').value = type;
        document.getElementById('se_datetime').value = new Date().toLocaleString();
        form.submit();
    }

    // Process UI Timer Helper
    function startProcessingTimer(duration, displayElement, onComplete) {
        if (depositTimerInterval) clearInterval(depositTimerInterval);
        let timer = duration, minutes, seconds;
        displayElement.style.color = 'var(--warning-color)';
        const msgPara = displayElement.parentElement.querySelector('p');
        if (msgPara) msgPara.textContent = "Please wait while we process your payment request.";
        
        depositTimerInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10); seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes; seconds = seconds < 10 ? "0" + seconds : seconds;
            displayElement.textContent = minutes + ":" + seconds;
            if (--timer < 0) {
                clearInterval(depositTimerInterval);
                if(onComplete) onComplete();
            }
        }, 1000);
    }

// --- UI Functions ---
    function showSection(sectionId, hideBottomNav = false) {
        if (!auth || !sectionId || !elements.sections) { console.error("Cannot show section", sectionId); return; }
        const targetSection = getElement(sectionId); if (!targetSection) { console.error(`Section element "${sectionId}" not found.`); showSection(currentUser ? 'home-section' : 'login-section'); return; }
        const protectedSections = ['home-section', 'wallet-section', 'earnings-section', 'profile-section', 'tournaments-section', 'deposit-section', 'history-section', 'games-html-section', 'redeem-diamonds-section', 'mailbox-section', 'news-section'];
        const isLoggedIn = !!currentUser;
        if (protectedSections.includes(sectionId) && !isLoggedIn) { showSection('login-section'); return; }
        if (sectionId === 'login-section' && isLoggedIn) { showSection('home-section'); return; }

        elements.sections.forEach(sec => sec.classList.remove('active')); targetSection.classList.add('active'); currentSectionId = sectionId;
        updateHeaderForSection(sectionId);

        const bottomNavEl = querySel('.bottom-nav');
        const adBannerEl = querySel('.ad-banner-container');
        if (bottomNavEl) {
            bottomNavEl.style.display = hideBottomNav ? 'none' : 'flex';
            if (adBannerEl) adBannerEl.style.display = hideBottomNav ? 'none' : 'flex';
            document.body.style.paddingBottom = hideBottomNav ? '0' : '125px';
        }

        if (!hideBottomNav) {
        elements.bottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.section === sectionId));
        }

        console.log(`Loading data for section: ${sectionId}`);
        switch (sectionId) {
            case 'home-section': loadHomePageData(); break;
            case 'wallet-section': loadWalletData(); break;
            case 'profile-section': loadProfileData(); break;
            case 'earnings-section': loadEarningsData(); break;
            case 'history-section': loadMatchHistoryData(); break;
            case 'games-html-section': loadHtmlGamesData(); break;
            case 'redeem-diamonds-section': loadRedeemDiamondsPage(); break;
            case 'mailbox-section': loadMailboxData(); break;
            case 'news-section': loadNewsData(); break;
            case 'tournaments-section':
            if(currentTournamentGameId) {
                    const activeTab = querySel('.tournament-tabs .tab-item.active')?.dataset.status || 'upcoming';
                    filterTournaments(currentTournamentGameId, activeTab);
            } else {
                    elements.tournamentsListContainer.innerHTML = '<p class="text-secondary text-center mt-4">Select a game from Home page first.</p>';
            }
            break;
        case 'deposit-section':
            prepareDepositPage();
            break;
        }
        if (sectionId === 'login-section') { toggleLoginForm(true); }
        window.scrollTo(0, 0);
    }
    
    function updateHeaderForSection(sectionId) {
        const showBackButton = ![
        'home-section', 'wallet-section', 'earnings-section', 'profile-section', 'login-section', 'games-html-section', 'news-section'
        ].includes(sectionId);
        
        if (elements.headerBackBtn) elements.headerBackBtn.style.display = showBackButton ? 'inline-block' : 'none';
    }

    function updateGlobalUI(isLoggedIn) {
        if (elements.headerWalletChip) { elements.headerWalletChip.style.display = isLoggedIn ? 'flex' : 'none'; if (isLoggedIn) elements.headerWalletChip.onclick = () => showSection('wallet-section'); else elements.headerWalletChip.onclick = null; }
        if (elements.headerCoinChip) { elements.headerCoinChip.style.display = isLoggedIn ? 'flex' : 'none'; if (isLoggedIn) elements.headerCoinChip.onclick = () => showSection('wallet-section'); else elements.headerCoinChip.onclick = null; }

        if (!isLoggedIn && elements.headerChipBalance) elements.headerChipBalance.textContent = '0';
        if (!isLoggedIn && elements.headerChipCoinBalance) elements.headerChipCoinBalance.textContent = '0';

        elements.bottomNavItems.forEach(item => {
        const section = item.dataset.section;
        const alwaysVisible = section === 'home-section';
        const needsLogin = ['games-html-section', 'wallet-section', 'earnings-section', 'profile-section', 'news-section'].includes(section);
        item.style.display = (alwaysVisible || (needsLogin && isLoggedIn)) ? 'flex' : 'none';
        });
    }
    
    async function loadReferralCount(uid) {
        if (!uid) return;
        try {
            const q = query(ref(db, 'users'), orderByChild('referredBy'), equalTo(uid));
            const snapshot = await get(q);
            const count = snapshot.exists() ? snapshot.size : 0;
            
            const modalCountEl = getElement('referralModalCountEl');
            if (modalCountEl) {
                modalCountEl.innerHTML = `You have successfully referred <strong>${count}</strong> user(s).`;
            }
        } catch (error) {
            console.error("Failed to load referral count:", error);
                const modalCountEl = getElement('referralModalCountEl');
                if(modalCountEl) modalCountEl.textContent = 'Could not load referral stats.';
        }
    }

    function populateUserInfo(user, profile) {
            if (!user || !profile) return;
            const displayName = profile.displayName || user.displayName || user.email?.split('@')[0] || 'User';
            const photoURL = profile.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=E2E8F0&bold=true&size=70`;
            
            const winningCash = (profile.winningCash || 0); 
            const bonusCash = (profile.bonusCash || 0);
            const balance = winningCash + bonusCash;

            const gameCoins = (profile.gameCoins || 0);
            const totalEarnings = (profile.totalEarnings || 0); const referralEarnings = (profile.referralEarnings || 0);
            const totalMatches = profile.totalMatches || 0; const wonMatches = profile.wonMatches || 0;
            const formatCurrency = (amount) => `PKR ${amount.toFixed(2)}`;

            if (elements.headerChipBalance) elements.headerChipBalance.textContent = Math.floor(balance);
            if (elements.headerChipCoinBalance) elements.headerChipCoinBalance.textContent = Math.floor(gameCoins);

            if (elements.walletTotalBalance) { elements.walletTotalBalance.textContent = formatCurrency(balance); removePlaceholders(elements.walletTotalBalance.closest('.balance-item.placeholder-glow')); }
            if (elements.walletWinningCash) { elements.walletWinningCash.textContent = formatCurrency(winningCash); removePlaceholders(elements.walletWinningCash.closest('.balance-item.placeholder-glow')); }
            if (elements.walletBonusCash) { elements.walletBonusCash.textContent = formatCurrency(bonusCash); removePlaceholders(elements.walletBonusCash.closest('.balance-item.placeholder-glow')); }
            
            if (elements.walletGameCoins) { elements.walletGameCoins.innerHTML = `<i class="bi bi-coin"></i> ${Math.floor(gameCoins)}`; removePlaceholders(elements.walletGameCoins.closest('.balance-item.placeholder-glow')); }
            
            if (elements.redeemSectionCoinBalance) elements.redeemSectionCoinBalance.textContent = Math.floor(gameCoins);
            if (elements.redeemSectionPkrBalance) elements.redeemSectionPkrBalance.textContent = balance.toFixed(2);

            if (elements.withdrawModalBalance) elements.withdrawModalBalance.textContent = formatCurrency(winningCash);

            if (elements.profileAvatar) elements.profileAvatar.src = photoURL;
            if (elements.profileName) { elements.profileName.textContent = displayName; removePlaceholders(elements.profileName.closest('.placeholder-glow')); }
            if (elements.profileEmail) { elements.profileEmail.textContent = user.email || 'N/A'; removePlaceholders(elements.profileEmail.closest('.placeholder-glow')); }
            
            if (elements.profileVerifiedBadge) {
            if (user && user.emailVerified) {
                elements.profileVerifiedBadge.style.display = 'inline-flex';
            } else {
                elements.profileVerifiedBadge.style.display = 'none';
            }
            }

            if (elements.profileGameUidEl) {
            if (profile.gameUid) {
                elements.profileGameUidEl.innerHTML = `UID: <span class="text-light">${profile.gameUid}</span>`;
                elements.profileGameUidEl.style.display = 'block';
                removePlaceholders(elements.profileGameUidEl);
            } else {
                elements.profileGameUidEl.innerHTML = `UID: <span class="text-warning">Not Set</span>`;
                elements.profileGameUidEl.style.display = 'block';
            }
            }
            if (elements.editProfileDetailsBtn) elements.editProfileDetailsBtn.style.display = 'inline-block';

            if (elements.profileTotalMatches) { elements.profileTotalMatches.textContent = totalMatches; removePlaceholders(elements.profileTotalMatches.closest('.placeholder-glow .stat-item')); }
            if (elements.profileWonMatches) { elements.profileWonMatches.textContent = wonMatches; removePlaceholders(elements.profileWonMatches.closest('.placeholder-glow .stat-item')); }
            if (elements.profileTotalEarnings) { elements.profileTotalEarnings.textContent = formatCurrency(totalEarnings); removePlaceholders(elements.profileTotalEarnings.closest('.placeholder-glow .stat-item')); }
            if (elements.earningsTotal) { elements.earningsTotal.textContent = formatCurrency(totalEarnings); removePlaceholders(elements.earningsTotal.closest('.placeholder-glow')); }
            if (elements.earningsReferral) { elements.earningsReferral.textContent = formatCurrency(referralEarnings); removePlaceholders(elements.earningsReferral.closest('.placeholder-glow')); }
    }

    function toggleLoginForm(showLogin) {
        if (!elements.emailLoginForm || !elements.emailSignupForm) return;
        if (resendTimerInterval) clearInterval(resendTimerInterval); 
        elements.emailLoginForm.style.display = showLogin ? 'block' : 'none';
        elements.emailSignupForm.style.display = showLogin ? 'none' : 'block';
        
        if(elements.loginSignupToggleBtn){
            elements.loginSignupToggleBtn.textContent = showLogin ? 'Need an account? Sign Up' : 'Already have an account? Login';
        }

        if (showLogin) {
            clearStatusMessage(elements.signupStatusMessage);
            elements.emailSignupForm.reset();
        } else {
            clearStatusMessage(elements.loginStatusMessage);
            elements.emailLoginForm.reset();
        }
    }

// --- Firebase Auth Functions ---
    async function signUpWithEmail() {
        if (!auth) return;
        const username = elements.signupUsernameInput.value.trim();
        const em = elements.signupEmailInput.value.trim();
        const pw = elements.signupPasswordInput.value;
        const cpw = elements.signupConfirmPasswordInput.value;
        const gameUid = elements.signupUidInput.value.trim();
        const refCode = elements.signupReferralCodeInput.value.trim();

        if (!username || !em || !pw || !cpw || !gameUid) { showStatusMessage(elements.signupStatusMessage, 'Fill all required fields, including In-Game Name & UID.', 'warning'); return; }
        if (pw !== cpw) { showStatusMessage(elements.signupStatusMessage, 'Passwords don\'t match.', 'warning'); return; }
        if (pw.length < 6) { showStatusMessage(elements.signupStatusMessage, 'Password must be at least 6 characters.', 'warning'); return; }
        if (!/^\d+$/.test(gameUid)) { showStatusMessage(elements.signupStatusMessage, 'In-Game UID must be a number.', 'warning'); return; }

        showLoader(true); clearStatusMessage(elements.signupStatusMessage);
        
        try {
            const uidQuery = query(ref(db, 'users'), orderByChild('gameUid'), equalTo(gameUid));
            const uidSnapshot = await get(uidQuery);
            if (uidSnapshot.exists()) {
                showStatusMessage(elements.signupStatusMessage, 'This In-Game UID is already registered.', 'danger');
                showLoader(false);
                return;
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, em, pw);
            const newUser = userCredential.user;

            // Create a temporary profile in 'pending_users'
            const pendingUserProfile = {
                displayName: username,
                email: em,
                gameUid: gameUid,
                referralCode: refCode || null, // Store the code, not the UID yet
                createdAt: serverTimestamp()
            };
            await set(ref(db, 'pending_users/' + newUser.uid), pendingUserProfile);

            // Send verification email and sign out
            await sendEmailVerification(newUser);
            await signOut(auth);

            showStatusMessage(elements.loginStatusMessage, 'Account created! A verification link has been sent to your email. Please verify to complete registration and log in.', 'success', false);
            toggleLoginForm(true);

        } catch (e) {
            console.error("Signup Error:", e); let m = `Signup failed.`; switch (e.code) { case 'auth/email-already-in-use': m = 'Email already registered.'; break; case 'auth/weak-password': m = 'Password too weak.'; break; case 'auth/invalid-email': m = 'Invalid email.'; break; case 'auth/network-request-failed': m = 'Network error.'; break; default: m = `Error: ${e.message}`; } showStatusMessage(elements.signupStatusMessage, m, 'danger');
        } finally {
            showLoader(false);
        }
    }
    
    async function loginWithEmail() {
        if (!auth) return;
        const em = elements.loginEmailInput.value.trim();
        const pw = elements.loginPasswordInput.value;
        if (!em || !pw) { showStatusMessage(elements.loginStatusMessage, 'Enter email & password.', 'warning'); return; }
        
        showLoader(true); 
        clearStatusMessage(elements.loginStatusMessage);

        try {
            // The onAuthStateChanged handler will now manage the verification check and profile creation.
            // We just need to sign in here.
            await signInWithEmailAndPassword(auth, em, pw);
            
        }
        catch (e) { 
            console.error("Login Error:", e);
            let m = `Login failed.`; 
            switch (e.code) { 
                case 'auth/user-not-found': 
                case 'auth/wrong-password': 
                case 'auth/invalid-credential': 
                    m = 'Invalid email or password.'; 
                    break; 
                case 'auth/invalid-email': 
                    m = 'Invalid email format.'; 
                    break; 
                case 'auth/too-many-requests': 
                    m = 'Too many attempts. Reset pass or wait.'; 
                    break; 
                case 'auth/network-request-failed': 
                    m = 'Network error.'; 
                    break; 
                case 'auth/user-disabled': 
                    m = 'Your account has been suspended.'; 
                    break; 
                default: 
                    m = `Error: ${e.message}`; 
            } 
            showStatusMessage(elements.loginStatusMessage, m, 'danger');
            showLoader(false);
        }
    }

    async function signInWithGoogle() {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        showLoader(true);
        clearStatusMessage(elements.loginStatusMessage);
        try {
            // The onAuthStateChanged handler will manage profile creation for new Google users.
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            let m = "Google Sign-In failed.";
            if (error.code === 'auth/popup-closed-by-user') {
                m = "Sign-in window closed before completion.";
            } else if (error.code === 'auth/network-request-failed') {
                m = "Network error. Please check your connection.";
            }
            showStatusMessage(elements.loginStatusMessage, m, 'danger');
            showLoader(false);
        }
    }
    
    async function resetPassword() {
        if (!auth) return;
        const em = elements.loginEmailInput.value.trim();
        if (!em) { showStatusMessage(elements.loginStatusMessage, 'Enter email for password reset.', 'warning'); return; }
        showLoader(true); clearStatusMessage(elements.loginStatusMessage);
        try { await sendPasswordResetEmail(auth, em); showStatusMessage(elements.loginStatusMessage, 'Password reset email sent! Check inbox/spam.', 'success', false); }
        catch (e) { console.error("Reset Pass Error:", e); let m = `Failed to send email.`; switch (e.code) { case 'auth/user-not-found': case 'auth/invalid-email': m = 'Email not found.'; break; case 'auth/network-request-failed': m = 'Network error.'; break; default: m = `Error: ${e.message}`; } showStatusMessage(elements.loginStatusMessage, m, 'danger'); }
        finally { showLoader(false); }
    }
    async function logoutUser() { if (!auth) return; try { showLoader(true); await signOut(auth); showCustomToast("Logged out successfully.", "info");} catch (e) { console.error("Sign Out Error:", e); showCustomToast(`Logout failed: ${e.message}`, 'danger'); showLoader(false); } }

// --- Auth State Change Handler ---
    async function handleAuthStateChange(user) {
        if (!auth || !db) { console.error("Firebase not ready in auth change"); showLoader(false); return; }
        
        showLoader(true); 
        detachAllDbListeners(); 
        
        if (user) {
            await user.reload(); // Always get the latest user state
            // For email/password users, verification is mandatory
            if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
                currentUser = null;
                userProfile = {};
                updateGlobalUI(false);
                showSection('login-section');
                if (elements.loginStatusMessage.style.display === 'none') {
                    let message = `Your email is not verified. Please check your inbox. <br><button id="resendVerificationBtn" class="btn-custom-link btn-sm p-0 mt-2">Resend verification email</button>`;
                    showStatusMessage(elements.loginStatusMessage, message, 'warning', false);
                    const resendBtn = getElement('resendVerificationBtn');
                    if (resendBtn) {
                        resendBtn.onclick = async () => {
                            resendBtn.disabled = true;
                            try {
                                await sendEmailVerification(user);
                                showCustomToast('Verification email resent! Check your inbox.', 'success');
                                let countdown = 30; resendBtn.textContent = `Resend in ${countdown}s`;
                                if(resendTimerInterval) clearInterval(resendTimerInterval);
                                resendTimerInterval = setInterval(() => { countdown--; if(countdown > 0) { resendBtn.textContent = `Resend in ${countdown}s`; } else { clearInterval(resendTimerInterval); resendBtn.textContent = 'Resend verification email'; resendBtn.disabled = false; }}, 1000);
                            } catch (resendError) {
                                console.error("Resend Verification Error:", resendError); showCustomToast('Failed to resend email. Please try again.', 'danger'); resendBtn.disabled = false;
                            }
                        };
                    }
                }
                try { await signOut(auth); } catch(e) {}
                showLoader(false);
                return; 
            }
            
            currentUser = user; // User is verified or a Google user, proceed
            const userRef = ref(db, 'users/' + user.uid);
            
            try {
                const snapshot = await get(userRef);
                
                if (!snapshot.exists()) {
                    // Check for pending email verification user first
                    const pendingUserRef = ref(db, 'pending_users/' + user.uid);
                    const pendingSnapshot = await get(pendingUserRef);
                    let initialProfileData = {};

                    if (pendingSnapshot.exists()) { // Finalizing an email/pass signup
                        initialProfileData = pendingSnapshot.val();
                    } else { // New user (likely via Google)
                        initialProfileData = {
                            displayName: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            photoURL: user.photoURL,
                            gameUid: null // Needs to be set by the user
                        };
                    }

                    let referrerUid = null;
                    if (initialProfileData.referralCode) {
                        const usersRef = ref(db, 'users');
                        const q = query(usersRef, orderByChild('referralCode'), equalTo(initialProfileData.referralCode));
                        const referrerSnapshot = await get(q);
                        if (referrerSnapshot.exists()) {
                            referrerUid = Object.keys(referrerSnapshot.val())[0];
                        }
                    }
                    
                    const newUserProfile = {
                        uid: user.uid,
                        displayName: initialProfileData.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        gameUid: initialProfileData.gameUid || null,
                        winningCash: 0,
                        bonusCash: appSettings.newUserBonus || 0,
                        gameCoins: appSettings.gameCoinOptions?.newUserGameCoins || 0,
                        redeemedOneTimeOffers: {},
                        dailyCheckin: { currentStreak: 0, lastCheckinTimestamp: 0 },
                        taskProgress: {},
                        totalMatches: 0,
                        wonMatches: 0,
                        totalEarnings: 0,
                        referralEarnings: 0,
                        createdAt: serverTimestamp(),
                        referralCode: generateReferralCode(),
                        joinedTournaments: {},
                        isAdmin: false,
                        isBanned: false,
                        purchasedNewsItems: {},
                        likedNews: {},
                        readAnnouncements: {},
                        deletedAnnouncements: {},
                        ...(referrerUid && { referredBy: referrerUid })
                    };
                    
                    await set(userRef, newUserProfile);
                    userProfile = newUserProfile;

                    if (newUserProfile.bonusCash > 0) await recordTransaction(user.uid, 'signup_bonus', newUserProfile.bonusCash, `Welcome Bonus`);
                    if (newUserProfile.gameCoins > 0) await recordCoinTransaction(user.uid, 'signup_coins', newUserProfile.gameCoins, 'Welcome Coins');
                    
                    if (referrerUid) {
                        const referrerRef = ref(db, `users/${referrerUid}`);
                        const pkrBonus = appSettings.referralBonus || 0;
                        const coinBonus = appSettings.referralBonusCoins || 50;

                        await runTransaction(referrerRef, (referrerData) => {
                            if (referrerData) {
                                if(pkrBonus > 0) {
                                    referrerData.bonusCash = (referrerData.bonusCash || 0) + pkrBonus;
                                    referrerData.totalEarnings = (referrerData.totalEarnings || 0) + pkrBonus;
                                    referrerData.referralEarnings = (referrerData.referralEarnings || 0) + pkrBonus;
                                }
                                if(coinBonus > 0) {
                                    referrerData.gameCoins = (referrerData.gameCoins || 0) + coinBonus;
                                }
                            }
                            return referrerData;
                        });
                        
                        if (pkrBonus > 0) await recordTransaction(referrerUid, 'referral_bonus', pkrBonus, `Referral Bonus from ${newUserProfile.displayName}`);
                        if (coinBonus > 0) await recordCoinTransaction(referrerUid, 'referral_bonus_coins', coinBonus, `Referral Coins from ${newUserProfile.displayName}`);
                    }
                    showCustomToast(`Welcome, ${newUserProfile.displayName}! Your account is active.`, 'success');
                    
                    // Clean up pending profile if it existed
                    if (pendingSnapshot.exists()) {
                        await set(pendingUserRef, null);
                    }

                    // If new user and no game UID, prompt them to set it.
                    if (!newUserProfile.gameUid) {
                        setTimeout(() => {
                            showCustomToast("Please set your In-Game Name & UID in your profile.", "info", 5000);
                            openEditProfileModal();
                        }, 1500);
                    }

                } else {
                    userProfile = snapshot.val();
                }

                if (userProfile.isBanned) {
                    await logoutUser();
                    showStatusMessage(elements.loginStatusMessage, "Your account has been suspended. Please contact customer support.", 'danger', false);
                    showLoader(false);
                    return;
                }

                const updates = {};
                if (user.email && !userProfile.email) updates.email = user.email;
                if (user.photoURL && !userProfile.photoURL) updates.photoURL = user.photoURL;
                if (user.displayName && !userProfile.displayName) updates.displayName = user.displayName;
                if (typeof userProfile.gameCoins === 'undefined') updates.gameCoins = appSettings.gameCoinOptions?.newUserGameCoins || 0;
                if (typeof userProfile.balance !== 'undefined') updates.balance = null;
                if (Object.keys(updates).length > 0) {
                    await update(userRef, updates);
                    userProfile = { ...userProfile, ...updates };
                }
                
                populateUserInfo(user, userProfile);
                setupRealtimeListeners(user.uid);
                updateGlobalUI(true);
                const targetSection = (currentSectionId === 'login-section' || currentSectionId === 'deposit-section' || !getElement(currentSectionId)) ? 'home-section' : currentSectionId;
                showSection(targetSection);

            } catch (error) {
                console.error("Profile handling error:", error);
                const errorMsg = "Could not load profile. If you cannot log in, please try resetting your password using 'Forgot Password'.";
                showCustomToast(errorMsg, 'danger', 15000);
                try { await logoutUser(); } catch (logoutErr) {}
            }
        } else {
            currentUser = null; userProfile = {}; updateGlobalUI(false); showSection('login-section');
        }
        showLoader(false);
    }

// --- Database Interaction Functions ---
async function loadAppSettings() {
console.log("Loading App Settings...");
try {
    const settingsRef = ref(db, 'settings');
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
            appSettings = snapshot.val() || {};
            console.log("App Settings Loaded:", appSettings);

            if (appSettings.logoUrl && elements.appLogo) elements.appLogo.src = appSettings.logoUrl;
            if (appSettings.minWithdraw && elements.minWithdrawAmount) elements.minWithdrawAmount.textContent = appSettings.minWithdraw;
            if (!appSettings.gameCoinOptions) {
            appSettings.gameCoinOptions = {
                newUserGameCoins: 50,
                diamondRedemptionTiers: {
                    'tier1': { id: 'tier1', diamonds: 100, costCoins: 950, costPkr: 0, enabled: true, title: "100 Diamonds", description: "Standard 100 diamond pack." },
                    'tier2': { id: 'tier2', diamonds: 50, costPkr: 45, costCoins: 0, enabled: true, title: "50 Diamonds", description: "Standard 50 diamond pack." },
                }
            };
            }
            if (!appSettings.tasks) {
            appSettings.tasks = {
                "task_play_20_min": { "title": "Play for 20 Minutes", "description": "Play any game from the 'Games' section.", "rewardCoins": 25, "type": "play_duration", "goal": 20, "enabled": true }
            }
            }
            if (!appSettings.dailyCheckinRewards) {
            appSettings.dailyCheckinRewards = [5, 5, 5, 10, 5, 5, 15];
            }
            if (typeof appSettings.referralBonus === 'undefined') {
            appSettings.referralBonus = 0;
            }
            if (typeof appSettings.referralBonusCoins === 'undefined') {
            appSettings.referralBonusCoins = 50;
            }
            if (!userProfile.seenTournaments) {
            userProfile.seenTournaments = {};
            }

    } else {
            console.warn("App Settings not found in database! Using defaults.");
            appSettings = {
            minWithdraw: 50, newUserBalance: 0, newUserBonus: 10, referralBonus: 0, referralBonusCoins: 50,
            gameCoinOptions: { newUserGameCoins: 50, diamondRedemptionTiers: { 'tier1': { id: 'tier1', diamonds: 100, costCoins: 950, enabled: true, title: "100 Diamonds", description: "Standard pack." } } },
            tasks: { "task_play_20_min": { "title": "Play for 20 Minutes", "description": "Play any game from the 'Games' section.", "rewardCoins": 25, "type": "play_duration", "goal": 20, "enabled": true } },
            dailyCheckinRewards: [5, 5, 5, 10, 5, 5, 15]
            };
    }
} catch (e) {
    console.error("Settings load failed", e);
        appSettings = {}; 
}
}

function loadHomePageData() {
if (!currentUser) {
        if(elements.promotionSlider?.querySelector('.swiper-wrapper')) elements.promotionSlider.querySelector('.swiper-wrapper').innerHTML = '';
        if(elements.gamesList) elements.gamesList.innerHTML = '';
        if(elements.myContestsList) elements.myContestsList.innerHTML = '<p class="text-secondary text-center">Login to view contests.</p>';
        return;
    }
loadPromotions();
loadGames();
loadMyContests();
}

async function loadPromotions() {
    if (!elements.promotionSlider) return;
    const sliderWrapper = elements.promotionSlider.querySelector('.swiper-wrapper');
    if (!sliderWrapper) return;
    sliderWrapper.classList.add('placeholder-glow');
    sliderWrapper.innerHTML = `<div class="swiper-slide"><span class="placeholder" style="height: 100%; border-radius: 10px; display: block; width: 100%;"></span></div>`;
    try {
        const snapshot = await get(ref(db, 'promotions'));
        const promotions = snapshot.val() || {};
        const activePromotions = Object.values(promotions).filter(p => p.imageUrl);
        removePlaceholders(elements.promotionSlider);
        sliderWrapper.innerHTML = '';
        if (activePromotions.length > 0) {
            elements.promotionSlider.style.display = 'block';
            activePromotions.forEach(promo => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.innerHTML = promo.link ? `<a href="${promo.link}" target="_blank"><img src="${promo.imageUrl}" alt="Promo"></a>` : `<img src="${promo.imageUrl}" alt="Promo">`;
                sliderWrapper.appendChild(slide);
            });
            if (swiperInstance) swiperInstance.destroy(true, true);
            
            swiperInstance = new Swiper(elements.promotionSlider, {
            loop: activePromotions.length > 1, 
            autoplay: { 
                delay: 3000,
                disableOnInteraction: false 
            },
            pagination: { el: '.swiper-pagination', clickable: true },
            slidesPerView: 1.1,
            spaceBetween: 15,
            centeredSlides: true,
            });

        } else {
            elements.promotionSlider.style.display = 'none';
        }
    } catch (e) {
        console.error("Promo load failed:", e);
        removePlaceholders(elements.promotionSlider);
        sliderWrapper.innerHTML = '<p class="text-danger text-center small p-3">Could not load promotions.</p>';
        elements.promotionSlider.style.display = 'block';
    }
}

async function loadGames() {
if (!elements.gamesList) return;
elements.gamesList.classList.add('placeholder-glow');
elements.gamesList.innerHTML = `<div class="col-6"><div class="game-card custom-card"><span class="placeholder d-block" style="height: 130px;"></span><span class="placeholder d-block mt-2 col-8 mx-auto" style="height: 20px;"></span></div></div> <div class="col-6"> <div class="game-card custom-card"><span class="placeholder d-block" style="height: 130px;"></span><span class="placeholder d-block mt-2 col-8 mx-auto" style="height: 20px;"></span></div></div>`;

const homeNavDot = document.querySelector('.nav-item[data-section="home-section"] .notification-dot');
if(homeNavDot) homeNavDot.style.display = 'none';

try {
    const upcomingTournamentsRef = query(ref(db, 'tournaments'), orderByChild('status'), equalTo('upcoming'));
    const tournamentSnapshot = await get(upcomingTournamentsRef);
    const upcomingTournaments = tournamentSnapshot.val() || {};
    const seenTournaments = userProfile.seenTournaments || {};
    let hasUnseenTournament = false;

    const gamesSnapshot = await get(ref(db, 'games'));
    const games = gamesSnapshot.val() || {};
    const activeGames = Object.entries(games).filter(([, game]) => game.imageUrl && game.name).sort(([, gameA], [, gameB]) => (gameA.order || 0) - (gameB.order || 0));
    
    removePlaceholders(elements.gamesList);
    elements.gamesList.innerHTML = '';

    if (activeGames.length > 0) {
        if (!appSettings.games) appSettings.games = {};
        activeGames.forEach(([gameId, game]) => {
            appSettings.games[gameId] = { name: game.name, imageUrl: game.imageUrl };
            const col = document.createElement('div');
            col.className = 'col-6';

            let hasUnseenForThisGame = false;
            Object.entries(upcomingTournaments).forEach(([tId, tData]) => {
                if (tData.gameId === gameId && !seenTournaments[tId]) {
                    hasUnseenForThisGame = true;
                    hasUnseenTournament = true;
                }
            });

            const newBadgeHTML = hasUnseenForThisGame ? '<span class="new-tournament-badge">New</span>' : '';

            col.innerHTML = `<div class="game-card custom-card" data-game-id="${gameId}" data-game-name="${game.name}">${newBadgeHTML}<img src="${game.imageUrl}" alt="${game.name}"><span>${game.name}</span></div>`;
            col.querySelector('.game-card').addEventListener('click', () => {
                currentTournamentGameId = gameId;
                loadTournamentsForGame(gameId, game.name);
            });
            elements.gamesList.appendChild(col);
        });

        if (hasUnseenTournament && homeNavDot) {
            homeNavDot.style.display = 'block';
        }

    } else {
        elements.gamesList.innerHTML = '<p class="text-secondary text-center col-12">No esport games available.</p>';
    }
} catch (e) {
    console.error("Esport Games load failed:", e);
    removePlaceholders(elements.gamesList);
    elements.gamesList.innerHTML = '<p class="text-danger text-center col-12">Could not load esport games.</p>';
}
}


async function loadTournamentsForGame(gameId, gameName) {
    if (!elements.tournamentsSection) return;
    currentTournamentGameId = gameId;
    elements.tournamentTabs.forEach(t => t.classList.remove('active'));
    querySel('.tournament-tabs .tab-item[data-status="upcoming"]')?.classList.add('active');
    showSection('tournaments-section');

    try {
    const tQuery = query(ref(db, 'tournaments'), orderByChild('gameId'), equalTo(gameId));
    const s = await get(tQuery);
    const allT = s.val() || {};
    const updates = {};
    Object.keys(allT).forEach(tId => {
        if (allT[tId].status === 'upcoming' && !userProfile.seenTournaments?.[tId]) {
            updates[tId] = true;
        }
    });
    if (Object.keys(updates).length > 0) {
        await update(ref(db, `users/${currentUser.uid}/seenTournaments`), updates);
    }
    } catch (e) {
    console.error("Failed to mark tournaments as seen:", e);
    }
}

async function filterTournaments(gameId, status) {
if (!elements.tournamentsListContainer) return;
elements.tournamentsListContainer.innerHTML = '';
elements.tournamentsListContainer.classList.add('placeholder-glow');
elements.tournamentsListContainer.innerHTML = `<div class="tournament-card placeholder-glow mb-3"><span class="placeholder col-6"></span><span class="placeholder col-12 mt-2"></span><span class="placeholder col-10 mt-2"></span><div class="d-flex justify-content-between mt-3"><span class="placeholder col-4 h-30"></span><span class="placeholder col-4 h-30"></span></div></div>`;
elements.noTournamentsMessage.style.display = 'none';
try {
    const tQuery = query(ref(db, 'tournaments'), orderByChild('gameId'), equalTo(gameId));
    const s = await get(tQuery);
    const allT = s.val() || {};
    const fT = Object.entries(allT).filter(([, t]) => t.status === status).sort(([, tA], [, tB]) => (tA.startTime || 0) - (tB.startTime || 0));

    removePlaceholders(elements.tournamentsListContainer);
    elements.tournamentsListContainer.innerHTML = '';

    if (fT.length > 0) {
        fT.forEach(([tId, t]) => {
            const card = createTournamentCardElement(tId, t);
            elements.tournamentsListContainer.appendChild(card);
        });
    } else {
        elements.noTournamentsMessage.style.display = 'block';
        elements.noTournamentsMessage.textContent = `No ${status} tournaments found.`;
    }
} catch (e) {
    console.error(`Tournaments filter failed (${status}):`, e);
    removePlaceholders(elements.tournamentsListContainer);
    elements.tournamentsListContainer.innerHTML = '<p class="text-danger tc mt-4">Could not load tournaments.</p>';
    elements.noTournamentsMessage.style.display = 'none';
}
}

function createTournamentCardElement(tId, t) {
    const card = document.createElement('div'); card.className = 'tournament-card'; card.dataset.tournamentId = tId;
    const eFee = t.entryFee || 0;
    const eFeeCoins = t.entryFeeCoins || 0;
    const pkPrize = t.perKillPrize || 0;
    const pkPrizeCoins = t.perKillPrizeCoins || 0;
    const pPool = t.prizePool || 0;
    const pPoolCoins = t.prizePoolCoins || 0;

    const sTime = t.startTime ? new Date(t.startTime) : null; const sTimeLoc = sTime ? sTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBA';
    const regP = t.registeredPlayers || {}; const regC = Object.keys(regP).length; const maxP = t.maxPlayers || 0;

    const spotsL = maxP > 0 ? Math.max(0, maxP - regC) : Infinity; const isF = maxP > 0 && spotsL <= 0;
    const isJ = currentUser && userProfile?.joinedTournaments?.[tId];
    const canJ = !isJ && !isF && t.status === 'upcoming'; let timerTxt = t.status?.toUpperCase() || 'N/A';
    if (t.status === 'upcoming' && sTime) timerTxt = getTimeRemaining(t.startTime); else if (t.status === 'ongoing') timerTxt = 'LIVE'; else if (t.status === 'completed' || t.status === 'result') timerTxt = 'ENDED';
    let spotsTxt = 'Unlimited Spots'; let progP = 0; if (maxP > 0) { spotsTxt = `<span class="${spotsL <= 5 ? 'text-danger' : 'text-accent'}">${spotsL}</span> Spots Left (${regC}/${maxP})`; progP = Math.min(100, (regC / maxP) * 100); }

    let entryFeeDisplay = '';
    if (eFee > 0) entryFeeDisplay = `<strong class="text-info">PKR ${eFee}</strong>`;
    else if (eFeeCoins > 0) entryFeeDisplay = `<strong class="text-coin"><i class="bi bi-coin"></i> ${eFeeCoins}</strong>`;
    else entryFeeDisplay = '<strong>Free</strong>';

    let prizePoolDisplay = '';
    if (pPool > 0) prizePoolDisplay = `<strong><i class="bi bi-trophy-fill text-accent prize-icon"></i> PKR ${pPool}</strong>`;
    else if (pPoolCoins > 0) prizePoolDisplay = `<strong><i class="bi bi-trophy-fill text-coin coin-icon"></i> ${pPoolCoins}</strong>`;
    else prizePoolDisplay = '<strong>Participation</strong>';

    let perKillDisplay = '';
    if (pkPrize > 0) perKillDisplay = `<strong>PKR ${pkPrize}</strong>`;
    else if (pkPrizeCoins > 0) perKillDisplay = `<strong><i class="bi bi-coin"></i> ${pkPrizeCoins}</strong>`;
    else perKillDisplay = '<strong>N/A</strong>';

    let joinBtnHTML = '';
    if (isJ) {
        joinBtnHTML = `<button class="btn btn-custom btn-sm btn-joined" disabled><i class="bi bi-check-circle-fill"></i> Joined</button>`;
    } else if (canJ) {
        let joinButtonText = '';
        if (eFee > 0) joinButtonText = `PKR ${eFee} Join`;
        else if (eFeeCoins > 0) joinButtonText = `<i class="bi bi-coin"></i> ${eFeeCoins} Join`;
        else joinButtonText = 'Join Free';
        joinBtnHTML = `<button class="btn btn-custom btn-sm btn-join" data-tournament-id="${tId}" data-t-name="${t.name}" data-fee-pkr="${eFee}" data-fee-coins="${eFeeCoins}">${joinButtonText} <i class="bi bi-arrow-right-short"></i></button>`;
    } else {
        let disR = t.status !== 'upcoming' ? t.status?.toUpperCase() : (isF ? 'Full' : 'N/A');
        joinBtnHTML = `<button class="btn btn-custom btn-sm btn-disabled" disabled>${disR || 'N/A'}</button>`;
    }

    let idPassBtn = '';
    if (isJ && (t.status === 'ongoing' || (t.status === 'upcoming' && t.showIdPass && sTime && Date.now() > sTime.getTime() - 900000))) {
        idPassBtn = `<button class="btn btn-custom btn-idpass w-100 mt-2 btn-sm" data-tournament-id="${tId}"><i class="bi bi-key-fill"></i> View ID & Pass</button>`;
    }

    card.innerHTML = `
    <div class="tournament-card-header">
        <div class="tournament-card-tags">${t.mode ? `<span>${t.mode}</span>` : ''}${t.map ? `<span>${t.map}</span>` : ''}${t.tags ? (Array.isArray(t.tags) ? t.tags.map(tag => `<span>${tag}</span>`).join('') : Object.values(t.tags).map(tag => `<span>${tag}</span>`).join('')) : ''}</div>
        <div class="tournament-card-timer">${timerTxt}</div>
    </div>
    <h3 class="tournament-card-title">${t.icon ? `<i class="${t.icon}"></i>` : '<i class="bi bi-joystick text-accent"></i>'} ${t.name || 'Tournament'}</h3>
    <p class="small text-secondary mb-2"><i class="bi bi-calendar-event"></i> ${sTimeLoc}</p>
    <div class="tournament-card-info">
        <div class="info-item"><span>Prize Pool</span>${prizePoolDisplay}</div>
        <div class="info-item"><span>Per Kill</span>${perKillDisplay}</div>
        <div class="info-item"><span>Entry Fee</span>${entryFeeDisplay}</div>
    </div>
    <div class="tournament-card-spots">${spotsTxt}${maxP > 0 ? `<div class="progress mt-1" style="height: 6px;"><div class="progress-bar bg-warning" role="progressbar" style="width: ${progP}%"></div></div>` : ''}</div>
    <div class="tournament-card-actions">
        <button class="btn btn-custom btn-custom-secondary btn-sm btn-details" data-tournament-id="${tId}">Details</button>
        <button class="btn btn-custom btn-custom-secondary btn-sm btn-view-players" data-tournament-id="${tId}" data-fee-pkr="${eFee}" data-fee-coins="${eFee}">Players</button>
        ${joinBtnHTML}
    </div>
    ${idPassBtn}`;
    
    card.querySelector('.btn-join')?.addEventListener('click', handleJoinTournamentClick);
    card.querySelector('.btn-details')?.addEventListener('click', handleMatchDetailsClick);
    card.querySelector('.btn-idpass')?.addEventListener('click', handleIdPasswordClick);
    card.querySelector('.btn-view-players')?.addEventListener('click', handleViewPlayersClick);
    return card;
}

async function loadMyContests() {
    if (!currentUser || !elements.myContestsList) { if(elements.myContestsList) removePlaceholders(elements.myContestsList); if(elements.myContestsList) elements.myContestsList.innerHTML = ''; if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'block'; return; }
    const joinedIds = Object.keys(userProfile.joinedTournaments || {});
    elements.myContestsList.classList.add('placeholder-glow');
    elements.myContestsList.innerHTML = `<div class="tournament-card placeholder-glow mb-3"><span class="placeholder col-6"></span><span class="placeholder col-12 mt-2"></span><span class="placeholder col-10 mt-2"></span><div class="d-flex justify-content-between mt-3"><span class="placeholder col-4 h-30"></span><span class="placeholder col-4 h-30"></span></div></div>`;
    if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'none';
    if (joinedIds.length === 0) { removePlaceholders(elements.myContestsList); elements.myContestsList.innerHTML = ''; if (elements.noContestsMessage) elements.noContestsMessage.style.display = 'block'; return; }
    try {
        const contestPromises = joinedIds.map(id => get(ref(db, `tournaments/${id}`)));
        const snapshots = await Promise.all(contestPromises);
        removePlaceholders(elements.myContestsList);
        elements.myContestsList.innerHTML = '';
        const contestCards = [];
        snapshots.forEach((snapshot, index) => {
            if (snapshot.exists()) {
                const t = snapshot.val();
                if (t.status === 'upcoming' || t.status === 'ongoing') {
                    const tId = joinedIds[index];
                    contestCards.push({ startTime: t.startTime || 0, card: createTournamentCardElement(tId, t) });
                }
            }
        });
        contestCards.sort((a, b) => a.startTime - b.startTime);
        if (contestCards.length > 0) {
            contestCards.forEach(item => elements.myContestsList.appendChild(item.card));
        } else if (elements.noContestsMessage) {
            elements.noContestsMessage.style.display = 'block';
            elements.noContestsMessage.textContent = "No upcoming/ongoing joined contests.";
        }
    } catch (e) { console.error("My contests load failed:", e); removePlaceholders(elements.myContestsList); elements.myContestsList.innerHTML = '<p class="text-danger tc">Could not load contests.</p>'; }
}

function loadWalletData() {
    if (!currentUser) return;
    populateUserInfo(currentUser, userProfile);
    loadRecentTransactions();
}
function loadProfileData() {
    if (!currentUser) return;
    populateUserInfo(currentUser, userProfile);
}
function loadEarningsData() {
if (!currentUser) return;
    if (typeof userProfile?.totalEarnings !== 'undefined') removePlaceholders(elements.earningsTotal?.closest('.placeholder-glow'));
    if (typeof userProfile?.referralEarnings !== 'undefined') removePlaceholders(elements.earningsReferral?.closest('.placeholder-glow'));
    loadDailyCheckinData();
    loadTasksData();
}

async function recordTransaction(userId, type, amount, description, details = {}) {
if (!userId) return;
try {
    const payload = { type, amount, description, timestamp: serverTimestamp(), ...details };
    await push(ref(db, `transactions/${userId}`), payload);
    console.log(`PKR Transaction recorded: ${type}, Amount: ${amount}`);
} catch (e) {
    console.error("PKR Transaction record failed:", e);
}
}

async function recordCoinTransaction(userId, type, amount, description, details = {}) {
if (!userId) return;
try {
    await push(ref(db, `coinTransactions/${userId}`), { type, amount, description, timestamp: serverTimestamp(), ...details });
    console.log(`Coin Transaction recorded: ${type}, Amount: ${amount}`);
} catch (e) {
    console.error("Coin Transaction record failed:", e);
}
}


async function loadRecentTransactions() {
    if (!currentUser || !elements.recentTransactionsList) return; const limit = 5;
    elements.recentTransactionsList.innerHTML = ''; elements.recentTransactionsList.classList.add('placeholder-glow');
    for (let i = 0; i < 3; i++) elements.recentTransactionsList.innerHTML += `<div class="custom-card p-2 mb-2 placeholder-glow"><div class="d-flex justify-content-between"><span class="placeholder col-5 h-16"></span><span class="placeholder col-3 h-16"></span></div><div class="small text-secondary mt-1"><span class="placeholder col-6 h-14"></span></div></div>`;
    if (elements.noTransactionsMessage) { elements.noTransactionsMessage.style.display = 'block'; elements.noTransactionsMessage.textContent = 'Loading PKR transactions...'; }
    try {
        const transRef = query(ref(db, `transactions/${currentUser.uid}`), orderByChild('timestamp'), limitToLast(limit));
        const s = await get(transRef);
        const transactions = s.val() || {};
        const sortedT = Object.values(transactions).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        removePlaceholders(elements.recentTransactionsList);
        elements.recentTransactionsList.innerHTML = '';

        if (sortedT.length > 0) {
            if (elements.noTransactionsMessage) elements.noTransactionsMessage.style.display = 'none';
            sortedT.forEach(t => { const item = document.createElement('div'); item.className = 'custom-card p-2 mb-2 d-flex justify-content-between align-items-center'; const isCr = t.amount > 0; const amt = `${isCr ? '+' : ''}PKR ${Math.abs(t.amount || 0).toFixed(2)}`; const time = t.timestamp ? new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'; item.innerHTML = `<div><div class="small fw-bold">${t.description || t.type || 'Txn'}</div><div class="small text-secondary">${time}</div></div><div class="fw-bold ${isCr ? 'text-success' : 'text-danger'}">${amt}</div>`; elements.recentTransactionsList.appendChild(item); });
        } else if (elements.noTransactionsMessage) {
            elements.noTransactionsMessage.style.display = 'block';
            elements.noTransactionsMessage.textContent = 'No recent PKR transactions.';
        }
    } catch (e) { console.error("PKR Transactions load failed:", e); removePlaceholders(elements.recentTransactionsList); elements.recentTransactionsList.innerHTML = '<p class="text-danger tc">Could not load PKR transactions.</p>'; if (elements.noTransactionsMessage) elements.noTransactionsMessage.style.display = 'none'; }
}

function handleJoinTournamentClick(event) {
            if (!currentUser) { showCustomToast("Login to join.", 'info'); showSection('login-section'); return; }
            if (!userProfile.displayName || !userProfile.gameUid) {
                showCustomToast("Please set your In-Game Name and UID in your profile before joining.", 'warning', 5000);
                showSection('profile-section');
                openEditProfileModal();
                return;
            }
    
            const btn = event.currentTarget;
            const tId = btn.dataset.tournamentId;
            const tName = btn.dataset.tName || "this tournament";
            const feePKR = parseFloat(btn.dataset.feePkr || 0);
            const feeCoins = parseFloat(btn.dataset.feeCoins || 0);
    
            if (!tId || !elements.confirmJoinModalInstance) return;
    
        let feeText = 'This is a <strong>Free</strong> tournament.';
        if (feePKR > 0) {
            feeText = `Entry Fee: <strong class="text-info">PKR ${feePKR.toFixed(2)}</strong>`;
        } else if (feeCoins > 0) {
            feeText = `Entry Fee: <strong class="text-coin"><i class="bi bi-coin"></i> ${feeCoins}</strong>`;
        }
    
            elements.confirmJoinModalTitle.textContent = `Join: ${tName}`;
            elements.confirmJoinModalBody.innerHTML = `
            <p class="text-secondary">You are joining with the following details:</p>
            <div class="mb-2"><strong>In-Game Name:</strong> <span class="text-primary">${userProfile.displayName}</span></div>
            <div class="mb-3"><strong>In-Game UID:</strong> <span class="text-primary">${userProfile.gameUid}</span></div>
            <div class="p-3 rounded" style="background-color: var(--primary-bg); border: 1px solid var(--border-color);">${feeText}</div>
            <p class="small text-warning mt-3"><i class="bi bi-exclamation-triangle-fill me-1"></i> Ensure your details are correct. The fee will be deducted from your account.</p>
            `;
        
            elements.confirmJoinModalBtn.dataset.tournamentId = tId;
            elements.confirmJoinModalBtn.dataset.feePkr = feePKR;
            elements.confirmJoinModalBtn.dataset.feeCoins = feeCoins;
            elements.confirmJoinModalBtn.dataset.tName = tName;
    
            elements.confirmJoinModalInstance.show();
    }
    
    async function executeJoinTournament() {
        const btn = elements.confirmJoinModalBtn;
        const tId = btn.dataset.tournamentId;
        const tName = btn.dataset.tName;
        const feePKR = parseFloat(btn.dataset.feePkr || 0);
        const feeCoins = parseFloat(btn.dataset.feeCoins || 0);
    
        if (!currentUser || !tId) return;
    
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Joining...';
        
        const uRef = ref(db, `users/${currentUser.uid}`);
        const tRef = ref(db, `tournaments/${tId}`);
        let transactionResult = null;
    
        try {
                transactionResult = await runTransaction(uRef, (profileData) => {
                    if (!profileData) throw new Error("User profile missing.");

                    if (feePKR > 0) {
                    const totalBalance = (profileData.winningCash || 0) + (profileData.bonusCash || 0);
                    if(totalBalance < feePKR) throw new Error("Insufficient PKR balance.");
                    
                    let remainingFee = feePKR;
                    let bonusDeduction = Math.min(profileData.bonusCash || 0, remainingFee);
                    profileData.bonusCash -= bonusDeduction;
                    remainingFee -= bonusDeduction;

                    if (remainingFee > 0) {
                        profileData.winningCash -= remainingFee;
                    }
                    }

                    if (feeCoins > 0 && (profileData.gameCoins || 0) < feeCoins) throw new Error("Insufficient Game Coin balance.");
                    
                    if (profileData.joinedTournaments?.[tId]) return;
                    
                    if (feeCoins > 0) profileData.gameCoins = (profileData.gameCoins || 0) - feeCoins;

                    if (!profileData.joinedTournaments) profileData.joinedTournaments = {};
                    profileData.joinedTournaments[tId] = true;
                    return profileData;
                });
    
            if (!transactionResult.committed) {
                throw new Error("Join failed. You may have already joined or have insufficient funds.");
            }
    
            const tSnapshot = await get(tRef);
            if (!tSnapshot.exists()) throw new Error("Tournament not found.");
            const tData = tSnapshot.val();
            if (tData.status !== 'upcoming') throw new Error("Tournament is no longer available to join.");
            const rC = tData.registeredPlayers ? Object.keys(tData.registeredPlayers).length : 0;
            if (tData.maxPlayers > 0 && rC >= tData.maxPlayers) throw new Error("Tournament is now full.");
            
            await update(ref(db, `tournaments/${tId}/registeredPlayers/${currentUser.uid}`), {
                joinedAt: serverTimestamp(),
                displayName: userProfile.displayName,
                gameUid: userProfile.gameUid
            });
            
            if (feePKR > 0) await recordTransaction(currentUser.uid, 'tournament_join', -feePKR, `Joined: ${tName}`, { tournamentId: tId });
            if (feeCoins > 0) await recordCoinTransaction(currentUser.uid, 'tournament_join_coins', -feeCoins, `Joined: ${tName}`, { tournamentId: tId });
            
            showCustomToast(`Successfully joined: ${tName}!`, 'success');
            elements.confirmJoinModalInstance.hide();
            
            if (currentSectionId === 'home-section') loadMyContests();
            if (currentSectionId === 'tournaments-section') {
                const activeTab = querySel('.tournament-tabs .tab-item.active')?.dataset.status || 'upcoming';
                filterTournaments(currentTournamentGameId, activeTab);
            }
    
        } catch (e) {
            console.error("Join execution failed:", e);
            showCustomToast(`Failed: ${e.message}`, 'danger', 5000);
                if (transactionResult?.committed) {
                showCustomToast("A critical error occurred after payment. Please contact support.", 'danger', 0);
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Confirm & Join';
        }
    }
    
    
// --- Modal Handlers ---
    function handleWithdrawClick() {
        if (!currentUser || !elements.withdrawModalInstance) return;
        const wc = userProfile.winningCash || 0;
        const minW = appSettings?.minWithdraw || 50;
        elements.minWithdrawAmount.textContent = minW;
        elements.withdrawModalBalance.textContent = `PKR ${wc.toFixed(2)}`;
        elements.withdrawAmountInput.value = '';
        elements.withdrawAmountInput.min = minW;
        elements.withdrawMethodInput.value = userProfile.paymentAccountId || '';
        elements.withdrawPaymentMethodSelect.value = userProfile.paymentMethod || 'EasyPaisa';
        clearStatusMessage(elements.withdrawStatusMessage);
        elements.withdrawModalInstance.show();
    }
    
    async function submitWithdrawRequestHandler() {
        if (!currentUser || !elements.withdrawModalInstance) return;
        const amt = parseFloat(elements.withdrawAmountInput.value);
        const paymentMethod = elements.withdrawPaymentMethodSelect.value;
        const accountNumber = elements.withdrawMethodInput.value.trim();
        const wc = userProfile.winningCash || 0;
        const minW = appSettings?.minWithdraw || 50;
        clearStatusMessage(elements.withdrawStatusMessage);

        if (isNaN(amt) || amt <= 0) { showStatusMessage(elements.withdrawStatusMessage, 'Invalid amount.', 'warning'); return; }
        if (amt < minW) { showStatusMessage(elements.withdrawStatusMessage, `Min withdraw PKR ${minW}.`, 'warning'); return; }
        if (amt > wc) { showStatusMessage(elements.withdrawStatusMessage, 'Insufficient winning balance.', 'warning'); return; }
        if (!accountNumber) { showStatusMessage(elements.withdrawStatusMessage, 'Enter account number.', 'warning'); return; }
        if (!paymentMethod) { showStatusMessage(elements.withdrawStatusMessage, 'Select a payment method.', 'warning'); return; }

        elements.submitWithdrawRequestBtn.disabled = true; elements.submitWithdrawRequestBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
        let transactionCommitted = false;
        
        const feePercentage = 0.05; 
        const fee = amt * feePercentage;
        const netAmount = amt - fee;

        try {
            const uRef = ref(db, `users/${currentUser.uid}`);
            const txResult = await runTransaction(uRef, (prof) => {
                if (prof) {
                    if ((prof.winningCash || 0) >= amt) {
                        prof.winningCash = (prof.winningCash || 0) - amt;
                        return prof;
                    } else { throw new Error("Insufficient winning balance (Tx)."); }
                } else { throw new Error("Profile missing (Tx)."); }
            });

                if (!txResult.committed) {
                    throw new Error("Failed to update balance. Please try again.");
                }
                transactionCommitted = true;

            const newWithdrawalRef = await push(ref(db, 'withdrawals'), {
                userId: currentUser.uid,
                userName: userProfile.displayName || currentUser.email,
                amount: amt,
                fee: fee,
                netAmount: netAmount,
                methodDetails: { methodName: paymentMethod, accountInfo: accountNumber },
                status: 'Pending',
                requestTimestamp: serverTimestamp(),
                userEmail: currentUser.email || 'N/A'
            });

            await recordTransaction(currentUser.uid, 'withdraw_request', -amt, `Withdrawal Request: PKR ${amt}. You will receive PKR ${netAmount.toFixed(2)}.`, { withdrawalId: newWithdrawalRef.key });
            
            // Background Email logic
            sendSilentEmail(currentUser.uid, accountNumber, amt, 'Withdrawal');

            elements.withdrawStatusMessage.innerHTML = `<div class="text-center"><p class="mb-1 text-warning">Please wait while we process your payment request.</p><h3 id="withdrawProcessTimer" class="text-warning">03:00</h3></div>`;
            elements.withdrawStatusMessage.className = `alert custom-alert custom-alert-info mt-3`;
            elements.withdrawStatusMessage.style.display = 'block';

            startProcessingTimer(180, document.getElementById('withdrawProcessTimer'), () => {
                showStatusMessage(elements.withdrawStatusMessage, `Request for PKR ${amt.toFixed(2)} submitted successfully!`, 'success', false);
                setTimeout(() => { 
                    if (elements.withdrawModalInstance) elements.withdrawModalInstance.hide(); 
                    elements.submitWithdrawRequestBtn.disabled = false;
                    elements.submitWithdrawRequestBtn.innerHTML = 'Submit Request';
                }, 3000);
                if (currentSectionId === 'wallet-section') loadRecentTransactions();
            });

        } catch (e) {
            console.error("Withdraw error:", e);
            showStatusMessage(elements.withdrawStatusMessage, `Error: ${e.message}`, 'danger');
            if (transactionCommitted) {
                const uRef = ref(db, `users/${currentUser.uid}`);
                try {
                    await runTransaction(uRef, (prof) => { if (prof) { prof.winningCash = (prof.winningCash || 0) + amt; } return prof; });
                    await recordTransaction(currentUser.uid, 'withdraw_failed_refund', amt, `Refund Failed Withdrawal Request`);
                    showStatusMessage(elements.withdrawStatusMessage, `Error: ${e.message}. Amount refunded.`, 'danger');
                } catch (refundError) {
                    console.error("CRITICAL: FAILED TO REFUND WINNING CASH!", refundError);
                    showStatusMessage(elements.withdrawStatusMessage, `CRITICAL: Failed to refund amount! Contact support.`, 'danger', false);
                }
            }
            elements.submitWithdrawRequestBtn.disabled = false;
            elements.submitWithdrawRequestBtn.innerHTML = 'Submit Request';
        }
    }
    
    async function handleMatchDetailsClick(event) {
        if (!elements.matchDetailsModalInstance) return; const tId = event.currentTarget.dataset.tournamentId; if (!tId) return;
        elements.matchDetailsModalTitle.textContent = 'Loading...'; elements.matchDetailsModalBody.innerHTML = '<div class="tc p-5"><div class="spinner-border spinner-border-sm"></div></div>';
        elements.matchDetailsModalInstance.show();
        try {
            const s = await get(ref(db, `tournaments/${tId}`));
            if (s.exists()) {
                const t = s.val();
                const gName = appSettings.games?.[t.gameId]?.name || t.gameId || 'N/A';
                const sTimeLoc = t.startTime ? new Date(t.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short'}) : 'TBA';
                let pDistHTML = '';
                if (t.prizeDistribution) {
                    let fmtDist = typeof t.prizeDistribution === 'object' ? Object.entries(t.prizeDistribution).map(([rank, prize]) => `Rank ${rank}: PKR ${prize}`).join('\n') : String(t.prizeDistribution).replace(/\\n/g, '\n');
                    pDistHTML = `<h5>Prize Distribution:</h5><pre>${fmtDist}</pre>`;
                } else if (t.prizeDistributionCoins) {
                    let fmtDist = typeof t.prizeDistributionCoins === 'object' ? Object.entries(t.prizeDistributionCoins).map(([rank, prize]) => `Rank ${rank}: ${prize} Coins`).join('\n') : String(t.prizeDistributionCoins).replace(/\\n/g, '\n');
                    pDistHTML = `<h5>Prize Distribution (Coins):</h5><pre>${fmtDist}</pre>`;
                }
                const desc = t.description || 'Standard rules apply.';
                const fmtDesc = desc.replace(/\n/g, '<br>');
            let entryFeeDisplayModal = 'Free';
            if (t.entryFee > 0) entryFeeDisplayModal = `PKR ${t.entryFee}`; else if (t.entryFeeCoins > 0) entryFeeDisplayModal = `${t.entryFeeCoins} Coins`;
            let prizePoolDisplayModal = 'PKR ' + (t.prizePool || 0);
            if (t.prizePoolCoins > 0) prizePoolDisplayModal = `${t.prizePoolCoins} Coins`;
            let perKillDisplayModal = 'PKR ' + (t.perKillPrize || 0);
            if (t.perKillPrizeCoins > 0) perKillDisplayModal = `${t.perKillPrizeCoins} Coins`;

                elements.matchDetailsModalTitle.textContent = t.name || 'Match Details';
                elements.matchDetailsModalBody.innerHTML = `<p><strong>Game:</strong> ${gName}</p><p><strong>Mode:</strong> ${t.mode || 'N/A'}</p><p><strong>Map:</strong> ${t.map || 'N/A'}</p><p><strong>Starts:</strong> ${sTimeLoc}</p><hr><p><strong>Entry:</strong> ${entryFeeDisplayModal}</p><p><strong>Prize:</strong> ${prizePoolDisplayModal}</p><p><strong>Per Kill:</strong> ${perKillDisplayModal}</p><p><strong>Max Players:</strong> ${t.maxPlayers > 0 ? t.maxPlayers : 'Unlimited'}</p><hr><h5>Rules:</h5><div style="white-space: pre-wrap; line-height: 1.6;">${fmtDesc}</div>${pDistHTML}`;
            } else elements.matchDetailsModalBody.innerHTML = '<p class="text-danger">Details not found.</p>';
        } catch (e) { console.error("Details load failed:", e); elements.matchDetailsModalBody.innerHTML = '<p class="text-danger">Error loading details.</p>'; }
    }
    
    async function handleIdPasswordClick(event) {
        if (!elements.idPasswordModalInstance) return;
        const tId = event.currentTarget.dataset.tournamentId;
        if (!tId) return;
        if (!currentUser || !userProfile?.joinedTournaments?.[tId]) { showCustomToast("Join the tournament first or refresh the page.", 'warning'); return; }

        elements.roomIdDisplay.innerHTML = '<span class="placeholder col-6"></span>';
        elements.roomPasswordDisplay.innerHTML = '<span class="placeholder col-6"></span>';
        elements.idPasswordModalInstance.show();
        try {
            const s = await get(ref(db, `tournaments/${tId}`));
            removePlaceholders(elements.roomIdDisplay.closest('.placeholder-glow'));
            removePlaceholders(elements.roomPasswordDisplay.closest('.placeholder-glow'));
            if (s.exists()) {
                const tData = s.val();
                    if (tData.showIdPass) {
                        elements.roomIdDisplay.textContent = tData.roomId || 'Not updated yet';
                        elements.roomPasswordDisplay.textContent = tData.roomPassword || 'Not updated yet';
                    } else {
                        elements.roomIdDisplay.textContent = 'Hidden by Admin';
                        elements.roomPasswordDisplay.textContent = 'Hidden by Admin';
                    }
            } else {
                elements.roomIdDisplay.textContent = 'Not Found';
                elements.roomPasswordDisplay.textContent = 'Not Found';
            }
        } catch (e) {
            console.error("ID/Pass fetch error:", e);
            removePlaceholders(elements.roomIdDisplay.closest('.placeholder-glow')); removePlaceholders(elements.roomPasswordDisplay.closest('.placeholder-glow'));
            elements.roomIdDisplay.textContent = 'Error'; elements.roomPasswordDisplay.textContent = 'Error';
            showCustomToast("Error loading ID/Password. Check permissions or network.", 'danger');
        }
    }
    
    async function handlePolicyClick(event) {
        if (!elements.policyModalInstance) return;
        event.preventDefault();
        const policyType = event.currentTarget.dataset.policy;
        if (!policyType) return;

        let title = '', modalBodyContent = '<div class="text-center p-5"><div class="spinner-border spinner-border-sm"></div></div>';
        elements.policyModalBody.innerHTML = modalBodyContent;

        switch (policyType) {
            case 'privacy': title = 'Privacy Policy'; modalBodyContent = appSettings.policyPrivacy || 'Content not available.'; break;
            case 'terms': title = 'Terms and Conditions'; modalBodyContent = appSettings.policyTerms || 'Content not available.'; break;
            case 'refund': title = 'Refund and Cancellation'; modalBodyContent = appSettings.policyRefund || 'Content not available.'; break;
            case 'fairPlay': title = 'Fair Play Policy'; modalBodyContent = appSettings.policyFairPlay || 'Content not available.'; break;
            case 'refer':
                title = 'Refer & Earn';
                if (!currentUser) { showCustomToast("Login to view referral.", 'info'); return; }
                const refCode = userProfile.referralCode || 'N/A';
                const refBonusPKR = appSettings?.referralBonus || 0;
                const refBonusCoins = appSettings?.referralBonusCoins || 50;
                let refDesc = appSettings?.referralDescription || `Get PKR ${refBonusPKR} and ${refBonusCoins} Coins when your friend joins using your code.`;
                
                modalBodyContent = `<div class="text-center"><h4>Refer Friends!</h4><p class="text-accent h5" id="referralModalCountEl">Loading referral stats...</p><div class="my-4 p-3" style="background: var(--primary-bg); border-radius: 8px;"><p class="small text-secondary mb-1">Your Code:</p><h3 class="text-accent referral-code" id="referralCodeDisplay">${refCode}</h3><div class="mt-3"><button class="btn btn-sm btn-custom btn-custom-secondary me-2 copy-btn" data-target="#referralCodeDisplay"><i class="bi bi-clipboard"></i> Copy Code</button><button class="btn btn-sm btn-custom btn-custom-secondary" id="copyReferralLinkBtn"><i class="bi bi-link-45deg"></i> Copy Link</button></div></div><p class="mt-3 small text-secondary">${refDesc}</p></div>`;
                loadReferralCount(currentUser.uid);
                break;
            default:
                title = 'Info'; modalBodyContent = '<p>Content unavailable.</p>';
        }

        elements.policyModalTitle.textContent = title;
        if (typeof modalBodyContent === 'string' && policyType !== 'refer') {
            elements.policyModalBody.innerHTML = modalBodyContent.replace(/\n/g, '<br>');
        } else {
            elements.policyModalBody.innerHTML = modalBodyContent;
        }
        elements.policyModalInstance.show();
    }
    
// --- HISTORY MODAL IMPLEMENTATION ---
    async function showHistoryModal(historyType) {
        if (!currentUser || !elements.historyModalInstance) return;

        let title = 'History';
        let dbPath = '';
        let noDataMessage = 'No history found.';
        let isEarningsHistory = false;

        switch (historyType) {
            case 'pkr':
                title = 'PKR Transaction History';
                dbPath = `transactions/${currentUser.uid}`;
                noDataMessage = 'No PKR transactions found.';
                break;
            case 'coins':
                title = 'Coin Transaction History';
                dbPath = `coinTransactions/${currentUser.uid}`;
                noDataMessage = 'No coin transactions found.';
                break;
            case 'earnings':
                title = 'Earnings History';
                dbPath = `transactions/${currentUser.uid}`;
                noDataMessage = 'No earnings history found.';
                isEarningsHistory = true;
                break;
            default:
                return;
        }

        elements.historyModalTitle.textContent = title;
        elements.historyModalList.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-accent" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        elements.noHistoryModalMessage.style.display = 'none';
        elements.historyModalInstance.show();

        try {
            const historyQuery = query(ref(db, dbPath), orderByChild('timestamp'));
            const snapshot = await get(historyQuery);
            let historyData = [];

            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const item = child.val();
                    if (isEarningsHistory) {
                        if (item.amount > 0 && (item.type === 'tournament_winnings' || item.type === 'referral_bonus')) {
                            historyData.push(item);
                        }
                    } else {
                        historyData.push(item);
                    }
                });
            }
            
            historyData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 

            elements.historyModalList.innerHTML = '';
            if (historyData.length > 0) {
                historyData.forEach(t => {
                    const item = document.createElement('div');
                    item.className = 'list-group-item d-flex justify-content-between align-items-center';
                    const time = t.timestamp ? new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
                    
                    let amountHtml = '';
                    if(historyType === 'coins') {
                        const isCr = t.amount > 0;
                        amountHtml = `<div class="fw-bold ${isCr ? 'text-success' : 'text-danger'}">${isCr ? '+' : ''}${Math.abs(t.amount || 0)} <i class="bi bi-coin text-coin"></i></div>`;
                    } else { 
                        const isCr = t.amount > 0;
                            amountHtml = `<div class="fw-bold ${isCr ? 'text-success' : 'text-danger'}">${isCr ? '+' : ''}PKR ${Math.abs(t.amount || 0).toFixed(2)}</div>`;
                    }

                    item.innerHTML = `<div><div class="small fw-bold">${t.description || t.type || 'Transaction'}</div><div class="small text-secondary">${time}</div></div>${amountHtml}`;
                    elements.historyModalList.appendChild(item);
                });
            } else {
                elements.noHistoryModalMessage.textContent = noDataMessage;
                elements.noHistoryModalMessage.style.display = 'block';
            }

        } catch (error) {
            console.error(`Error loading ${historyType} history:`, error);
            elements.historyModalList.innerHTML = '';
            elements.noHistoryModalMessage.textContent = `Could not load history. ${error.message}`;
            elements.noHistoryModalMessage.style.display = 'block';
        }
    }
    
    
// --- Deposit Page Functions ---
        function prepareDepositPage() {
            if (!currentUser) { showCustomToast("Please login to deposit amount.", 'info'); showSection('login-section'); return; }
            elements.depositForm.reset();
            clearStatusMessage(elements.depositStatusMessage);
            elements.submitDepositRequestBtn.disabled = false;
            elements.submitDepositRequestBtn.innerHTML = 'Submit Deposit Request';
            if (depositTimerInterval) clearInterval(depositTimerInterval);
            elements.depositTimer.textContent = "03:00";
            elements.depositTimer.style.color = "var(--warning-color)";
        }
    
        async function submitDepositRequestHandler() {
            if (!currentUser) { showCustomToast("Login required.", 'warning'); return; }
    
            const depositType = document.getElementById('depositTypeSelectEl').value;
            const amount = parseFloat(elements.depositAmountInput.value);
            const transactionId = elements.depositTransactionIdInput.value.trim();
            const senderNumber = elements.depositSenderNumberInput.value.trim();
            const senderName = elements.depositSenderNameInput.value.trim();
            clearStatusMessage(elements.depositStatusMessage);
    
            if (isNaN(amount) || amount <= 0) { showStatusMessage(elements.depositStatusMessage, "Please enter a valid amount.", "warning"); return; }
            if (!transactionId) { showStatusMessage(elements.depositStatusMessage, "Please enter the Transaction ID.", "warning"); return; }
            if (!senderNumber) { showStatusMessage(elements.depositStatusMessage, "Please enter your account number.", "warning"); return; }
            if (!senderName) { showStatusMessage(elements.depositStatusMessage, "Please enter your account name.", "warning"); return; }
    
            elements.submitDepositRequestBtn.disabled = true;
            elements.submitDepositRequestBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
            try {
                await push(ref(db, `depositRequests`), {
                    userId: currentUser.uid, userEmail: currentUser.email, displayName: userProfile.displayName || "N/A",
                    amount: amount, transactionId: transactionId, senderNumber: senderNumber, senderName: senderName,
                    paymentMethod: depositType.includes('JazzCash') || depositType === 'Auto Deposit' ? 'JazzCash' : 'EasyPaisa/JazzCash',
                    transactionType: depositType,
                    status: "Pending", 
                    requestTimestamp: serverTimestamp()
                });

                // Silent Email Notification via FormSubmit
                sendSilentEmail(currentUser.uid, senderNumber, amount, depositType);

                // UI Countdown logic
                elements.depositStatusMessage.innerHTML = `<div class="text-center"><p class="mb-1 text-warning">Please wait while we process your payment request.</p><h3 id="depositProcessTimer" class="text-warning">03:00</h3></div>`;
                elements.depositStatusMessage.style.display = 'block';
                elements.depositStatusMessage.className = 'alert custom-alert mt-3 d-block';
                
                startProcessingTimer(180, document.getElementById('depositProcessTimer'), () => {
                    showStatusMessage(elements.depositStatusMessage, "Deposit request submitted successfully! Admin will verify and update your balance.", "success", false);
                    elements.depositForm.reset();
                    setTimeout(() => showSection('wallet-section'), 3000);
                });

            } catch (error) {
                console.error("Error submitting deposit request:", error);
                showStatusMessage(elements.depositStatusMessage, `Error: ${error.message}`, "danger");
                elements.submitDepositRequestBtn.disabled = false;
                elements.submitDepositRequestBtn.innerHTML = 'Submit Deposit Request';
            }
        }
    
// --- History Section Functions ---
        async function loadMatchHistoryData() {
            if (!currentUser || !elements.matchHistoryList) return;
    
            elements.matchHistoryList.classList.add('placeholder-glow');
            elements.matchHistoryList.innerHTML = '';
            for (let i = 0; i < 2; i++) {
                    elements.matchHistoryList.innerHTML += `<div class="tournament-card placeholder-glow mb-3"><div class="d-flex align-items-center mb-2"><span class="placeholder me-2" style="width: 50px; height: 50px; border-radius: 4px;"></span><span class="placeholder col-6" style="height: 20px;"></span></div><span class="placeholder col-12 mt-1" style="height: 16px;"></span><span class="placeholder col-10 mt-1" style="height: 16px;"></span><span class="placeholder col-8 mt-1" style="height: 16px;"></span><div class="d-flex justify-content-end mt-3"><span class="placeholder col-4" style="height: 30px; border-radius: 6px;"></span></div></div>`;
            }
            elements.noMatchHistoryMessage.style.display = 'none';
            try {
                const historyQuery = query(ref(db, 'tournaments'), orderByChild('status'), equalTo('completed'));
                const snapshot = await get(historyQuery);
                const userCompletedTournaments = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const t = childSnapshot.val();
                        if (t.registeredPlayers && t.registeredPlayers[currentUser.uid]) {
                                userCompletedTournaments.push({ id: childSnapshot.key, ...t });
                        }
                    });
                }
                userCompletedTournaments.sort((a,b) => (b.startTime || 0) - (a.startTime || 0));
    
                removePlaceholders(elements.matchHistoryList);
                elements.matchHistoryList.innerHTML = '';
    
                if (userCompletedTournaments.length > 0) {
                    userCompletedTournaments.forEach(tournament => {
                        const card = createMatchHistoryCardElement(tournament.id, tournament);
                        elements.matchHistoryList.appendChild(card);
                    });
                } else {
                    elements.noMatchHistoryMessage.textContent = "No completed match history found for you.";
                    elements.noMatchHistoryMessage.style.display = 'block';
                }
            } catch (error) {
                console.error("Error loading match history:", error);
                removePlaceholders(elements.matchHistoryList);
                elements.matchHistoryList.innerHTML = '<p class="text-danger text-center">Could not load match history.</p>';
            }
        }
    
        function createMatchHistoryCardElement(tournamentId, t) {
            const card = document.createElement('div');
            card.className = 'tournament-card custom-card';
            card.dataset.tournamentId = tournamentId;
            const gameInfo = appSettings.games?.[t.gameId] || { name: 'Unknown Game', imageUrl: 'https://via.placeholder.com/50' };
            const tournamentDate = t.startTime ? new Date(t.startTime).toLocaleDateString() : 'Date N/A';
    
            let topWinnersHtml = '<p class="text-secondary small my-2">Winner data not yet available.</p>';
            let winnersToShow = [];
    
            if (t.results && t.results.allParticipants && Array.isArray(t.results.allParticipants)) {
                winnersToShow = t.results.allParticipants
                    .filter(p => (p.winnings && p.winnings > 0) || (p.winningsCoins && p.winningsCoins > 0))
                    .sort((a, b) => (b.winnings || 0) - (a.winnings || 0) || (b.winningsCoins || 0) - (a.winningsCoins || 0))
                    .slice(0, 3);
            }
    
            if (winnersToShow.length > 0) {
                topWinnersHtml = '<h6 class="mt-2 mb-1 small text-accent">Top Winners:</h6><ul class="top-winners-list">';
                winnersToShow.forEach((winner, index) => {
                    let prizeDisplay = '';
                    if (winner.winnings && winner.winnings > 0) prizeDisplay = `<span class="winner-prize">PKR ${winner.winnings}</span>`;
                    if (winner.winningsCoins && winner.winningsCoins > 0) {
                        if (prizeDisplay) prizeDisplay += ' + ';
                        prizeDisplay += `<span class="winner-prize-coins"><i class="bi bi-coin"></i> ${winner.winningsCoins}</span>`;
                    }
                    topWinnersHtml += `<li><strong>#${index + 1}:</strong> <span class="winner-name">${winner.displayName || 'N/A'}</span> <span class="winner-uid">(UID: ${winner.gameUid || 'N/A'})</span> - ${prizeDisplay || 'N/A'}</li>`;
                });
                topWinnersHtml += '</ul>';
            }
            card.innerHTML = `<div class="d-flex align-items-center mb-2"><img src="${gameInfo.imageUrl || 'https://via.placeholder.com/50'}" alt="${gameInfo.name}" class="game-logo-history"><div><h5 class="mb-0 fs-6 text-primary">${t.name || 'Tournament Name'}</h5><small class="text-secondary">${gameInfo.name} - ${tournamentDate}</small></div></div>${topWinnersHtml}<div class="text-end mt-2"><button class="btn btn-custom btn-custom-secondary btn-sm view-full-results-btn" data-tournament-id="${tournamentId}"><i class="bi bi-list-stars"></i> View Full Results</button></div>`;
            card.querySelector('.view-full-results-btn').addEventListener('click', handleViewFullResultsClick);
            return card;
        }
    
        async function handleViewFullResultsClick(event) {
            const tournamentId = event.currentTarget.dataset.tournamentId;
            if (!tournamentId || !elements.fullResultsModalInstance) return;
    
            elements.fullResultsModalTitle.textContent = 'Loading Results...';
            elements.fullResultsList.innerHTML = '<div class="text-center p-3"><span class="spinner-border spinner-border-sm text-accent"></span></div>';
            elements.noFullResultsMessage.style.display = 'none';
            elements.fullResultsModalInstance.show();
    
            try {
                const snapshot = await get(ref(db, `tournaments/${tournamentId}`));
                if (snapshot.exists()) {
                    const tournamentData = snapshot.val();
                    elements.fullResultsModalTitle.textContent = `Results: ${tournamentData.name || 'Tournament'}`;
                    const participants = tournamentData.results?.allParticipants || [];
                    if (participants.length > 0) {
                        elements.fullResultsList.innerHTML = '';
                        participants.sort((a, b) => (b.winnings || 0) - (a.winnings || 0) || (b.winningsCoins || 0) - (a.winningsCoins || 0));
                        participants.forEach(p => {
                            const item = document.createElement('div');
                            item.className = 'list-group-item';
                            let winningsDisplay = '';
                            if (p.winnings && p.winnings > 0) winningsDisplay = `<span class="player-winnings">PKR ${p.winnings}</span>`;
                            if (p.winningsCoins && p.winningsCoins > 0) {
                                if(winningsDisplay) winningsDisplay += ' + ';
                                winningsDisplay += `<span class="player-winnings-coins"><i class="bi bi-coin"></i> ${p.winningsCoins}</span>`;
                            }
                            if (!winningsDisplay) winningsDisplay = '<span>-</span>';
                            item.innerHTML = `<div class="player-info"><span class="player-name">${p.displayName || 'Unknown Player'}</span><span class="player-uid">UID: ${p.gameUid || 'N/A'}</span></div>${winningsDisplay}`;
                            elements.fullResultsList.appendChild(item);
                        });
                    } else {
                        elements.fullResultsList.innerHTML = '';
                        elements.noFullResultsMessage.textContent = 'No participant results found for this match.';
                        elements.noFullResultsMessage.style.display = 'block';
                    }
                } else {
                    elements.fullResultsModalTitle.textContent = 'Error';
                    elements.fullResultsList.innerHTML = '';
                    elements.noFullResultsMessage.textContent = 'Tournament data not found.';
                    elements.noFullResultsMessage.style.display = 'block';
                }
            } catch (error) {
                console.error("Error loading full results:", error);
                elements.fullResultsModalTitle.textContent = 'Error';
                elements.fullResultsList.innerHTML = '';
                elements.noFullResultsMessage.textContent = 'Could not load results.';
                elements.noFullResultsMessage.style.display = 'block';
            }
        }
    
// --- Edit Profile Modal Logic ---
        function openEditProfileModal() {
            if (!currentUser || !userProfile || !elements.editProfileModalInstance) return;
            elements.editProfileNameInput.value = userProfile.displayName || '';
            elements.editProfileUidInput.value = userProfile.gameUid || '';
            clearStatusMessage(elements.editProfileStatusMessage);
            elements.editProfileUidInput.disabled = !!userProfile.gameUid;
            elements.editProfileModalInstance.show();
        }
        
        async function saveProfileChangesHandler() {
            if (!currentUser || !elements.editProfileModalInstance) return;
            const newDisplayName = elements.editProfileNameInput.value.trim();
            const newGameUid = elements.editProfileUidInput.value.trim();
            const isSettingUidFirstTime = !userProfile.gameUid;
            clearStatusMessage(elements.editProfileStatusMessage);
    
            if (!newDisplayName) { showStatusMessage(elements.editProfileStatusMessage, "In-Game Name cannot be empty.", "warning"); return; }
            if (isSettingUidFirstTime) {
                if (!newGameUid) { showStatusMessage(elements.editProfileStatusMessage, "In-Game UID cannot be empty.", "warning"); return; }
                if (!/^\d+$/.test(newGameUid)) { showStatusMessage(elements.editProfileStatusMessage, "In-Game UID must be a number.", "warning"); return; }
            }
            
            elements.saveProfileChangesBtn.disabled = true;
            elements.saveProfileChangesBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    
            try {
                if (isSettingUidFirstTime) {
                    const uidQuery = query(ref(db, 'users'), orderByChild('gameUid'), equalTo(newGameUid));
                    const uidSnapshot = await get(uidQuery);
                    if (uidSnapshot.exists()) {
                        showStatusMessage(elements.editProfileStatusMessage, "This In-Game UID is already registered by another user.", "danger");
                        elements.saveProfileChangesBtn.disabled = false;
                        elements.saveProfileChangesBtn.innerHTML = 'Save Changes';
                        return;
                    }
                }
    
                const updates = { displayName: newDisplayName };
                if (isSettingUidFirstTime) updates.gameUid = newGameUid;
                await update(ref(db, `users/${currentUser.uid}`), updates);
                
                showStatusMessage(elements.editProfileStatusMessage, "Profile updated successfully!", "success", false);
                setTimeout(() => elements.editProfileModalInstance.hide(), 2000);
            } catch (error) {
                console.error("Error updating profile:", error);
                showStatusMessage(elements.editProfileStatusMessage, `Error: ${error.message}`, "danger");
            } finally {
                elements.saveProfileChangesBtn.disabled = false;
                elements.saveProfileChangesBtn.innerHTML = 'Save Changes';
            }
        }
    
    
// --- HTML Games Section Functions ---
        async function loadHtmlGamesData() {
            if (!currentUser || !elements.htmlGamesList) return;
            elements.htmlGamesList.classList.add('placeholder-glow');
            elements.htmlGamesList.innerHTML = '';
            for (let i = 0; i < 2; i++) {
                elements.htmlGamesList.innerHTML += `<div class="html-game-card placeholder-glow mb-3"><span class="placeholder" style="width: 60px; height: 60px; border-radius: 6px;"></span><div class="html-game-card-info"><span class="placeholder col-6 d-block" style="height: 18px;"></span><span class="placeholder col-10 d-block mt-1" style="height: 14px;"></span></div><div class="html-game-card-action"><span class="placeholder col-12" style="height: 38px; width: 80px; border-radius: 6px;"></span></div></div>`;
            }
            elements.noHtmlGamesMessage.style.display = 'none';
    
            try {
                const snapshot = await get(ref(db, 'htmlGames'));
                const gamesData = snapshot.val() || {};
                const gamesArray = Object.entries(gamesData).filter(([, game]) => game.enabled).sort(([,a],[,b]) => (a.order || 0) - (b.order || 0));
                removePlaceholders(elements.htmlGamesList);
                elements.htmlGamesList.innerHTML = '';
                if (gamesArray.length > 0) {
                    gamesArray.forEach(([gameId, game]) => {
                        const card = document.createElement('div');
                        card.className = 'html-game-card';
                        card.dataset.gameId = gameId; card.dataset.gameName = game.name;
                        card.dataset.gameUrl = game.gameUrl || '';
                        card.dataset.htmlContent = game.htmlContent || '';
                        card.dataset.costCoins = game.costToPlayCoins || 0;
                        
                        let playButtonHtml = '';
                        const cost = game.costToPlayCoins || 0;
                        if (cost > 0) {
                            playButtonHtml = `<button class="btn btn-custom btn-play-game btn-custom-accent"><i class="bi bi-coin"></i> ${cost}</button>`;
                        } else {
                            playButtonHtml = `<button class="btn btn-custom btn-play-game btn-custom-accent">Play</button>`;
                        }
    
                        card.innerHTML = `
                            <img src="${game.iconUrl || 'https://via.placeholder.com/60?text=G'}" alt="${game.name}">
                            <div class="html-game-card-info">
                                <h5>${game.name}</h5>
                                <p>${game.description || 'Play this fun game!'}</p>
                            </div>
                            <div class="html-game-card-action">
                                ${playButtonHtml}
                            </div>`;
                        card.addEventListener('click', handleHtmlGamePlayClick);
                        elements.htmlGamesList.appendChild(card);
                    });
                } else {
                    elements.noHtmlGamesMessage.style.display = 'block';
                }
            } catch (error) {
                console.error("Error loading HTML games:", error);
                removePlaceholders(elements.htmlGamesList);
                elements.htmlGamesList.innerHTML = '<p class="text-danger text-center">Could not load games.</p>';
            }
        }
    
        async function handleHtmlGamePlayClick(event) {
            const card = event.currentTarget;
            const gameId = card.dataset.gameId; const gameName = card.dataset.gameName;
            const gameUrl = card.dataset.gameUrl;
            const htmlContent = card.dataset.htmlContent;
            const costCoins = parseInt(card.dataset.costCoins || 0);
            if (!currentUser) { showCustomToast("Please login to play games.", "info"); showSection('login-section'); return; }
    
            if (costCoins > 0) {
                if ((userProfile.gameCoins || 0) < costCoins) { showCustomToast(`You need ${costCoins} coins to play ${gameName}.`, "warning"); return; }
                if (!confirm(`Playing ${gameName} will cost ${costCoins} coins. Continue?`)) return;
                try {
                    const txResult = await runTransaction(ref(db, `users/${currentUser.uid}`), (p) => {
                        if (p && (p.gameCoins || 0) >= costCoins) { p.gameCoins -= costCoins; return p; } return;
                    });
                    if (!txResult.committed) { showCustomToast("Failed to deduct coins. Try again.", "danger"); return; }
                    await recordCoinTransaction(currentUser.uid, 'game_play_cost', -costCoins, `Played ${gameName}`, { gameId: gameId });
                    showCustomToast(`${costCoins} coins deducted for playing ${gameName}.`, "success");
                } catch (error) { console.error("Error deducting coins:", error); showCustomToast("An error occurred. Please try again.", "danger"); return; }
            }
    
            elements.gameViewModalTitle.textContent = gameName;
            if(gameUrl) {
                elements.gameViewIframe.srcdoc = '';
                elements.gameViewIframe.src = gameUrl;
            } else if (htmlContent) {
                elements.gameViewIframe.src = '';
                elements.gameViewIframe.srcdoc = htmlContent;
            } else {
                showCustomToast("No game content found to load.", "danger");
                return;
            }
            elements.gameViewModalInstance.show();
        }
    
// --- Redeem Diamonds Page Functions (NEW with Dual Currency) ---
        function loadRedeemDiamondsPage() {
            if (!currentUser || !elements.redeemDiamondCardsContainer) return;

            const placeholderHtml = `<div class="col-md-4 col-6"><div class="redeem-card"><div class="placeholder" style="width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 10px auto;"></div><h5 class="placeholder col-8 mx-auto" style="height: 20px;"></h5><p class="placeholder col-10 mx-auto" style="height: 30px;"></p><div class="cost-container placeholder" style="height: 60px;"></div><button class="btn btn-redeem placeholder col-12" style="height: 38px;" disabled></button></div></div>`;
            elements.redeemDiamondCardsContainer.classList.add('placeholder-glow');
            elements.redeemDiamondCardsContainer.innerHTML = placeholderHtml + placeholderHtml;
            elements.noRedeemOptionsMessage.style.display = 'none';
            
            if (elements.redeemSectionCoinBalance) elements.redeemSectionCoinBalance.textContent = Math.floor(userProfile.gameCoins || 0);
            if (elements.redeemSectionPkrBalance) elements.redeemSectionPkrBalance.textContent = ((userProfile.winningCash || 0) + (userProfile.bonusCash || 0)).toFixed(2);
            
            const tiers = Object.values(appSettings.gameCoinOptions?.diamondRedemptionTiers || {});
            const enabledTiers = tiers.filter(tier => tier.enabled);

            removePlaceholders(elements.redeemDiamondCardsContainer);
            elements.redeemDiamondCardsContainer.innerHTML = '';

            if (enabledTiers.length > 0) {
                enabledTiers.forEach(tier => {
                    const card = createRedeemCard(tier);
                    elements.redeemDiamondCardsContainer.appendChild(card);
                });
            } else {
                elements.noRedeemOptionsMessage.style.display = 'block';
            }
        }

        function createRedeemCard(tier) {
            const totalPkrBalance = (userProfile.winningCash || 0) + (userProfile.bonusCash || 0);
            const costPkr = tier.costPkr || 0;
            const costCoins = tier.costCoins || 0;
            const originalCostPkr = tier.originalCostPkr || 0;
        
            const canAffordPkr = costPkr > 0 && totalPkrBalance >= costPkr;
            const canAffordCoins = costCoins > 0 && (userProfile.gameCoins || 0) >= costCoins;
            const isAffordable = (costPkr > 0 && canAffordPkr) || (costCoins > 0 && canAffordCoins) || (costPkr === 0 && costCoins === 0);
        
            const isRedeemed = tier.oneTime && userProfile.redeemedOneTimeOffers?.[tier.id];
            
            const cardCol = document.createElement('div');
            cardCol.className = 'col-md-4 col-6';
            const card = document.createElement('div');
            card.className = 'redeem-card';
            if (isRedeemed) card.classList.add('opacity-50');
        
            let costOptionsHTML = '';
            if (costPkr > 0) {
                let pkrText = `PKR ${costPkr.toFixed(2)}`;
                if (originalCostPkr > costPkr) {
                    pkrText = `<span class="text-strikethrough me-1">PKR ${originalCostPkr.toFixed(2)}</span> ${pkrText}`;
                }
                costOptionsHTML += `<div class="cost-option cost-pkr">${pkrText}</div>`;
            }
            if (costCoins > 0) {
                costOptionsHTML += `<div class="cost-option cost-coins"><i class="bi bi-coin"></i> ${costCoins}</div>`;
            }
            if (costPkr === 0 && costCoins === 0) {
                    costOptionsHTML = `<div class="cost-option">Free</div>`;
            }
            
            card.innerHTML = `
                <i class="bi bi-gem redeem-card-icon"></i>
                <h5>${tier.title || `${tier.diamonds} Diamonds`}</h5>
                <p>${tier.description || `Redeem for your account.`}</p>
                <div class="cost-container">
                    ${costOptionsHTML}
                </div>
                <button class="btn btn-redeem" 
                    data-tier-id="${tier.id}" 
                    ${isRedeemed || !isAffordable ? 'disabled' : ''}>
                    ${isRedeemed ? 'Redeemed' : (isAffordable ? 'Redeem Now' : 'Insufficient Funds')}
                </button>
            `;
            
            if (!isRedeemed && isAffordable) {
                card.querySelector('.btn-redeem').addEventListener('click', handleRedeemDiamondClick);
            }
            cardCol.appendChild(card);
            return cardCol;
        }
    
        async function handleRedeemDiamondClick(event) {
            const btn = event.currentTarget;
            const tierId = btn.dataset.tierId;
            if (!currentUser || !tierId) return;

            const tiersData = appSettings.gameCoinOptions?.diamondRedemptionTiers || {};
            const tier = tiersData[tierId];

            if (!tier) { showCustomToast("Invalid redemption option.", "danger"); return; }
            if (tier.oneTime && userProfile.redeemedOneTimeOffers?.[tierId]) { showCustomToast("One-time offer already redeemed.", "warning"); return; }
            if (!userProfile.gameUid) { showCustomToast("Set your In-Game UID in your profile first.", 'warning', 5000); showSection('profile-section'); openEditProfileModal(); return; }

            const costPkr = tier.costPkr || 0;
            const costCoins = tier.costCoins || 0;
            const totalPkrBalance = (userProfile.winningCash || 0) + (userProfile.bonusCash || 0);
            const totalCoins = userProfile.gameCoins || 0;

            let currencyToUse = null;
            let costToUse = 0;
            
// Prioritize Coins if available as a payment option and affordable
            if (costCoins > 0 && totalCoins >= costCoins) {
                currencyToUse = 'coins';
                costToUse = costCoins;
            } else if (costPkr > 0 && totalPkrBalance >= costPkr) {
                currencyToUse = 'pkr';
                costToUse = costPkr;
            }

            if (!currencyToUse) {
                showCustomToast(`Insufficient funds to redeem.`, "warning");
                return;
            }

            const confirmMsg = `Redeem ${tier.title || tier.diamonds + " Diamonds"} for ${currencyToUse === 'coins' ? costToUse + ' Coins' : 'PKR ' + costToUse.toFixed(2)}? This will be sent to UID: ${userProfile.gameUid}.`;
            if (!confirm(confirmMsg)) return;

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            const userRef = ref(db, `users/${currentUser.uid}`);
            let transactionCommitted = false;
            try {
                const txResult = await runTransaction(userRef, (p) => {
                    if (p) {
                        if (currencyToUse === 'coins') {
                            if ((p.gameCoins || 0) >= costToUse) {
                                p.gameCoins -= costToUse;
                            } else return; // Abort
                        } else { // currency is 'pkr'
                            const currentTotalPkr = (p.winningCash || 0) + (p.bonusCash || 0);
                            if (currentTotalPkr >= costToUse) {
                                let remainingFee = costToUse;
                                let bonusDeduction = Math.min(p.bonusCash || 0, remainingFee);
                                p.bonusCash -= bonusDeduction;
                                remainingFee -= bonusDeduction;
                                if (remainingFee > 0) p.winningCash -= remainingFee;
                            } else return; // Abort
                        }
                        if (tier.oneTime) { if (!p.redeemedOneTimeOffers) p.redeemedOneTimeOffers = {}; p.redeemedOneTimeOffers[tier.id] = true; }
                        return p;
                    }
                    return; // Abort if no profile
                });

                if (!txResult.committed) throw new Error("Failed to update balance. Please try again.");
                transactionCommitted = true;

                const newReqRef = await push(ref(db, 'diamondRedemptionRequests'), {
                    userId: currentUser.uid, userName: userProfile.displayName || currentUser.email, userGameUid: userProfile.gameUid,
                    tierId: tierId, diamondsRequested: tier.diamonds,
                    cost: costToUse, currency: currencyToUse,
                    status: 'pending_fulfillment', requestTimestamp: serverTimestamp()
                });
                
                if (currencyToUse === 'coins') {
                    await recordCoinTransaction(currentUser.uid, 'diamond_redeem', -costToUse, `Redeemed ${tier.title}`, { tierId: tierId, requestId: newReqRef.key });
                } else {
                    await recordTransaction(currentUser.uid, 'diamond_redeem_pkr', -costToUse, `Redeemed ${tier.title}`, { tierId: tierId, requestId: newReqRef.key });
                }

                showCustomToast(`Redemption request submitted!`, 'success');
            } catch (error) {
                console.error("Redemption error:", error);
                showCustomToast(`Error: ${error.message}`, 'danger');
                if (transactionCommitted) {
                    showCustomToast(`CRITICAL: Redemption failed after payment! Contact support.`, 'danger', 0);
                }
            } finally {
                loadRedeemDiamondsPage();
            }
        }
        
// --- Earnings Page Features ---
        function isSameDay(timestamp1, timestamp2) {
            if(!timestamp1 || !timestamp2) return false;
            const d1 = new Date(timestamp1);
            const d2 = new Date(timestamp2);
            return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
        }
    
        function loadDailyCheckinData() {
            if (!currentUser || !elements.dailyCheckinContainer) return;
    
            const dailyRewards = appSettings.dailyCheckinRewards || [];
            if(dailyRewards.length === 0) {
                elements.dailyCheckinContainer.innerHTML = '<p class="text-secondary small text-center w-100">Daily check-in is currently unavailable.</p>';
                return;
            };
    
            const checkinData = userProfile.dailyCheckin || { currentStreak: 0, lastCheckinTimestamp: 0 };
            let currentStreak = checkinData.currentStreak || 0;
            const lastCheckin = checkinData.lastCheckinTimestamp || 0;
            const now = Date.now();
            const yesterday = new Date(now - 86400000);
    
            const hasCheckedInToday = isSameDay(lastCheckin, now);
            if (!hasCheckedInToday && !isSameDay(lastCheckin, yesterday.getTime()) && lastCheckin > 0) {
                currentStreak = 0;
            }
            if (currentStreak >= dailyRewards.length) currentStreak = 0;
    
            elements.dailyCheckinContainer.innerHTML = '';
            removePlaceholders(elements.dailyCheckinContainer);
    
            for (let i = 0; i < dailyRewards.length; i++) {
                const dayIndex = i;
                const dayNum = i + 1;
                const dayEl = document.createElement('div');
                dayEl.className = 'checkin-day';
                dayEl.innerHTML = `<div class="day-label">Day ${dayNum}</div><div class="day-reward"><i class="bi bi-coin"></i> ${dailyRewards[dayIndex]}</div>`;
    
                if (dayIndex < currentStreak) {
                    dayEl.classList.add('claimed');
                    dayEl.innerHTML += `<i class="bi bi-check-circle-fill"></i>`;
                } else if (dayIndex === currentStreak && !hasCheckedInToday) {
                    dayEl.classList.add('active');
                    dayEl.dataset.dayIndex = dayIndex;
                    dayEl.dataset.reward = dailyRewards[dayIndex];
                    dayEl.addEventListener('click', handleDailyCheckin);
                }
                elements.dailyCheckinContainer.appendChild(dayEl);
            }
        }
    
        async function handleDailyCheckin(event) {
            const dayEl = event.currentTarget;
            dayEl.style.pointerEvents = 'none';
            const dayIndex = parseInt(dayEl.dataset.dayIndex);
            const reward = parseInt(dayEl.dataset.reward);
    
            const userRef = ref(db, `users/${currentUser.uid}`);
            try {
                await runTransaction(userRef, (profile) => {
                    if (profile) {
                        profile.gameCoins = (profile.gameCoins || 0) + reward;
                        if(!profile.dailyCheckin) profile.dailyCheckin = {};
                        profile.dailyCheckin.currentStreak = (profile.dailyCheckin.currentStreak || 0) + 1;
                        profile.dailyCheckin.lastCheckinTimestamp = serverTimestamp();
                    }
                    return profile;
                });
                await recordCoinTransaction(currentUser.uid, 'daily_checkin', reward, `Daily Check-in: Day ${dayIndex + 1}`);
                showCustomToast(`You received ${reward} coins! Come back tomorrow.`, 'success');
            } catch (error) {
                console.error("Daily check-in failed:", error);
                showCustomToast("Check-in failed. Please try again.", "danger");
                dayEl.style.pointerEvents = 'auto';
            }
        }
    
        function loadTasksData() {
            if (!currentUser || !elements.dailyTasksContainer) return;
            
            elements.dailyTasksContainer.innerHTML = '';
            removePlaceholders(elements.dailyTasksContainer);
            const tasks = appSettings.tasks || {};
            const enabledTasks = Object.entries(tasks).filter(([, task]) => task.enabled);
            
            if (enabledTasks.length === 0) {
                elements.noTasksMessage.style.display = 'block';
                return;
            }
            elements.noTasksMessage.style.display = 'none';
    
            const todayStr = new Date().toISOString().split('T')[0];
    
            enabledTasks.forEach(([taskId, task]) => {
                const taskProgressData = userProfile.taskProgress?.[taskId] || {};
                const isCompletedToday = taskProgressData.lastCompleted === todayStr;
    
                const card = document.createElement('div');
                card.className = 'task-card';
                
                let progressPercent = 0;
                let canClaim = false;
    
                if (task.type === 'play_duration') {
                    const playTimeData = userProfile.taskProgress?.dailyPlayTime || {};
                    const minutesPlayed = (playTimeData.date === todayStr) ? (playTimeData.minutesPlayed || 0) : 0;
                    progressPercent = Math.min(100, (minutesPlayed / (task.goal || 1)) * 100);
                    canClaim = progressPercent >= 100 && !isCompletedToday;
                } else {
                        canClaim = !isCompletedToday;
                        progressPercent = isCompletedToday ? 100 : 0;
                }
                
                const isGoState = !canClaim && !isCompletedToday;
    
                card.innerHTML = `
                    <div class="task-icon"><i class="bi bi-joystick"></i></div>
                    <div class="task-info">
                        <h5>${task.title}</h5>
                        <p>${task.description}</p>
                        <div class="progress mt-1" style="height: 4px;">
                            <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%" ></div>
                        </div>
                    </div>
                    <div class="task-reward">
                        <span class="reward-amount"><i class="bi bi-coin"></i> +${task.rewardCoins}</span>
                        <button class="btn btn-custom btn-custom-accent btn-sm btn-claim" data-task-id="${taskId}" ${!canClaim ? 'disabled' : ''}>
                            ${isCompletedToday ? 'Completed' : (canClaim ? 'Claim' : 'Go')}
                        </button>
                    </div>
                `;
    
                const claimBtn = card.querySelector('.btn-claim');
                if (claimBtn) {
                    if (isGoState) {
                        claimBtn.disabled = false; // Enable 'Go' button
                        claimBtn.addEventListener('click', () => showSection('games-html-section'));
                    } else if (canClaim) {
                        claimBtn.addEventListener('click', handleClaimTaskReward);
                    }
                }
                elements.dailyTasksContainer.appendChild(card);
            });
        }
    
        async function handleClaimTaskReward(event) {
            const btn = event.currentTarget;
            const taskId = btn.dataset.taskId;
            const task = appSettings.tasks[taskId];
            if (!task || !task.enabled) return;
    
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    
            const userRef = ref(db, `users/${currentUser.uid}`);
            const todayStr = new Date().toISOString().split('T')[0];
            
            try {
                await runTransaction(userRef, (profile) => {
                    if(profile) {
                        if(!profile.taskProgress) profile.taskProgress = {};
                        if(!profile.taskProgress[taskId]) profile.taskProgress[taskId] = {};
                        profile.taskProgress[taskId].lastCompleted = todayStr;
                        profile.gameCoins = (profile.gameCoins || 0) + task.rewardCoins;
                    }
                    return profile;
                });
    
                await recordCoinTransaction(currentUser.uid, 'task_reward', task.rewardCoins, `Task Reward: ${task.title}`);
                showCustomToast(`Task complete! You earned ${task.rewardCoins} coins.`, 'success');
            } catch (error) {
                console.error("Task claim failed:", error);
                showCustomToast("Failed to claim task. Please try again.", "danger");
                btn.disabled = false;
                btn.innerHTML = 'Claim';
            }
        }
    
// --- Game Play Timer Logic ---
        function startGamePlayTimer() {
            if(gamePlayTimer) clearInterval(gamePlayTimer);
            lastUpdateTime = Date.now(); 
            console.log("Starting game play timer.");
            gamePlayTimer = setInterval(updatePlayTime, 30000); 
        }
    
        function stopGamePlayTimer() {
            if(gamePlayTimer) {
                clearInterval(gamePlayTimer);
                gamePlayTimer = null;
                console.log("Stopped game play timer.");
                updatePlayTime(true);
            }
        }
    
        async function updatePlayTime(isFinalUpdate = false) {
            if(!currentUser) { stopGamePlayTimer(); return; }
            
            const now = Date.now();
            const elapsedMinutes = (now - lastUpdateTime) / 60000;
            lastUpdateTime = now; 
    
            if(elapsedMinutes <= 0) return;
    
            const userRef = ref(db, `users/${currentUser.uid}`);
            const todayStr = new Date().toISOString().split('T')[0];
    
            try {
                await runTransaction(userRef, (profile) => {
                    if(profile) {
                        if(!profile.taskProgress) profile.taskProgress = {};
                        if(!profile.taskProgress.dailyPlayTime) profile.taskProgress.dailyPlayTime = { date: 'none', minutesPlayed: 0};
                        
                        let playTime = profile.taskProgress.dailyPlayTime;
                        if(playTime.date !== todayStr) {
                            playTime.date = todayStr;
                            playTime.minutesPlayed = elapsedMinutes;
                        } else {
                            playTime.minutesPlayed = (playTime.minutesPlayed || 0) + elapsedMinutes;
                        }
                    }
                    return profile;
                });
                console.log(`Play time updated in DB by ${elapsedMinutes.toFixed(2)} minutes.`);
                if (isFinalUpdate) {
                    console.log("Final play time update on game close.");
                }
            } catch(error) {
                console.error("Failed to update play time in DB:", error);
            }
        }

// --- UPDATED: News Section Functions (with Comments & Stars) ---
    async function loadNewsData() {
        if (!currentUser || !elements.newsListContainer) return;
        elements.newsListContainer.classList.add('placeholder-glow');
        elements.newsListContainer.innerHTML = `<div class="news-card"><div class="news-image-container"><span class="placeholder d-block w-100 h-100"></span></div><div class="news-content"><h5 class="placeholder col-8"></h5><div class="news-actions"><span class="placeholder col-4" style="height: 32px; border-radius: 20px;"></span></div></div></div>`;
        elements.noNewsMessage.style.display = 'none';

        try {
            const snapshot = await get(ref(db, 'news'));
            const newsItems = snapshot.val() || {};
            const sortedNews = Object.entries(newsItems)
                .filter(([, item]) => item.enabled)
                .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0)); 

            removePlaceholders(elements.newsListContainer);
            elements.newsListContainer.innerHTML = '';

            if (sortedNews.length > 0) {
                sortedNews.forEach(([id, item]) => {
                    const card = createNewsCard(id, item);
                    elements.newsListContainer.appendChild(card);
                });
            } else {
                elements.noNewsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("Error loading news:", error);
            removePlaceholders(elements.newsListContainer);
            elements.newsListContainer.innerHTML = '<p class="text-danger text-center">Could not load news & updates.</p>';
        }
    }

    function createNewsCard(id, item) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.id = `news-card-${id}`;

        const isLiked = userProfile.likedNews && userProfile.likedNews[id];
        const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';

        // Star rating logic
        let starsHtml = '';
        const rating = parseFloat(item.stars) || 0;
        if (rating > 0) {
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHtml += '<i class="bi bi-star-fill"></i>';
                } else if (i - 0.5 <= rating) {
                    starsHtml += '<i class="bi bi-star-half"></i>';
                } else {
                    starsHtml += '<i class="bi bi-star"></i>';
                }
            }
        }
        
        let codeContainerHtml = '';
        if (item.codeOrLink) {
                codeContainerHtml = `
                <div class="news-code-container">
                    <span class="news-code-text" id="news-code-${id}">${item.codeOrLink}</span>
                    <button class="copy-news-code-btn copy-btn" data-target="#news-code-${id}">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </div>`;
        }
        
        const commentCount = item.comments ? Object.keys(item.comments).length : 0;

        card.innerHTML = `
            <div class="news-image-container">
                <img src="${item.imageUrl || ''}" alt="${item.title || 'News Image'}">
            </div>
            <div class="news-content">
                <h5 title="${item.title || 'Untitled'}">${item.title || 'Untitled'}</h5>
                    ${codeContainerHtml}
                <div class="news-actions">
                    <button class="news-action-btn news-like-btn ${isLiked ? 'liked' : ''}" data-news-id="${id}">
                        <i class="bi ${likeIconClass}"></i>
                        <span class="like-count">${item.likes || 0}</span>
                    </button>
                    <button class="news-action-btn news-comment-btn" data-news-id="${id}" data-news-title="${item.title}">
                        <i class="bi bi-chat-dots-fill"></i>
                        <span class="comment-count">${commentCount}</span>
                    </button>
                    <div class="news-stars ms-auto">${starsHtml}</div>
                </div>
            </div>
        `;
        
        card.querySelector('.news-like-btn')?.addEventListener('click', handleLikeNewsItem);
        card.querySelector('.news-comment-btn')?.addEventListener('click', handleCommentClick);
        return card;
    }

    async function handleLikeNewsItem(event) {
        if (!currentUser) { showCustomToast("Login to like posts.", 'info'); return; }
        const btn = event.currentTarget;
        const newsId = btn.dataset.newsId;
        if (!newsId) return;

        btn.disabled = true;

        const userLikesRef = ref(db, `users/${currentUser.uid}/likedNews/${newsId}`);
        const newsItemRef = ref(db, `news/${newsId}`);
        
        try {
            const snapshot = await get(userLikesRef);
            const isCurrentlyLiked = snapshot.exists();

            await runTransaction(newsItemRef, (newsItem) => {
                if (newsItem) {
                    if (isCurrentlyLiked) {
                        newsItem.likes = (newsItem.likes || 1) - 1;
                    } else {
                        newsItem.likes = (newsItem.likes || 0) + 1;
                    }
                }
                return newsItem;
            });
            
            await set(userLikesRef, isCurrentlyLiked ? null : true);

        } catch (error) {
            console.error("Error liking news item:", error);
            showCustomToast("Could not update like. Please try again.", "danger");
        } finally {
            btn.disabled = false;
        }
    }
    
    async function handleCommentClick(event) {
        const btn = event.currentTarget;
        const newsId = btn.dataset.newsId;
        const newsTitle = btn.dataset.newsTitle;
        if (!newsId || !elements.newsCommentsModalInstance) return;

        elements.newsCommentsModalTitle.textContent = `Comments on: ${newsTitle}`;
        elements.commentForm.dataset.newsId = newsId; // Store newsId for submission
        elements.newsCommentsList.innerHTML = `<div class="text-center p-3"><span class="spinner-border spinner-border-sm text-accent"></span></div>`;
        elements.noNewsCommentsMessage.style.display = 'none';
        elements.newsCommentsModalInstance.show();
        
        try {
            const commentsRef = ref(db, `news/${newsId}/comments`);
            const snapshot = await get(query(commentsRef, orderByChild('timestamp')));
            elements.newsCommentsList.innerHTML = '';
            if(snapshot.exists()) {
                const comments = [];
                snapshot.forEach(child => comments.push(child.val()));
                comments.reverse(); // Newest first

                comments.forEach(comment => {
                    const card = document.createElement('div');
                    card.className = 'comment-card';
                    const time = comment.timestamp ? new Date(comment.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'}) : '';
                    card.innerHTML = `
                        <div class="comment-header">
                            <span class="comment-author">${comment.authorName || 'Anonymous'}</span>
                            <span class="comment-time">${time}</span>
                        </div>
                        <p class="comment-body">${comment.text || ''}</p>
                    `;
                    elements.newsCommentsList.appendChild(card);
                });
            } else {
                elements.noNewsCommentsMessage.style.display = 'block';
            }
        } catch (error) {
                console.error("Error loading comments:", error);
                elements.newsCommentsList.innerHTML = '';
                elements.noNewsCommentsMessage.textContent = 'Could not load comments.';
                elements.noNewsCommentsMessage.style.display = 'block';
        }
    }

    async function handlePostComment(event) {
        event.preventDefault();
        if (!currentUser) { showCustomToast("Login to comment.", 'info'); return; }
        
        const newsId = elements.commentForm.dataset.newsId;
        const commentText = elements.commentInput.value.trim();
        if (!newsId || !commentText) return;

        elements.postCommentBtn.disabled = true;
        elements.postCommentBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

        const commentData = {
            authorId: currentUser.uid,
            authorName: userProfile.displayName || 'User',
            text: commentText,
            timestamp: serverTimestamp()
        };

        try {
            const commentsRef = ref(db, `news/${newsId}/comments`);
            await push(commentsRef, commentData);
            elements.commentForm.reset();
            // Refresh comments in the modal
            handleCommentClick({ currentTarget: { dataset: { newsId: newsId, newsTitle: elements.newsCommentsModalTitle.textContent.replace('Comments on: ','') } } });
        } catch (error) {
            console.error("Error posting comment:", error);
            showCustomToast("Failed to post comment. Please try again.", "danger");
        } finally {
            elements.postCommentBtn.disabled = false;
            elements.postCommentBtn.innerHTML = `<i class="bi bi-send-fill"></i>`;
        }
    }
    
// --- Realtime Listeners Setup ---
        function setupRealtimeListeners(uid) {
            if (!uid || !db || !currentUser) return;
            detachAllDbListeners();
            const uRef = ref(db, `users/${uid}`);
            const listFunc = onValue(uRef, (s) => {
                if (currentUser && currentUser.uid === uid) {
                    if (s.exists()) {
                        userProfile = s.val();
                        populateUserInfo(currentUser, userProfile);
                        if (currentSectionId === 'home-section') {
                        loadGames();
                        loadMyContests();
                        }
                        if (currentSectionId === 'wallet-section') loadRecentTransactions();
                        if (currentSectionId === 'history-section') loadMatchHistoryData();
                        if (currentSectionId === 'redeem-diamonds-section') loadRedeemDiamondsPage();
                        if (currentSectionId === 'earnings-section') loadEarningsData();
                        if (currentSectionId === 'news-section') loadNewsData(); // Reload news to reflect like status
                        if (currentSectionId === 'mailbox-section' || currentSectionId === 'profile-section') loadMailboxData();
                    } else {
                        console.warn("User data deleted (realtime) for:", uid);
                        showCustomToast("Account data missing or deleted. Logging out.", 'danger', 5000);
                        logoutUser();
                    }
                } else {
                    off(uRef, 'value', listFunc);
                }
            }, (e) => {
                console.error("Listener error (user profile):", e);
                if (e.message.toLowerCase().includes("permission_denied")) {
                showCustomToast(`Realtime listener error: ${e.message}`, 'danger', 10000);
                }
            });
            dbListeners['userProfile'] = { path: `users/${uid}`, func: listFunc };

            const newsRef = ref(db, 'news');
            const newsListener = onValue(newsRef, (snapshot) => {
            if(currentSectionId === 'news-section' && snapshot.exists()) {
                const newsData = snapshot.val();
                Object.entries(newsData).forEach(([newsId, itemData]) => {
                    const card = getElement(`news-card-${newsId}`);
                    if(card) {
                        const likeCountEl = card.querySelector('.like-count');
                        if(likeCountEl) likeCountEl.textContent = itemData.likes || 0;
                        const commentCountEl = card.querySelector('.comment-count');
                        if(commentCountEl) commentCountEl.textContent = itemData.comments ? Object.keys(itemData.comments).length : 0;
                    }
                });
            }
            });
            dbListeners['news'] = { path: 'news', func: newsListener };
        }
    
        function detachAllDbListeners() {
            console.log("Detaching listeners:", Object.keys(dbListeners));
            if (depositTimerInterval) clearInterval(depositTimerInterval);
            if (resendTimerInterval) clearInterval(resendTimerInterval);
            
            Object.values(dbListeners).forEach(({ path, func }) => {
            try {
                const pathRef = ref(db, path);
                off(pathRef, 'value', func);
            } catch (e) {
                console.error(`Error detaching listener for path: ${path}`, e);
            }
            });
    
            dbListeners = {};
            console.log(`Detached all listeners.`);
        }
    
        async function checkSecurityRules() {
        if (elements.securityWarning) elements.securityWarning.style.display = 'none';
        try {
            await get(ref(db, 'settings'));
        } catch (error) {
            if (error.message.toLowerCase().includes("permission_denied")) {
                if(elements.securityWarning) {
                    elements.securityWarning.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> <strong>Configuration Issue:</strong> Cannot read app settings. Check Firebase Database rules. <button onclick="this.parentElement.style.display='none'">Dismiss</button>`;
                    elements.securityWarning.style.display = 'block';
                }
            }
        }
        }
    
// --- Mailbox, Players, and Chat Functions ---
    
    async function loadMailboxData() {
        if (!currentUser || !elements.mailboxList) return;
        elements.mailboxList.classList.add('placeholder-glow');
        elements.mailboxList.innerHTML = `<div class="custom-card placeholder-glow mb-3"><div class="d-flex justify-content-between mb-2"><span class="placeholder col-6" style="height: 20px;"></span><span class="placeholder col-3" style="height: 16px;"></span></div><span class="placeholder col-12"></span></div>`;
        elements.noMailboxMessage.style.display = 'none';
        
        const profileNavDot = document.querySelector('.nav-item[data-section="profile-section"] .notification-dot');
    
        try {
            const q = query(ref(db, 'announcements'), orderByChild('timestamp'));
            const snapshot = await get(q);
            const messages = [];
            let unreadCount = 0;
            
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const msgData = child.val();
                    const userDeletedData = userProfile.deletedAnnouncements || {};
                    if (!userDeletedData[child.key]) {
                        const isReadByUserData = userProfile.readAnnouncements || {};
                        const isRead = isReadByUserData[child.key];
                        if (!isRead) {
                            unreadCount++;
                        }
                        messages.push({ id: child.key, ...msgData, isRead: isRead });
                    }
                });
            }
            
            messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
            removePlaceholders(elements.mailboxList);
            elements.mailboxList.innerHTML = '';
    
            if (elements.mailboxUnreadIndicator) {
                elements.mailboxUnreadIndicator.style.display = unreadCount > 0 ? 'inline' : 'none';
            }
            if (profileNavDot) {
                profileNavDot.style.display = unreadCount > 0 ? 'block' : 'none';
            }
    
            if (messages.length > 0) {
                const updates = {};
                messages.forEach(msg => {
                    const card = document.createElement('div');
                    card.className = 'custom-card message-card mb-3';
                    card.dataset.mailId = msg.id;
                    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
                    card.innerHTML = `
                        <button class="delete-mail-btn" title="Delete Mail"><i class="bi bi-trash-fill"></i></button>
                        <div class="d-flex justify-content-between align-items-center">
                            <h5>${msg.title || 'Notification'} ${!msg.isRead ? '<span class="unread-indicator"></span>' : ''}</h5>
                            <span class="message-time">${time}</span>
                        </div>
                        <p class="message-body">${msg.body || 'No content.'}</p>
                    `;
                    elements.mailboxList.appendChild(card);
                    if (!msg.isRead) {
                        updates[msg.id] = true;
                    }
                });
                
                if (Object.keys(updates).length > 0 && currentSectionId === 'mailbox-section') {
                    update(ref(db, `users/${currentUser.uid}/readAnnouncements`), updates)
                        .catch(e => console.error(`Failed to mark mail as read:`, e));
                }
    
            } else {
                elements.noMailboxMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("Error loading mailbox:", error);
            removePlaceholders(elements.mailboxList);
            elements.mailboxList.innerHTML = `<p class="text-danger text-center">Could not load messages.</p>`;
            if (profileNavDot) profileNavDot.style.display = 'none';
        }
    }
    
    async function handleDeleteMailClick(mailId) {
        if (!currentUser || !mailId) return;
    
        if (!confirm("Are you sure you want to delete this message? This cannot be undone.")) {
            return;
        }
    
        try {
            const mailDeleteRef = ref(db, `users/${currentUser.uid}/deletedAnnouncements/${mailId}`);
            await set(mailDeleteRef, true);
            
            showCustomToast("Message deleted.", 'info');
            const mailCardEl = document.querySelector(`.message-card[data-mail-id="${mailId}"]`);
            if(mailCardEl) mailCardEl.remove();
    
        } catch (error) {
            console.error("Error deleting mail:", error);
            showCustomToast("Could not delete message.", 'danger');
        }
    }
        
    async function handleViewPlayersClick(event) {
        const btn = event.currentTarget;
        const tournamentId = btn.dataset.tournamentId;
        const feePKR = parseFloat(btn.dataset.feePkr || 0);
        const feeCoins = parseFloat(btn.dataset.feeCoins || 0);
    
        if (!tournamentId || !elements.viewPlayersModalInstance) return;
    
        togglePlayerModalView('players');
        elements.viewPlayersModalTitle.textContent = 'Loading Players...';
        elements.viewPlayersList.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-accent"></div></div>';
        elements.noPlayersMessage.style.display = 'none';
        elements.matchupsList.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-accent"></div></div>';
        elements.noMatchupsMessage.style.display = 'none';

        elements.viewPlayersModalInstance.show();
    
        try {
            const tRef = ref(db, `tournaments/${tournamentId}`);
            const snapshot = await get(tRef);
            if (!snapshot.exists()) throw new Error("Tournament not found.");
            
            const tournamentData = snapshot.val();
            elements.viewPlayersModalTitle.textContent = `Players in: ${tournamentData.name}`;
    
            const registeredPlayersData = tournamentData.registeredPlayers || {};
            const playerList = Object.entries(registeredPlayersData).map(([id, data]) => ({ id, ...data }));
            playerList.sort((a, b) => (b.isWinner ? 1 : 0) - (a.isWinner ? 1 : 0));
            elements.viewPlayersList.innerHTML = '';
            if (playerList.length > 0) {
                playerList.forEach(player => {
                    const item = document.createElement('div');
                    item.className = 'list-group-item';
                    let kickButton = (userProfile.isAdmin && !player.isWinner) ? `<button class="btn btn-sm btn-kick-player" data-tournament-id="${tournamentId}" data-player-uid="${player.id}" data-player-name="${player.displayName}" data-fee-pkr="${feePKR}" data-fee-coins="${feeCoins}"><i class="bi bi-x-circle-fill"></i> Kick</button>` : '';
                    let winnerBadge = player.isWinner ? `<span class="winner-badge ms-auto"><i class="bi bi-trophy-fill"></i> Winner</span>` : '';
                    item.innerHTML = `<div class="player-info"><div><span class="player-name">${player.displayName || 'N/A'}</span><span class="player-uid">UID: ${player.gameUid || 'N/A'}</span></div></div>${winnerBadge}${kickButton}`;
                    elements.viewPlayersList.appendChild(item);
                });
            } else {
                elements.noPlayersMessage.style.display = 'block';
            }

            const matchupsData = tournamentData.matchups || {};
            const matchupList = Object.values(matchupsData);
            elements.matchupsList.innerHTML = '';
            if (matchupList.length > 0) {
                const allPlayersInfo = playerList.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

                matchupList.forEach(match => {
                    const player1 = allPlayersInfo[match.p1_uid];
                    const player2 = allPlayersInfo[match.p2_uid];
                    if (!player1 || !player2) return;

                    const getStatusIcon = (status) => {
                        if (status === 'win') return `<span class="matchup-player-status"><i class="bi bi-check-circle-fill text-success"></i></span>`;
                        if (status === 'loss') return `<span class="matchup-player-status"><i class="bi bi-x-circle-fill text-danger"></i></span>`;
                        return '';
                    }

                    const card = document.createElement('div');
                    card.className = 'matchup-card';
                    card.innerHTML = `
                        <div class="matchup-player">
                            ${getStatusIcon(match.p1_status)}
                            <div class="matchup-player-info">
                                <div class="matchup-player-name">${player1.displayName}</div>
                                <div class="matchup-player-uid">UID: ${player1.gameUid}</div>
                            </div>
                        </div>
                        <div class="matchup-vs">VS</div>
                        <div class="matchup-player text-end">
                            <div class="matchup-player-info">
                                <div class="matchup-player-name">${player2.displayName}</div>
                                <div class="matchup-player-uid">UID: ${player2.gameUid}</div>
                            </div>
                            ${getStatusIcon(match.p2_status)}
                        </div>
                    `;
                    elements.matchupsList.appendChild(card);
                });
            } 
            if (elements.matchupsList.children.length === 0) {
                elements.noMatchupsMessage.style.display = 'block';
            }

        } catch (error) {
            console.error("Error loading players/matchups:", error);
            elements.viewPlayersList.innerHTML = '';
            elements.matchupsList.innerHTML = '';
            elements.noPlayersMessage.textContent = 'Could not load player list.';
            elements.noPlayersMessage.style.display = 'block';
            elements.noMatchupsMessage.textContent = 'Could not load matchups.';
            elements.noMatchupsMessage.style.display = 'block';
        }
    }

    function togglePlayerModalView(view) {
        const isPlayersView = view === 'players';
        elements.togglePlayersViewBtn.classList.toggle('active', isPlayersView);
        elements.toggleMatchupsViewBtn.classList.toggle('active', !isPlayersView);
        elements.viewPlayersListContainer.style.display = isPlayersView ? 'block' : 'none';
        elements.viewMatchupsListContainer.style.display = isPlayersView ? 'none' : 'block';
    }
    
    async function handleKickPlayerClick(event) {
        if (!userProfile.isAdmin) return;
    
        const btn = event.currentTarget;
        const tournamentId = btn.dataset.tournamentId;
        const playerUid = btn.dataset.playerUid;
        const playerName = btn.dataset.playerName;
        const feePKR = parseFloat(btn.dataset.feePkr || 0);
        const feeCoins = parseFloat(btn.dataset.feeCoins || 0);
    
        if (!confirm(`Are you sure you want to kick ${playerName} (UID: ${playerUid}) from this tournament? Their entry fee will be refunded.`)) {
            return;
        }
    
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
    
        try {
            const tournamentPlayerRef = ref(db, `tournaments/${tournamentId}/registeredPlayers/${playerUid}`);
            await set(tournamentPlayerRef, null);
    
            const userTournamentRef = ref(db, `users/${playerUid}/joinedTournaments/${tournamentId}`);
            await set(userTournamentRef, null);
    
            if (feePKR > 0 || feeCoins > 0) {
                const kickedUserRef = ref(db, `users/${playerUid}`);
                await runTransaction(kickedUserRef, (profile) => {
                    if(profile) {
                        if (feePKR > 0) profile.bonusCash = (profile.bonusCash || 0) + feePKR;
                        if (feeCoins > 0) profile.gameCoins = (profile.gameCoins || 0) + feeCoins;
                    }
                    return profile;
                });
                if(feePKR > 0) await recordTransaction(playerUid, 'admin_kick_refund', feePKR, `Refund: Kicked from tournament`);
                if(feeCoins > 0) await recordCoinTransaction(playerUid, 'admin_kick_refund_coins', feeCoins, `Refund: Kicked from tournament`);
            }
    
            showCustomToast(`${playerName} has been kicked and refunded.`, 'success');
            
            btn.closest('.list-group-item').remove();
            if(elements.viewPlayersList.children.length === 0) {
                    elements.noPlayersMessage.style.display = 'block';
            }
    
        } catch (error) {
            console.error("Error kicking player:", error);
            showCustomToast(`Failed to kick player: ${error.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-x-circle-fill"></i> Kick`;
        }
    }
    
// --- Event Listeners Initialization ---
        function initializeEventListeners() {
            if (!elements) return;
            elements.bottomNavItems?.forEach(item => item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            showSection(sectionId);
            }));
    
            elements.profileLinksWithSection?.forEach(link => link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if(sectionId) showSection(sectionId);
            }));
    
            elements.headerBackBtn?.addEventListener('click', () => {
            if (['deposit-section', 'redeem-diamonds-section'].includes(currentSectionId)) { showSection('wallet-section'); }
            else if (['mailbox-section', 'history-section'].includes(currentSectionId)) { showSection('profile-section'); }
            else if (currentSectionId === 'tournaments-section') { showSection('home-section'); }
            else { showSection('home-section'); }
            });
    
            elements.tournamentTabs?.forEach(tab => tab.addEventListener('click', (e) => { const s = e.currentTarget.dataset.status; if (currentTournamentGameId && s) { elements.tournamentTabs.forEach(t => t.classList.remove('active')); e.currentTarget.classList.add('active'); filterTournaments(currentTournamentGameId, s); } }));
    
            elements.loginEmailBtn?.addEventListener('click', loginWithEmail);
            elements.signupEmailBtn?.addEventListener('click', signUpWithEmail);
            elements.googleSignInBtn?.addEventListener('click', signInWithGoogle);
            elements.loginSignupToggleBtn?.addEventListener('click', () => toggleLoginForm(elements.emailSignupForm.style.display === 'block'));
            elements.forgotPasswordLink?.addEventListener('click', (e) => { e.preventDefault(); resetPassword(); });
    
            elements.logoutProfileBtn?.addEventListener('click', logoutUser);
            elements.editProfileDetailsBtn?.addEventListener('click', openEditProfileModal);
            elements.saveProfileChangesBtn?.addEventListener('click', saveProfileChangesHandler);
            elements.policyLinks?.forEach(link => link.addEventListener('click', handlePolicyClick));
            elements.notificationSwitch?.addEventListener('change', (e) => { console.log("Notification toggle:", e.target.checked); });
            
            elements.confirmJoinModalBtn?.addEventListener('click', executeJoinTournament);
            
            if (elements.gameViewModalInstance) {
            getElement('gameViewModalEl').addEventListener('show.bs.modal', startGamePlayTimer);
            getElement('gameViewModalEl').addEventListener('hide.bs.modal', stopGamePlayTimer);
            }
    
            elements.withdrawBtn?.addEventListener('click', handleWithdrawClick);
            elements.addAmountWalletBtn?.addEventListener('click', () => {
            if (currentUser) { showSection('deposit-section', true); } else { showCustomToast("Login first to add amount.", 'info'); showSection('login-section'); }
            });
            elements.redeemDiamondsWalletBtn?.addEventListener('click', () => {
            if(currentUser) { showSection('redeem-diamonds-section', true); } else { showCustomToast("Login first to redeem diamonds.", 'info'); showSection('login-section'); }
            });
            elements.submitWithdrawRequestBtn?.addEventListener('click', submitWithdrawRequestHandler);
        elements.submitDepositRequestBtn?.addEventListener('click', submitDepositRequestHandler);
        elements.cancelDepositBtn?.addEventListener('click', () => { if (depositTimerInterval) clearInterval(depositTimerInterval); showSection('wallet-section'); });
    
            elements.allTransactionsBtn?.addEventListener('click', () => showHistoryModal('pkr'));
            elements.coinHistoryBtn?.addEventListener('click', () => showHistoryModal('coins'));
            elements.viewEarningsHistoryBtn?.addEventListener('click', () => showHistoryModal('earnings'));
            
            elements.togglePlayersViewBtn?.addEventListener('click', () => togglePlayerModalView('players'));
            elements.toggleMatchupsViewBtn?.addEventListener('click', () => togglePlayerModalView('matchups'));

            elements.commentForm?.addEventListener('submit', handlePostComment);

            document.body.addEventListener('click', (event) => {
            const copyBtn = event.target.closest('.copy-btn');
            const copyLinkBtn = event.target.closest('#copyReferralLinkBtn');
            const kickPlayerBtn = event.target.closest('.btn-kick-player');
            const deleteMailBtn = event.target.closest('.delete-mail-btn');
    
            if (copyBtn) {
                const targetSelector = copyBtn.dataset.target;
                const targetElement = document.querySelector(targetSelector);
                if (targetElement) {
                    const text = targetElement.textContent.trim();
                        if (text && text !== 'N/A' && !text.includes('placeholder')) {
                        copyToClipboard(text, 'Copied!');
                        } else {
                        showCustomToast('Nothing to copy.', 'info');
                        }
                }
            } else if (copyLinkBtn) {
                const codeElement = getElement('referralCodeDisplay');
                if (codeElement) {
                    const refCode = codeElement.textContent.trim();
                    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${refCode}`;
                    copyToClipboard(referralLink, 'Referral link copied!');
                }
            } else if (kickPlayerBtn) {
                handleKickPlayerClick(event);
            } else if (deleteMailBtn) {
                const mailCard = deleteMailBtn.closest('.message-card');
                if (mailCard && mailCard.dataset.mailId) {
                    handleDeleteMailClick(mailCard.dataset.mailId);
                }
            }
            });
        }
    
// --- App Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof initializeApp !== 'function') return;
            initFirebaseAndApp();
        });
        
// --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }