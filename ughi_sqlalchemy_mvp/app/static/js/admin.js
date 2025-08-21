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

	function showToast(msg){
		if(!toast) return;
		toast.textContent = msg;
		toast.classList.remove('hidden');
		setTimeout(()=> toast.classList.add('hidden'), 1800);
	}

	function persistOrder(){
		fetch('/api/admin/businesses/reorder', {
			method: 'POST', headers:{'Content-Type':'application/json'},
			body: JSON.stringify({ order: businesses.map(b=>b.id) })
		}).then(()=>{}).catch(()=>{});
	}

	function moveItem(id, dir){
		const idx = businesses.findIndex(b=>b.id===id);
		if(idx<0) return;
		const newIdx = dir==='up' ? Math.max(0, idx-1) : Math.min(businesses.length-1, idx+1);
		if(newIdx===idx) return;
		const [item] = businesses.splice(idx,1);
		businesses.splice(newIdx,0,item);
		applyFilter();
		persistOrder();
	}

	function renderBusinesses(){
		bizList.innerHTML = filtered.map(b=>`
			<li class="admin-item ${selectedId===b.id?'selected':''}" data-id="${b.id}">
				<div class="row">
					<strong>${b.name}</strong>
					<span class="muted">${b.type}</span>
				</div>
				<div class="row small">${b.latitude}, ${b.longitude}</div>
				<div class="row actions">
					<div class="move">
						<button class="move-up" title="Վերև">↑</button>
						<button class="move-down" title="Ներքև">↓</button>
					</div>
					<button class="select">Ընտրել</button>
					<button class="delete danger">Ջնջել</button>
				</div>
			</li>
		`).join('');
		bizCount.textContent = String(filtered.length);

		bizList.querySelectorAll('.select').forEach(btn=>{
			btn.addEventListener('click', (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				selectedId = id;
				adminBizId.value = String(id);
				const b = businesses.find(x=>x.id===id);
				selectedLabel.textContent = b ? b.name : 'Ընտրեք վայր ցանկից';
				renderBusinesses();
				loadReviews(id);
			});
		});
		bizList.querySelectorAll('.delete').forEach(btn=>{
			btn.addEventListener('click', async (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				if(!confirm('Ջնջե՞լ վայրը և դրա բոլոր կարծիքները։')) return;
				const res = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' });
				if(res.ok){ showToast('Ջնջվեց'); loadBusinesses(); reviewsList.innerHTML=''; selectedId=null; selectedLabel.textContent='Ընտրեք վայր ցանկից'; }
				else showToast('Սխալ ջնջման ժամանակ');
			});
		});
		bizList.querySelectorAll('.move-up').forEach(btn=>{
			btn.addEventListener('click', (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				moveItem(id, 'up');
			});
		});
		bizList.querySelectorAll('.move-down').forEach(btn=>{
			btn.addEventListener('click', (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				moveItem(id, 'down');
			});
		});
	}

	async function loadBusinesses(){
		const res = await fetch('/api/businesses');
		businesses = await res.json();
		applyFilter();
	}

	function applyFilter(){
		const q = (search?.value||'').trim().toLowerCase();
		filtered = q ? businesses.filter(b=> b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) : businesses.slice();
		renderBusinesses();
	}

	async function loadReviews(businessId){
		const res = await fetch(`/api/reviews/${businessId}`);
		const data = await res.json();
		reviewsList.innerHTML = data.map(r=>`
			<li class="admin-item" data-id="${r.id}">
				<div class="row"><strong>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</strong></div>
				<div class="row">${r.comment}</div>
				<div class="row small">${r.author_type} • ${new Date(r.created_at).toLocaleString()}</div>
				<div class="row actions">
					<button class="delete danger">Ջնջել</button>
				</div>
			</li>
		`).join('');
		reviewsList.querySelectorAll('.delete').forEach(btn=>{
			btn.addEventListener('click', async (e)=>{
				const id = parseInt(e.currentTarget.closest('.admin-item').dataset.id);
				if(!confirm('Ջնջե՞լ կարծիքը։')) return;
				const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
				if(res.ok){ showToast('Ջնջվեց'); loadReviews(businessId); }
				else showToast('Սխալ ջնջման ժամանակ');
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
		if(res.ok){ showToast('Ավելացվեց'); addBizForm.reset(); loadBusinesses(); }
		else showToast('Սխալ ավելացման ժամանակ');
	});

	addReviewForm.addEventListener('submit', async (e)=>{
		e.preventDefault();
		const business_id = parseInt(adminBizId.value);
		if(!business_id){ showToast('Նախ ընտրեք վայր'); return; }
		const payload = {
			business_id,
			rating: parseInt(document.getElementById('admin-rating').value),
			comment: document.getElementById('admin-comment').value,
			author_type: document.getElementById('admin-author').value,
		};
		const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
		if(res.ok){ showToast('Կարծիքը ավելացվեց'); addReviewForm.reset(); loadReviews(business_id); }
		else showToast('Սխալ ավելացման ժամանակ');
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
