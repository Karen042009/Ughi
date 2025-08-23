// /ughi_sqlalchemy_mvp/app/static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- i18n ---
    const i18n = {
        hy: {
            tagline: 'Ձեր ուղեցույցը անվտանգ և վստահելի ճանապարհորդության համար Հայաստանում։',
            searchPlaceholder: 'Որոնել ըստ անվան կամ տեսակի...',
            welcomeTitle: 'Բարի գալուստ Ուղի',
            welcomeDesc: 'Քարտեզի վրա կամ ցանկից ընտրեք վայր՝ տեսնելու անվտանգության մանրամասներն ու կարծիքները։',
            leaveReview: 'Թողնել կարծիք',
            submitReview: 'Ուղարկել կարծիքը',
            loading: 'Բեռնվում է...',
            noReviews: 'Դեռ կարծիքներ չկան։ Եղեք առաջինը։',
            avgLabel: 'Միջին գնահատական՝',
            ratingLabel: 'Ձեր գնահատականը՝',
            commentLabel: 'Ձեր մեկնաբանությունը՝',
            iamLabel: 'Ես՝',
            tourist: 'Շրջաշրջիկ',
            employee: 'Աշխատակից',
            reviewsTitle: 'Կարծիքներ',
            reviewCount: 'կարծիք',
            errorLoad: 'Տեղանքը բեռնել չհաջողվեց։ Կրկնեք ավելի ուշ։',
            errorReviews: 'Կարծիքները բեռնել չհաջողվեց։',
            selectRating: 'Խնդրում ենք ընտրել գնահատական։',
            errorSubmit: 'Չհաջողվեց ուղարկել'
        },
        en: {
            tagline: 'Your guide to a safe and trusted journey in Armenia.',
            searchPlaceholder: 'Search by name or type...',
            welcomeTitle: 'Welcome to Ughi',
            welcomeDesc: 'Select a place on the map or from the list to see safety details and reviews.',
            leaveReview: 'Leave a Review',
            submitReview: 'Submit Review',
            loading: 'Loading...',
            noReviews: 'No reviews yet. Be the first!',
            avgLabel: 'Average rating:',
            ratingLabel: 'Your Rating:',
            commentLabel: 'Your Comment:',
            iamLabel: 'I am a:',
            tourist: 'Tourist',
            employee: 'Employee',
            reviewsTitle: 'Reviews',
            reviewCount: 'review(s)',
            errorLoad: 'Failed to load locations. Please try again later.',
            errorReviews: 'Could not load reviews.',
            selectRating: 'Please select a rating.',
            errorSubmit: 'Failed to submit'
        },
        ru: {
            tagline: 'Ваш гид по безопасному и надежному путешествию в Армении.',
            searchPlaceholder: 'Искать по названию или типу...',
            welcomeTitle: 'Добро пожаловать в Ughi',
            welcomeDesc: 'Выберите место на карте или из списка, чтобы увидеть детали и отзывы.',
            leaveReview: 'Оставить отзыв',
            submitReview: 'Отправить отзыв',
            loading: 'Загрузка...',
            noReviews: 'Отзывов пока нет. Будьте первым!',
            avgLabel: 'Средняя оценка:',
            ratingLabel: 'Ваша оценка:',
            commentLabel: 'Ваш комментарий:',
            iamLabel: 'Я:',
            tourist: 'Турист',
            employee: 'Сотрудник',
            reviewsTitle: 'Отзывы',
            reviewCount: 'отзыв(ов)',
            errorLoad: 'Не удалось загрузить места. Попробуйте позже.',
            errorReviews: 'Не удалось загрузить отзывы.',
            selectRating: 'Пожалуйста, выберите оценку.',
            errorSubmit: 'Не удалось отправить'
        }
    };
    let currentLang = 'hy';

    // --- State ---
    let businesses = [];
    const markers = {}; // id -> marker
    const businessStats = {}; // id -> { avg_rating, review_count }

    // --- DOM Elements ---
    const tagline = document.getElementById('tagline');
    const welcomeTitle = document.getElementById('welcome-title');
    const welcomeDesc = document.getElementById('welcome-desc');
    const langSelect = document.getElementById('lang-select');
    const sidebarContent = document.getElementById('sidebar-content');
    const searchInput = document.getElementById('search');
    const businessList = document.getElementById('business-list');

    // --- Map Initialization ---
    const map = L.map('map').setView([40.1792, 44.4991], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

    // --- Modal Elements & Logic ---
    const modal = document.getElementById('review-modal');
    const closeModalBtn = modal.querySelector('.close-button');
    const reviewForm = document.getElementById('review-form');
    const businessIdInput = document.getElementById('business-id');
    const modalBusinessName = document.getElementById('modal-business-name');
    const modalTitle = document.getElementById('modal-title');
    const ratingLabel = document.getElementById('rating-label');
    const commentLabel = document.getElementById('comment-label');
    const iamLabel = document.getElementById('iam-label');
    const submitBtn = document.getElementById('submit-btn');

    const openModal = () => modal.classList.remove('hidden');
    const closeModal = () => modal.classList.add('hidden');

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // --- Helper Functions ---
    const t = (key) => i18n[currentLang][key] || key;
    const renderStars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    function applyTranslations() {
        document.documentElement.lang = currentLang;
        tagline.textContent = t('tagline');
        searchInput.placeholder = t('searchPlaceholder');

        // Check if welcome screen is visible
        const welcomeTitleEl = document.getElementById('welcome-title');
        if (welcomeTitleEl) {
            welcomeTitleEl.textContent = t('welcomeTitle');
            document.getElementById('welcome-desc').textContent = t('welcomeDesc');
        }

        modalTitle.textContent = t('leaveReview');
        ratingLabel.textContent = t('ratingLabel');
        commentLabel.textContent = t('commentLabel');
        iamLabel.textContent = t('iamLabel');
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${t('submitReview')}`;
        
        const openBtn = document.getElementById('open-review-modal');
        if (openBtn) {
            openBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> ${t('leaveReview')}`;
        }
        
        renderBusinessList(searchInput.value);
        
        const currentBusinessId = businessIdInput.value;
        if(currentBusinessId){
            const business = businesses.find(b => b.id == currentBusinessId);
            if(business) handleMarkerClick(business);
        }
    }

    langSelect.addEventListener('change', () => {
        currentLang = langSelect.value;
        applyTranslations();
    });

    function renderBusinessList(filterText = '') {
        const q = filterText.trim().toLowerCase();
        const filtered = businesses.filter(b => b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
        businessList.innerHTML = filtered.map(b => {
            const stats = businessStats[b.id] || { avg_rating: 0, review_count: 0 };
            return `
            <li class="business-item" data-id="${b.id}">
                <div class="business-title">${b.name}</div>
                <div class="business-sub">${b.type}</div>
                <div class="business-rating">${renderStars(stats.avg_rating)} <span class="count">(${stats.review_count})</span></div>
            </li>`;
        }).join('');

        businessList.querySelectorAll('.business-item').forEach(li => {
            li.addEventListener('click', () => {
                const business = businesses.find(x => x.id === parseInt(li.dataset.id));
                if (!business) return;
                map.setView([business.latitude, business.longitude], 14);
                markers[business.id]?.openPopup();
                handleMarkerClick(business);
            });
        });
    }

    async function loadBusinesses() {
        try {
            const response = await fetch('/api/businesses');
            const data = await response.json();
            businesses = data;
            data.forEach(business => {
                businessStats[business.id] = { avg_rating: business.avg_rating, review_count: business.review_count };
                const marker = L.marker([business.latitude, business.longitude]).addTo(map);
                marker.bindPopup(`<b>${business.name}</b><br>${business.type}`);
                marker.on('click', () => handleMarkerClick(business));
                markers[business.id] = marker;
            });
            renderBusinessList('');
        } catch (error) {
            console.error('Failed to load businesses:', error);
            sidebarContent.innerHTML = `<p>${t('errorLoad')}</p>`;
        }
    }

    async function handleMarkerClick(business) {
        businessIdInput.value = business.id;
        modalBusinessName.textContent = business.name;

        const stats = businessStats[business.id];

        sidebarContent.innerHTML = `
            <h2>${business.name}</h2>
            <p class="location-type">${business.type}</p>
            <div class="rating-summary">
                <div class="avg-rating-text"><strong>${t('avgLabel')}</strong> ${stats.avg_rating.toFixed(2)} / 5</div>
                <div class="review-rating">${renderStars(stats.avg_rating)}</div>
                <div class="review-meta"><span>${stats.review_count} ${t('reviewCount')}</span></div>
            </div>
            <button id="open-review-modal"><i class="fa-solid fa-pen-to-square"></i> ${t('leaveReview')}</button>
            <div id="reviews-container">
                <h3>${t('reviewsTitle')}</h3>
                <div id="reviews-list">${t('loading')}</div>
            </div>`;

        document.getElementById('open-review-modal').addEventListener('click', () => {
            reviewForm.reset();
            // Clear radio button selection visually
            const checkedStar = document.querySelector('.rating-stars input:checked');
            if (checkedStar) checkedStar.checked = false;
            openModal();
        });

        try {
            const response = await fetch(`/api/reviews/${business.id}`);
            const reviews = await response.json();
            displayReviews(reviews);
        } catch (error) {
            document.getElementById('reviews-list').innerHTML = `<p>${t('errorReviews')}</p>`;
        }
    }

    function displayReviews(reviews) {
        const reviewsList = document.getElementById('reviews-list');
        if (reviews.length === 0) {
            reviewsList.innerHTML = `<p>${t('noReviews')}</p>`;
            return;
        }
        reviewsList.innerHTML = reviews.map(review => {
            const authorTypeClass = review.author_type.toLowerCase();
            const authorTypeText = t(authorTypeClass);
            return `
            <div class="review-item">
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p>${review.comment}</p>
                <div class="review-meta">
                    <span class="author-badge ${authorTypeClass}">${authorTypeText}</span>
                    <span>${new Date(review.created_at).toLocaleDateString()}</span>
                </div>
            </div>`;
        }).join('');
    }

    async function handleReviewSubmit(event) {
        event.preventDefault();
        const formData = new FormData(reviewForm);
        const rating = formData.get('rating');
        if (!rating) { alert(t('selectRating')); return; }

        const reviewData = {
            business_id: parseInt(formData.get('business-id')),
            rating: parseInt(rating),
            comment: formData.get('comment'),
            author_type: formData.get('author-type')
        };
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t('submitReview')}`;

        try {
            const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewData) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || t('errorSubmit'));

            closeModal();
            reviewForm.reset();

            const currentId = reviewData.business_id;
            const stats = businessStats[currentId];
            const newCount = stats.review_count + 1;
            stats.avg_rating = ((stats.avg_rating * stats.review_count) + result.review.rating) / newCount;
            stats.review_count = newCount;

            const currentBusiness = businesses.find(b => b.id === currentId);
            if (currentBusiness) handleMarkerClick(currentBusiness);
            renderBusinessList(searchInput.value);
        } catch (error) {
            alert(`${t('errorSubmit')}: ${error.message}`);
        } finally {
             submitBtn.disabled = false;
             submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${t('submitReview')}`;
        }
    }

    // --- Initial Setup ---
    searchInput.addEventListener('input', (e) => renderBusinessList(e.target.value));
    reviewForm.addEventListener('submit', handleReviewSubmit);
    loadBusinesses();
});