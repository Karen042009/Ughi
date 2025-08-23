// /ughi_sqlalchemy_mvp/app/static/js/admin.js
(function(){
	const bizList = document.getElementById('admin-business-list');
	const addBizForm = document.getElementById('add-business-form');
	const toast = document.getElementById('toast');
	const search = document.getElementById('admin-search');
	const bizCount = document.getElementById('biz-count');
	const selectedLabel = document.getElementById('selected-business-label');

	const reviewsList = document.getElementById('admin-reviews-list');
	const addReviewForm = document.getElementById('add-review-form');
	const adminBizId = document.getElementById('admin-business-id');

	let businesses = [];
	let filtered = [];
	let selectedId = null;
	let debounceTimer;

	function showToast(msg, isError = false){
		if(!toast) return;
		toast.textContent = msg;
		toast.style.backgroundColor = isError ? 'var(--danger-color)' : '#111827';
		toast.classList.remove('hidden');
		setTimeout(()=> toast.classList.add('hidden'), 2500);
	}
    
	function persistOrder(){
		fetch('/api/admin/businesses/reorder', {
			method: 'POST', headers:{'Content-Type':'application/json'},
			body: JSON.stringify({ order: businesses.map(b=>b.id) })
		}).then(()=>{}).catch(()=>{});
	}

	function moveItem(id, dir){
		const idx = businesses.findIndex(b=>b.id===id);
		if(idx < 0) return;
		const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(businesses.length - 1, idx + 1);
		if(newIdx === idx) return;
		const [item] = businesses.splice(idx,1);
		businesses.splice(newIdx,0,item);
		applyFilter();
		persistOrder();
	}

	function renderBusinesses(){
		bizList.innerHTML = filtered.map(b=>`
			<li class="admin-item ${selectedId===b.id ? 'selected' : ''}" data-id="${b.id}">
				<div class="row">
					<strong>${b.name}</strong>
					<span class="muted">${b.type}</span>
				</div>
				<div class="row small">${b.latitude}, ${b.longitude}</div>
				<div class="row actions">
					<button class="select" title="Ընտրել այս վայրը">Ընտրել</button>
					<button class="delete danger" title="Ջնջել այս վայրը">Ջնջել</button>
				</div>
			</li>
		`).join('');
		bizCount.textContent = String(filtered.length);

        // Events are attached to the list, not individual buttons
		bizList.addEventListener('click', (e) => {
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
					addReviewForm.classList.remove('hidden'); // Ցույց տալ կարծիքի ձևը
				}
				renderBusinesses(); // Re-render to show selection
				loadReviews(id);
			} else if (target.classList.contains('delete')) {
				if(!confirm('Վստա՞հ եք, որ ուզում եք ջնջել այս վայրը և դրա բոլոր կարծիքները։')) return;
				fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' })
					.then(res => {
						if(res.ok){
							showToast('Վայրը հաջողությամբ ջնջվեց');
							loadBusinesses();
							reviewsList.innerHTML='';
							selectedId=null;
							selectedLabel.textContent='Ընտրեք վայր՝ կարծիքները տեսնելու համար';
							addReviewForm.classList.add('hidden'); // Թաքցնել կարծիքի ձևը
						} else {
							showToast('Ջնջման սխալ', true);
						}
					});
			}
		});
	}

	async function loadBusinesses(){
		const res = await fetch('/api/businesses');
		businesses = await res.json();
		applyFilter();
	}

	function applyFilter(){
		const q = (search?.value||'').trim().toLowerCase();
		filtered = q ? businesses.filter(b=> b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) : [...businesses];
		renderBusinesses();
	}

	async function loadReviews(businessId){
		reviewsList.innerHTML = `<li class="muted">Բեռնվում են կարծիքները...</li>`;
		const res = await fetch(`/api/reviews/${businessId}`);
		const data = await res.json();
        if (data.length === 0) {
            reviewsList.innerHTML = `<li class="muted">Այս վայրի համար կարծիքներ չկան։</li>`;
            return;
        }
		reviewsList.innerHTML = data.map(r=>`
			<li class="admin-item" data-id="${r.id}">
				<div class="row"><strong>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</strong></div>
				<div class="row" style="white-space: pre-wrap;">${r.comment}</div>
				<div class="row small"><span>${r.author_type}</span> <span>${new Date(r.created_at).toLocaleString()}</span></div>
				<div class="row actions">
					<button class="delete danger">Ջնջել</button>
				</div>
			</li>
		`).join('');

		reviewsList.querySelectorAll('.delete').forEach(btn=>{
			btn.addEventListener('click', async (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				if(!confirm('Ջնջե՞լ այս կարծիքը։')) return;
				const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
				if(res.ok){ showToast('Կարծիքը ջնջվեց'); loadReviews(businessId); }
				else showToast('Ջնջման սխալ', true);
			});
		});
	}

	addBizForm.addEventListener('submit', async (e)=>{
		e.preventDefault();
		const form = new FormData(addBizForm);
		const payload = {
			name: form.get('name'),
			type: form.get('type'),
			latitude: parseFloat(form.get('latitude')),
			longitude: parseFloat(form.get('longitude')),
		};
		const res = await fetch('/api/admin/businesses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
		if(res.ok){ showToast('Վայրը հաջողությամբ ավելացվեց'); addBizForm.reset(); loadBusinesses(); }
		else showToast('Ավելացման սխալ', true);
	});

	addReviewForm.addEventListener('submit', async (e)=>{
		e.preventDefault();
		const business_id = parseInt(adminBizId.value);
		if(!business_id){ showToast('Նախ ընտրեք վայր', true); return; }
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
		const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
		if(res.ok){ showToast('Կարծիքը ավելացվեց'); addReviewForm.reset(); loadReviews(business_id); }
		else showToast('Ավելացման սխալ', true);
	});

	if(search){
		search.addEventListener('input', ()=>{ clearTimeout(debounceTimer); debounceTimer=setTimeout(applyFilter, 200); });
	}

	// Scroll buttons
	const btnUp = document.getElementById('scroll-top');
	const btnDown = document.getElementById('scroll-bottom');
	btnUp?.addEventListener('click', ()=> window.scrollTo({ top: 0, behavior: 'smooth' }));
	btnDown?.addEventListener('click', ()=> window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

	loadBusinesses();
})();