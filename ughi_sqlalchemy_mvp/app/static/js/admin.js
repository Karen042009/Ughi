// /ughi_sqlalchemy_mvp/app/static/js/admin.js
(function(){
	// --- DOM Element References ---
	const bizList = document.getElementById('admin-business-list');
	const addBizForm = document.getElementById('add-business-form');
	const toast = document.getElementById('toast');
	const search = document.getElementById('admin-search');
	const bizCount = document.getElementById('biz-count');
	const selectedLabel = document.getElementById('selected-business-label');
	const reviewsList = document.getElementById('admin-reviews-list');
	const addReviewForm = document.getElementById('add-review-form');
	const adminBizId = document.getElementById('admin-business-id');
	const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
	const bulkDeleteReviewsBtn = document.getElementById('bulk-delete-reviews-btn');
	const exportBtn = document.getElementById('export-btn');
	const editBusinessModal = document.getElementById('edit-business-modal');
	const editReviewModal = document.getElementById('edit-review-modal');

	// User management elements
	const usersList = document.getElementById('admin-users-list');
	const addUserBtn = document.getElementById('add-user-btn');
	const addUserModal = document.getElementById('add-user-modal');
	const editUserModal = document.getElementById('edit-user-modal');
	const bulkDeleteUsersBtn = document.getElementById('bulk-delete-users-btn');

	// --- State Variables ---
	let businesses = [];
	let filtered = [];
	let users = [];
	let reviews = [];
	let selectedId = null;
	let debounceTimer;
	let selectedBusinesses = new Set();
	let selectedReviews = new Set();
	let selectedUsers = new Set();

	// --- Drag & Drop Variables ---
	let draggedItem = null;
	let draggedIndex = -1;
	let dropIndex = -1;
	let isDragging = false;
	let startY = 0;
	let startX = 0;
	let currentY = 0;
	let currentX = 0;
	let dragThreshold = 10; // Minimum distance to start drag
	let longPressTimer = null;
	let longPressDuration = 300; // ms for long press detection

	// --- Tooltip Variables ---
	let tooltipTimeout;

	// --- Mock Data (for demonstration if API fails) ---
	const mockData = {
		statistics: {
			total_businesses: 3,
			total_reviews: 4,
			total_users: 2,
			average_rating: "4.25",
			recent_reviews: 2,
			rating_distribution: [
				{ rating: 5, count: 2 },
				{ rating: 4, count: 1 },
				{ rating: 3, count: 1 },
				{ rating: 2, count: 0 },
				{ rating: 1, count: 0 },
			],
			business_types: [
				{ type: 'Restaurant', count: 2 },
				{ type: 'Hotel', count: 1 },
			]
		},
		users: [
			{ id: 1, username: 'admin_user', email: 'admin@example.com', role: 'admin', is_active: true, created_at: new Date().toISOString(), last_login: new Date().toISOString() },
			{ id: 2, username: 'demo_user', email: 'demo@example.com', role: 'user', is_active: false, created_at: new Date().toISOString(), last_login: null },
		],
		businesses: [
			{ id: 101, name: 'Example Restaurant', type: 'Restaurant', latitude: 40.1772, longitude: 44.5035 },
			{ id: 102, name: 'Demo Hotel', type: 'Hotel', latitude: 40.1811, longitude: 44.5136 },
			{ id: 103, name: 'Test Cafe', type: 'Restaurant', latitude: 40.1845, longitude: 44.5153 },
		],
		reviews: {
			101: [
				{ id: 201, rating: 5, comment: 'Excellent food and service!', author_type: 'Tourist', created_at: new Date().toISOString() },
				{ id: 202, rating: 4, comment: 'Good place, but a bit noisy.', author_type: 'Employee', created_at: new Date().toISOString() },
			],
			102: [
				{ id: 203, rating: 5, comment: 'Wonderful stay, highly recommended.', author_type: 'Tourist', created_at: new Date().toISOString() },
			],
			103: [
				{ id: 204, rating: 3, comment: 'Coffee was average.', author_type: 'Tourist', created_at: new Date().toISOString() },
			]
		}
	};

	function showToast(msg, isError = false){
		if(!toast) return;
		toast.textContent = msg;
		toast.style.backgroundColor = isError ? 'var(--danger-color)' : '#111827';
		toast.classList.remove('hidden');
		setTimeout(()=> toast.classList.add('hidden'), 2500);
	}
    
	function showTooltip(message, duration = 3000) {
		const tooltip = document.getElementById('drag-tooltip');
		if (!tooltip) return;
		
		tooltip.textContent = message;
		tooltip.classList.remove('hidden');
		
		// Clear any existing timeout
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
		}
		
		// Auto-hide after duration
		tooltipTimeout = setTimeout(() => {
			tooltip.classList.add('hidden');
		}, duration);
	}

	function hideTooltip() {
		const tooltip = document.getElementById('drag-tooltip');
		if (tooltip) {
			tooltip.classList.add('hidden');
		}
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
		}
	}

	// --- Modal Management ---
	function showModal(modal) { 
		if (modal) {
			modal.classList.remove('hidden'); 
			document.body.style.overflow = 'hidden';
		}
	}
	
	function closeModal(modal) { 
		if (modal) {
			modal.classList.add('hidden'); 
			document.body.style.overflow = '';
		}
	}
	
	window.closeEditModal = () => closeModal(editBusinessModal);
	window.closeReviewModal = () => closeModal(editReviewModal);
	window.closeAddUserModal = () => closeModal(addUserModal);
	window.closeEditUserModal = () => closeModal(editUserModal);
	
	// Close modals when clicking outside
	document.addEventListener('click', (e) => {
		if (e.target.classList.contains('modal')) {
			closeModal(e.target);
		}
	});
	
	// Close modals with close button
	document.querySelectorAll('.modal-close').forEach(btn => {
		btn.addEventListener('click', () => {
			closeModal(btn.closest('.modal'));
		});
	});

	// --- API & Data Loading (with Mock Data Fallback) ---
	async function loadData(endpoint, mock) {
		try {
			const res = await fetch(endpoint);
			if (!res.ok) throw new Error('API failed');
			const data = await res.json();
			return data.length > 0 ? data : mock;
		} catch (error) {
			console.warn(`${endpoint} API failed, using mock data.`, error);
			return mock;
		}
	}

	async function loadStatistics() {
		try {
			const res = await fetch('/api/admin/statistics');
			if (!res.ok) throw new Error('API failed');
			const stats = await res.json();
			renderStatistics(stats);
		} catch (error) {
			console.warn('Statistics API failed, using mock data.', error);
			renderStatistics(mockData.statistics);
		}
	}

	function renderStatistics(stats) {
		const totalBusinessesEl = document.getElementById('total-businesses');
		const totalReviewsEl = document.getElementById('total-reviews');
		const totalUsersEl = document.getElementById('total-users');
		const avgRatingEl = document.getElementById('avg-rating');
		const recentReviewsEl = document.getElementById('recent-reviews');
		
		if (totalBusinessesEl) totalBusinessesEl.textContent = stats.total_businesses;
		if (totalReviewsEl) totalReviewsEl.textContent = stats.total_reviews;
		if (totalUsersEl) totalUsersEl.textContent = stats.total_users;
		if (avgRatingEl) avgRatingEl.textContent = stats.average_rating || 'N/A';
		if (recentReviewsEl) recentReviewsEl.textContent = stats.recent_reviews;
		
		renderRatingChart(stats.rating_distribution);
		renderTypeChart(stats.business_types);
	}

	function renderRatingChart(ratingData) {
		const chart = document.getElementById('rating-chart');
		if (!chart || !ratingData || ratingData.length === 0) return;
		const maxCount = Math.max(...ratingData.map(d => d.count), 1);
		chart.innerHTML = ratingData.map(item => `
			<div class="chart-bar">
				<div class="chart-label">${'★'.repeat(item.rating)}</div>
				<div class="chart-bar-fill" style="width: ${(item.count / maxCount) * 100}%"></div>
				<div class="chart-value">${item.count}</div>
			</div>
		`).join('');
	}

	function renderTypeChart(typeData) {
		const chart = document.getElementById('type-chart');
		if (!chart || !typeData || typeData.length === 0) return;
		const maxCount = Math.max(...typeData.map(d => d.count), 1);
		chart.innerHTML = typeData.map(item => `
			<div class="chart-bar">
				<div class="chart-label">${item.type}</div>
				<div class="chart-bar-fill" style="width: ${(item.count / maxCount) * 100}%"></div>
				<div class="chart-value">${item.count}</div>
			</div>
		`).join('');
	}

	// User management functions
	async function loadUsers() {
		try {
			const res = await fetch('/api/admin/users');
			if (!res.ok) throw new Error('API failed');
			const data = await res.json();
			users = data.length > 0 ? data : mockData.users;
			renderUsers();
		} catch (error) {
			console.warn('Users API failed, using mock data.', error);
			users = mockData.users;
			renderUsers();
		}
	}

	function renderUsers() {
		if (!usersList) return;
		
		usersList.innerHTML = users.map(user => `
			<li class="admin-item" data-id="${user.id}">
				<div class="checkbox-container">
					<input type="checkbox" class="user-checkbox" data-id="${user.id}" ${selectedUsers.has(user.id) ? 'checked' : ''}>
				</div>
				<div class="item-content">
					<div class="row">
						<strong>${user.username}</strong>
						<div class="row meta">
							<span class="badge ${user.role}">${user.role}</span>
							<span class="badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Ակտիվ' : 'Անակտիվ'}</span>
						</div>
					</div>
					<div class="row small"><span>${user.email}</span></div>
					<div class="row small">
						<span>Ստեղծված՝ ${new Date(user.created_at).toLocaleDateString()}</span>
						${user.last_login ? `<span>Վերջին մուտք՝ ${new Date(user.last_login).toLocaleDateString()}</span>` : ''}
					</div>
				</div>
				<div class="item-actions">
					<button class="btn btn-edit edit" title="Խմբագրել օգտատեր">Խմբագրել</button>
					<button class="btn btn-danger delete" title="Ջնջել օգտատեր">Ջնջել</button>
				</div>
			</li>
		`).join('');

		// Handle user actions
		usersList.querySelectorAll('.edit').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				openEditUserModal(id);
			});
		});

		usersList.querySelectorAll('.delete').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				if (!confirm('Վստա՞հ եք, որ ուզում եք ջնջել այս օգտատերին։')) return;
				deleteUser(id);
			});
		});

		// Handle user checkboxes
		usersList.querySelectorAll('.user-checkbox').forEach(checkbox => {
			checkbox.addEventListener('change', (e) => {
				const id = parseInt(e.target.dataset.id);
				if (e.target.checked) {
					selectedUsers.add(id);
				} else {
					selectedUsers.delete(id);
				}
				updateBulkDeleteUsersButton();
			});
		});
	}
	
	// --- Business Logic ---
	async function loadBusinesses(){
		businesses = await loadData('/api/businesses', mockData.businesses);
		applyFilter();
	}

	function applyFilter(){
		const q = (search?.value||'').trim().toLowerCase();
		filtered = q ? businesses.filter(b=> b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) : [...businesses];
		renderBusinesses();
	}

	function renderBusinesses(){
		bizList.innerHTML = filtered.map(b=>`
			<li class="admin-item ${selectedId===b.id ? 'selected' : ''}" data-id="${b.id}" draggable="true">
				<div class="checkbox-container">
					<input type="checkbox" class="business-checkbox" data-id="${b.id}" ${selectedBusinesses.has(b.id) ? 'checked' : ''}>
				</div>
				<div class="item-content">
					<div class="row"><strong>${b.name}</strong><span class="muted">${b.type}</span></div>
				<div class="row small">${b.latitude}, ${b.longitude}</div>
				</div>
				<div class="item-actions">
					<button class="btn btn-primary select" title="Ընտրել">Ընտրել</button>
					<button class="btn btn-edit edit" title="Խմբագրել">Խմբագրել</button>
					<button class="btn btn-danger delete" title="Ջնջել">Ջնջել</button>
				</div>
			</li>
		`).join('');
		bizCount.textContent = String(filtered.length);
		updateBulkDeleteButton();

		// Add event listeners for business actions
		bizList.addEventListener('click', handleBusinessClick);
		bizList.addEventListener('change', handleBusinessCheckboxChange);
	}

	async function loadReviews(businessId) {
		try {
			reviews = await loadData(`/api/reviews/${businessId}`, mockData.reviews[businessId] || []);
			renderReviews(reviews);
		} catch (error) {
			console.error('Error loading reviews:', error);
			reviews = [];
			renderReviews([]);
		}
	}

	function renderReviews(reviews) {
		if (!reviewsList) return;
		
		reviewsList.innerHTML = reviews.map(review => `
			<li class="admin-item" data-id="${review.id}">
				<div class="checkbox-container">
					<input type="checkbox" class="review-checkbox" data-id="${review.id}" ${selectedReviews.has(review.id) ? 'checked' : ''}>
				</div>
				<div class="item-content">
					<div class="row">
						<strong>${'⭐'.repeat(review.rating)}</strong>
						<span class="muted">${review.author_type}</span>
					</div>
					<div class="row small">${review.comment}</div>
					<div class="row small muted">${new Date(review.created_at).toLocaleDateString('hy-AM')}</div>
				</div>
				<div class="item-actions">
					<button class="btn btn-edit edit-review" title="Խմբագրել">Խմբագրել</button>
					<button class="btn btn-danger delete-review" title="Ջնջել">Ջնջել</button>
				</div>
			</li>
		`).join('');

		// Add event listeners for review actions
		reviewsList.addEventListener('click', handleReviewClick);
		reviewsList.addEventListener('change', handleReviewCheckboxChange);
	}

	function handleReviewClick(e) {
		const target = e.target;
		const item = target.closest('.admin-item');
		if (!item) return;

		const id = parseInt(item.dataset.id);
		if (target.classList.contains('edit-review')) {
			openEditReviewModal(id);
		} else if (target.classList.contains('delete-review')) {
			if (!confirm('Վստա՞հ եք, որ ուզում եք ջնջել այս կարծիքը։')) return;
			deleteReview(id);
		}
	}

	function handleReviewCheckboxChange(e) {
		if (e.target.classList.contains('review-checkbox')) {
			const id = parseInt(e.target.dataset.id);
			if (e.target.checked) {
				selectedReviews.add(id);
			} else {
				selectedReviews.delete(id);
			}
			updateBulkDeleteReviewsButton();
		}
	}

	async function deleteReview(reviewId) {
		try {
			const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
			if (res.ok) {
				showToast('Կարծիքը հաջողությամբ ջնջվեց');
				if (selectedId) {
					loadReviews(selectedId);
				}
				loadStatistics();
			} else {
				showToast('Ջնջման սխալ', true);
			}
		} catch (error) {
			showToast('Ջնջման սխալ', true);
		}
	}

	function updateBulkDeleteReviewsButton() {
		if (bulkDeleteReviewsBtn) {
			bulkDeleteReviewsBtn.disabled = selectedReviews.size === 0;
		}
	}

	function openEditReviewModal(reviewId) {
		const review = reviews.find(r => r.id === reviewId);
		if (!review) return;

		document.getElementById('edit-review-id').value = review.id;
		document.getElementById('edit-review-rating').value = review.rating;
		document.getElementById('edit-review-comment').value = review.comment;
		document.getElementById('edit-review-author-type').value = review.author_type;

		showModal(editReviewModal);
	}

	function handleBusinessClick(e) {
			const target = e.target;
			const item = target.closest('.admin-item');
			if (!item) return;

			const id = parseInt(item.dataset.id);
			if (target.classList.contains('select')) {
				selectedId = id;
				adminBizId.value = String(id);
				const b = businesses.find(x=>x.id===id);
				if (b) {
					selectedLabel.textContent = `Ընտրված է՝ ${b.name}`;
				addReviewForm.classList.remove('hidden');
				}
			renderBusinesses();
				loadReviews(id);
		} else if (target.classList.contains('edit')) {
			openEditBusinessModal(id);
			} else if (target.classList.contains('delete')) {
				if(!confirm('Վստա՞հ եք, որ ուզում եք ջնջել այս վայրը և դրա բոլոր կարծիքները։')) return;
			deleteBusiness(id);
		}
	}

	function handleBusinessCheckboxChange(e) {
		if (e.target.classList.contains('business-checkbox')) {
			const id = parseInt(e.target.dataset.id);
			if (e.target.checked) {
				selectedBusinesses.add(id);
			} else {
				selectedBusinesses.delete(id);
			}
			updateBulkDeleteButton();
		}
	}

	async function deleteBusiness(id) {
		try {
			const res = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
						if(res.ok){
							showToast('Վայրը հաջողությամբ ջնջվեց');
							loadBusinesses();
				loadStatistics();
							reviewsList.innerHTML='';
							selectedId=null;
							selectedLabel.textContent='Ընտրեք վայր՝ կարծիքները տեսնելու համար';
				addReviewForm.classList.add('hidden');
						} else {
							showToast('Ջնջման սխալ', true);
						}
		} catch (error) {
			showToast('Ջնջման սխալ', true);
		}
	}

	function updateBulkDeleteButton() {
		if (bulkDeleteBtn) {
			bulkDeleteBtn.disabled = selectedBusinesses.size === 0;
		}
	}

	function openEditBusinessModal(businessId) {
		const business = businesses.find(b => b.id === businessId);
		if (!business) return;

		document.getElementById('edit-business-id').value = business.id;
		document.getElementById('edit-biz-name').value = business.name;
		document.getElementById('edit-biz-type').value = business.type;
		document.getElementById('edit-biz-lat').value = business.latitude;
		document.getElementById('edit-biz-lng').value = business.longitude;

		showModal(editBusinessModal);
	}
	
	// --- Enhanced Drag-and-Drop for Businesses ---
	function getDragAfterElement(container, y) {
		const draggableElements = [...container.querySelectorAll('.admin-item:not(.dragging)')];
		return draggableElements.reduce((closest, child) => {
			const box = child.getBoundingClientRect();
			const offset = y - box.top - box.height / 2;
			if (offset < 0 && offset > closest.offset) {
				return { offset: offset, element: child };
			} else {
				return closest;
			}
		}, { offset: Number.NEGATIVE_INFINITY }).element;
	}

	function startDrag(element, clientY) {
		if (!element || isDragging) return false;
		
		draggedItem = element;
		isDragging = true;
		currentY = clientY;
		
		// Add visual feedback
		draggedItem.classList.add('dragging');
		document.body.classList.add('dragging-active');
		
		// Accessibility: Announce drag start
		const itemName = draggedItem.querySelector('.item-content strong')?.textContent || 'տարր';
		showTooltip(`${itemName} քաշվում է - Քաշեք վերև կամ ներքև՝ դասավորությունը փոխելու համար`, 2000);
		
		// Haptic feedback for mobile devices
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}
		
		// Accessibility: Set ARIA attributes
		draggedItem.setAttribute('aria-grabbed', 'true');
		draggedItem.setAttribute('aria-describedby', 'drag-tooltip');
		
		return true;
	}

	function updateDragPosition(clientY) {
		if (!isDragging || !draggedItem) return;
		
		// Throttle position updates for better performance
		const now = Date.now();
		if (now - (updateDragPosition.lastUpdate || 0) < 16) return; // ~60fps
		updateDragPosition.lastUpdate = now;
		
		currentY = clientY;
		const afterElement = getDragAfterElement(bizList, currentY);
		
		// Performance: Only update if position actually changed
		if (afterElement === updateDragPosition.lastAfterElement) return;
		updateDragPosition.lastAfterElement = afterElement;
		
		// Remove previous drop indicators (cached for performance)
		if (updateDragPosition.lastDropElement) {
			updateDragPosition.lastDropElement.classList.remove('drop-above', 'drop-below');
		}
		
		// Add visual drop indicator
		if (afterElement == null) {
			bizList.appendChild(draggedItem);
			updateDragPosition.lastDropElement = null;
		} else {
			const afterRect = afterElement.getBoundingClientRect();
			
			if (currentY < afterRect.top + afterRect.height / 2) {
				afterElement.classList.add('drop-above');
				bizList.insertBefore(draggedItem, afterElement);
			} else {
				afterElement.classList.add('drop-below');
				bizList.insertBefore(draggedItem, afterElement.nextSibling);
			}
			updateDragPosition.lastDropElement = afterElement;
		}
	}

	function endDrag() {
		if (!isDragging || !draggedItem) return;
		
		// Clean up visual states
		draggedItem.classList.remove('dragging');
		document.body.classList.remove('dragging-active');
		bizList.querySelectorAll('.drop-above, .drop-below').forEach(el => {
			el.classList.remove('drop-above', 'drop-below');
		});
		
		// Update data order
		const newOrderIds = [...bizList.querySelectorAll('.admin-item')].map(item => parseInt(item.dataset.id));
		const oldOrder = businesses.map(b => b.id);
		
		// Only persist if order actually changed
		if (JSON.stringify(newOrderIds) !== JSON.stringify(oldOrder)) {
			businesses.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
			persistOrder();
			
			// Accessibility: Announce successful reorder
			const itemName = draggedItem.querySelector('.item-content strong')?.textContent || 'տարր';
			showTooltip(`✅ ${itemName} հաջողությամբ տեղափոխվեց`, 1500);
			
			// Haptic feedback for successful reorder
			if (navigator.vibrate) {
				navigator.vibrate([50, 50, 50]);
			}
		} else {
			// No change - provide feedback
			showTooltip('Դասավորությունը չփոխվեց', 1000);
		}
		
		// Accessibility: Clean up ARIA attributes
		if (draggedItem) {
			draggedItem.removeAttribute('aria-grabbed');
			draggedItem.removeAttribute('aria-describedby');
		}
		
		// Reset state
		draggedItem = null;
		isDragging = false;
		startY = 0;
		startX = 0;
		currentY = 0;
		currentX = 0;
		
		// Clean up performance optimization caches
		updateDragPosition.lastUpdate = null;
		updateDragPosition.lastAfterElement = null;
		updateDragPosition.lastDropElement = null;
		
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	// Legacy mouse drag handlers (for backward compatibility)
	function handleDragStart(e) {
		const item = e.target.closest('.admin-item');
		if (!item || e.target.closest('button, input, a')) {
			e.preventDefault();
			return;
		}
		startDrag(item, e.clientY);
	}

	function handleDragOver(e) {
		e.preventDefault();
		if (isDragging) {
			updateDragPosition(e.clientY);
		}
	}

	function handleDragEnd() {
		endDrag();
	}

	// --- Enhanced Touch/Pointer Event Handlers ---
	function handlePointerDown(e) {
		const item = e.target.closest('.admin-item');
		if (!item || e.target.closest('button, input, a')) return;
		
		// Store initial position
		startX = e.clientX;
		startY = e.clientY;
		
		// Add long press visual feedback
		item.classList.add('long-press-active');
		
		// Set up long press timer for drag initiation
		longPressTimer = setTimeout(() => {
			if (!isDragging && Math.abs(e.clientX - startX) < dragThreshold && Math.abs(e.clientY - startY) < dragThreshold) {
				startDrag(item, e.clientY);
				e.preventDefault();
			}
		}, longPressDuration);
	}

	function handlePointerMove(e) {
		if (longPressTimer && !isDragging) {
			const deltaX = Math.abs(e.clientX - startX);
			const deltaY = Math.abs(e.clientY - startY);
			
			// Cancel long press if moved too much
			if (deltaX > dragThreshold || deltaY > dragThreshold) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
		}
		
		if (isDragging) {
			e.preventDefault();
			updateDragPosition(e.clientY);
		}
	}

	function handlePointerUp(e) {
		// Remove long press visual feedback
		const item = e.target.closest('.admin-item');
		if (item) {
			item.classList.remove('long-press-active');
		}
		
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		
		if (isDragging) {
			endDrag();
		}
	}

	// --- Touch Event Handlers (fallback) ---
	function handleTouchStart(e) {
		const item = e.target.closest('.admin-item');
		if (!item || e.target.closest('button, input, a')) return;
		
		const touch = e.touches[0];
		startX = touch.clientX;
		startY = touch.clientY;
		
		// Add long press visual feedback
		item.classList.add('long-press-active');
		
		// Set up long press timer
		longPressTimer = setTimeout(() => {
			if (!isDragging) {
				startDrag(item, touch.clientY);
				e.preventDefault();
			}
		}, longPressDuration);
	}

	function handleTouchMove(e) {
		const touch = e.touches[0];
		
		if (longPressTimer && !isDragging) {
			const deltaX = Math.abs(touch.clientX - startX);
			const deltaY = Math.abs(touch.clientY - startY);
			
			// Cancel long press if moved too much
			if (deltaX > dragThreshold || deltaY > dragThreshold) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
		}
		
		if (isDragging) {
			e.preventDefault();
			updateDragPosition(touch.clientY);
		}
	}

	function handleTouchEnd(e) {
		// Remove long press visual feedback
		const item = e.target.closest('.admin-item');
		if (item) {
			item.classList.remove('long-press-active');
		}
		
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		
		if (isDragging) {
			endDrag();
		}
	}

	function persistOrder(){
		fetch('/api/admin/businesses/reorder', {
			method: 'POST', 
			headers:{'Content-Type':'application/json'},
			body: JSON.stringify({ order: businesses.map(b=>b.id) })
		}).then(res => {
			if(res.ok) showToast('Դասավորությունը պահպանվեց');
			else showToast('Դասավորությունը չհաջողվեց պահպանել', true);
		}).catch(()=> showToast('Դասավորությունը չհաջողվեց պահպանել', true));
	}
	
	// --- User Management Functions ---
	function openEditUserModal(userId) {
		const user = users.find(u => u.id === userId);
		if (!user) return;

		document.getElementById('edit-user-id').value = user.id;
		document.getElementById('edit-username').value = user.username;
		document.getElementById('edit-email').value = user.email;
		document.getElementById('edit-role').value = user.role;
		document.getElementById('edit-user-active').checked = user.is_active;
		document.getElementById('edit-password').value = '';

		showModal(editUserModal);
	}

	async function deleteUser(userId) {
		try {
			const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
			if (res.ok) {
				showToast('Օգտատերը հաջողությամբ ջնջվեց');
				loadUsers();
				loadStatistics();
			} else {
				const data = await res.json();
				showToast(data.error || 'Ջնջման սխալ', true);
			}
		} catch (error) {
			showToast('Ջնջման սխալ', true);
		}
	}

	function updateBulkDeleteUsersButton() {
		if (bulkDeleteUsersBtn) {
			bulkDeleteUsersBtn.disabled = selectedUsers.size === 0;
		}
	}

	// --- Add User Functionality ---
	if (addUserBtn) {
		addUserBtn.addEventListener('click', () => {
			showModal(addUserModal);
		});
	}
	
	// --- Initialization ---
	function init() {
		loadBusinesses();
		loadStatistics();
		loadUsers(); // Assuming this is also present

		// Setup Drag and Drop Listeners
		bizList.addEventListener('dragstart', handleDragStart);
		bizList.addEventListener('dragover', handleDragOver);
		bizList.addEventListener('dragend', handleDragEnd);
		
		// Show drag & drop tooltip after a short delay
		setTimeout(() => {
			showTooltip('Սեղմեք և պահեք (300մս) վայրերը, ապա քաշեք վերև-ներքև՝ դասավորությունը փոխելու համար', 6000);
		}, 1000);
		
		// Enhanced touch and pointer support
		bizList.addEventListener('pointerdown', handlePointerDown);
		bizList.addEventListener('pointermove', handlePointerMove);
		bizList.addEventListener('pointerup', handlePointerUp);
		bizList.addEventListener('pointercancel', handlePointerUp);
		
		// Fallback for older browsers
		bizList.addEventListener('touchstart', handleTouchStart, { passive: false });
		bizList.addEventListener('touchmove', handleTouchMove, { passive: false });
		bizList.addEventListener('touchend', handleTouchEnd);
		bizList.addEventListener('touchcancel', handleTouchEnd);
	}

	init();

	// --- Form Event Listeners ---
	// Add user form
	document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		
		const payload = {
			username: form.get('username'),
			email: form.get('email'),
			password: form.get('password'),
			role: form.get('role')
		};
		
		try {
			const res = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (res.ok) {
				showToast('Օգտատերը հաջողությամբ ավելացվեց');
				closeModal(addUserModal);
				e.target.reset();
				loadUsers();
				loadStatistics();
			} else {
				const data = await res.json();
				showToast(data.error || 'Ավելացման սխալ', true);
			}
		} catch (error) {
			showToast('Ավելացման սխալ', true);
		}
	});

	// Edit user form
	document.getElementById('edit-user-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const userId = parseInt(document.getElementById('edit-user-id').value);
		
		const payload = {
			username: form.get('username'),
			email: form.get('email'),
			role: form.get('role'),
			is_active: form.get('is_active') === 'on'
		};
		
		const password = form.get('password');
		if (password) {
			payload.password = password;
		}
		
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (res.ok) {
				showToast('Օգտատերը հաջողությամբ թարմացվեց');
				closeModal(editUserModal);
				loadUsers();
				loadStatistics();
			} else {
				const data = await res.json();
				showToast(data.error || 'Թարմացման սխալ', true);
			}
		} catch (error) {
			showToast('Թարմացման սխալ', true);
		}
	});

	// --- Bulk Operations ---
	// Bulk delete users
	if (bulkDeleteUsersBtn) {
		bulkDeleteUsersBtn.addEventListener('click', async () => {
			if (selectedUsers.size === 0) return;
			
			if (!confirm(`Վստա՞հ եք, որ ուզում եք ջնջել ${selectedUsers.size} օգտատեր(եր)։`)) return;
			
			try {
				const res = await fetch('/api/admin/users/bulk-delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ user_ids: Array.from(selectedUsers) })
				});
				
				if (res.ok) {
					showToast(`${selectedUsers.size} օգտատեր(եր) հաջողությամբ ջնջվեց(ին)`);
					selectedUsers.clear();
					loadUsers();
					loadStatistics();
				} else {
					const data = await res.json();
					showToast(data.error || 'Զանգվածային ջնջման սխալ', true);
				}
			} catch (error) {
				showToast('Զանգվածային ջնջման սխալ', true);
			}
		});
	}

	// Bulk delete businesses
	if (bulkDeleteBtn) {
		bulkDeleteBtn.addEventListener('click', async () => {
			if (selectedBusinesses.size === 0) return;
			
			if (!confirm(`Վստա՞հ եք, որ ուզում եք ջնջել ${selectedBusinesses.size} վայր(եր)։`)) return;
			
			try {
				const res = await fetch('/api/admin/businesses/bulk-delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ business_ids: Array.from(selectedBusinesses) })
				});
				
				if (res.ok) {
					showToast(`${selectedBusinesses.size} վայր(եր) հաջողությամբ ջնջվեց(ին)`);
					selectedBusinesses.clear();
					loadBusinesses();
					loadStatistics();
				} else {
					showToast('Զանգվածային ջնջման սխալ', true);
				}
			} catch (error) {
				showToast('Զանգվածային ջնջման սխալ', true);
			}
		});
	}

	// Bulk delete reviews
	if (bulkDeleteReviewsBtn) {
		bulkDeleteReviewsBtn.addEventListener('click', async () => {
			if (selectedReviews.size === 0) return;
			
			if (!confirm(`Վստա՞հ եք, որ ուզում եք ջնջել ${selectedReviews.size} կարծիք(ներ)։`)) return;
			
			try {
				const res = await fetch('/api/admin/reviews/bulk-delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ review_ids: Array.from(selectedReviews) })
				});
				
				if (res.ok) {
					showToast(`${selectedReviews.size} կարծիք(ներ) հաջողությամբ ջնջվեց(ին)`);
					selectedReviews.clear();
					if (selectedId) {
						loadReviews(selectedId);
					}
					loadStatistics();
				} else {
					showToast('Զանգվածային ջնջման սխալ', true);
				}
			} catch (error) {
				showToast('Զանգվածային ջնջման սխալ', true);
			}
		});
	}

	// --- Export Functionality ---
	if (exportBtn) {
		exportBtn.addEventListener('click', async () => {
			try {
				const res = await fetch('/api/admin/export');
		const data = await res.json();
				
				// Create and download JSON file
				const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `ughi-export-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				showToast('Տվյալները հաջողությամբ export արվեցին');
			} catch (error) {
				showToast('Export-ի սխալ', true);
			}
		});
	}

	// --- Form Submissions ---
	// Add business form
	addBizForm?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = new FormData(addBizForm);
		const payload = {
			name: form.get('name'),
			type: form.get('type'),
			latitude: parseFloat(form.get('latitude')),
			longitude: parseFloat(form.get('longitude')),
		};
		try {
			const res = await fetch('/api/admin/businesses', { 
				method: 'POST', 
				headers: {'Content-Type': 'application/json'}, 
				body: JSON.stringify(payload)
			});
			if(res.ok){ 
				showToast('Վայրը հաջողությամբ ավելացվեց'); 
				addBizForm.reset(); 
				loadBusinesses(); 
				loadStatistics();
			} else {
				showToast('Ավելացման սխալ', true);
			}
		} catch (error) {
			showToast('Ավելացման սխալ', true);
		}
	});

	// Add review form
	addReviewForm?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const business_id = parseInt(adminBizId.value);
		if(!business_id){ 
			showToast('Նախ ընտրեք վայր', true); 
			return; 
		}
		const payload = {
			business_id,
			rating: parseInt(document.getElementById('admin-rating').value),
			comment: document.getElementById('admin-comment').value,
			author_type: document.getElementById('admin-author').value,
		};
		if (!payload.comment) {
			showToast('Մեկնաբանությունը դատարկ լինել չի կարող', true);
			return;
		}
		try {
			const res = await fetch('/api/reviews', { 
				method: 'POST', 
				headers: {'Content-Type': 'application/json'}, 
				body: JSON.stringify(payload)
			});
			if(res.ok){ 
				showToast('Կարծիքը ավելացվեց'); 
				addReviewForm.reset(); 
				loadReviews(business_id); 
				loadStatistics();
			} else {
				showToast('Ավելացման սխալ', true);
			}
		} catch (error) {
			showToast('Ավելացման սխալ', true);
		}
	});

	// Edit business form
	document.getElementById('edit-business-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const businessId = parseInt(document.getElementById('edit-business-id').value);
		
		const payload = {
			name: form.get('name'),
			type: form.get('type'),
			latitude: parseFloat(form.get('latitude')),
			longitude: parseFloat(form.get('longitude')),
		};
		
		try {
			const res = await fetch(`/api/admin/businesses/${businessId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (res.ok) {
				showToast('Վայրը հաջողությամբ թարմացվեց');
				closeModal(editBusinessModal);
				loadBusinesses();
				loadStatistics();
			} else {
				showToast('Թարմացման սխալ', true);
			}
		} catch (error) {
			showToast('Թարմացման սխալ', true);
		}
	});

	// Edit review form
	document.getElementById('edit-review-form')?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const reviewId = parseInt(document.getElementById('edit-review-id').value);
		
		const payload = {
			rating: parseInt(form.get('rating')),
			comment: form.get('comment'),
			author_type: form.get('author_type'),
		};
		
		try {
			const res = await fetch(`/api/admin/reviews/${reviewId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (res.ok) {
				showToast('Կարծիքը հաջողությամբ թարմացվեց');
				closeModal(editReviewModal);
				if (selectedId) {
					loadReviews(selectedId);
				}
				loadStatistics();
			} else {
				showToast('Թարմացման սխալ', true);
			}
		} catch (error) {
			showToast('Թարմացման սխալ', true);
		}
	});



	// --- Search and Scroll Functionality ---
	if(search){
		search.addEventListener('input', ()=>{ 
			clearTimeout(debounceTimer); 
			debounceTimer=setTimeout(applyFilter, 200); 
		});
	}

	// Scroll buttons
	const btnUp = document.getElementById('scroll-top');
	const btnDown = document.getElementById('scroll-bottom');
	btnUp?.addEventListener('click', ()=> window.scrollTo({ top: 0, behavior: 'smooth' }));
	btnDown?.addEventListener('click', ()=> window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

})();