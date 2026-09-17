const A={view:document.querySelector('#view'),title:document.querySelector('#viewTitle')};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uploadFields={events:'poster',gallery:'image',team:'photo',news:'image'};
async function api(u,o){const r=await fetch(u,o);if(r.status===401)throw Error('Unauthorized');const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data}
async function check(){try{await api('/api/me');showApp();render('dashboard')}catch{}}
function showApp(){$('#login').classList.add('hidden');$('#app').classList.remove('hidden')}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const d=Object.fromEntries(new FormData(e.target));const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});if(r.ok){showApp();render('dashboard')}else $('#loginMsg').textContent='Invalid credentials'}catch{$('#loginMsg').textContent='Could not connect to server'}};
$('#logout').onclick=async()=>{await api('/api/logout',{method:'POST'});location.reload()};
document.querySelectorAll('aside button[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view));

async function uploadImage(file){
  const fd=new FormData();fd.append('image',file);
  const r=await fetch('/api/upload',{method:'POST',body:fd});
  const data=await r.json();
  if(!r.ok)throw Error(data.error||'Upload failed');
  return data.url;
}
function imageControl(field){
  return `<div class="upload-box"><label>${field}<input name="${field}" class="image-url" placeholder="Uploaded image URL" autocomplete="off"><div class="upload-row"><input type="file" class="image-file" data-target="${field}" accept="image/jpeg,image/png,image/webp,image/gif"><button type="button" class="upload-btn">Choose & Upload Photo</button></div><div class="upload-status" aria-live="polite"></div><img class="upload-preview" alt="Preview" hidden></div></div>`;
}
function normalField(f){
  if(f==='published')return `<label class="check-field"><input name="published" type="checkbox" value="1"> Published</label>`;
  if(f==='description'||f==='body_as'||f==='body_en'||f==='bio')return `<textarea name="${f}" placeholder="${f}"></textarea>`;
  return `<input name="${f}" placeholder="${f}">`;
}
function wireUploads(form){
  form.querySelectorAll('.upload-box').forEach(box=>{
    const file=box.querySelector('.image-file'),url=box.querySelector('.image-url'),btn=box.querySelector('.upload-btn'),status=box.querySelector('.upload-status'),preview=box.querySelector('.upload-preview');
    file.onchange=async()=>{if(file.files[0])await doUpload(file.files[0])};
    btn.onclick=()=>file.click();
    async function doUpload(f){
      if(!f.type.startsWith('image/')){status.textContent='Please choose an image file.';return}
      status.textContent='Uploading…';btn.disabled=true;
      try{const u=await uploadImage(f);url.value=u;preview.src=u;preview.hidden=false;status.textContent='Photo uploaded successfully.'}
      catch(e){status.textContent=e.message||'Upload failed.'}
      finally{btn.disabled=false}
    }
    url.addEventListener('input',()=>{if(url.value){preview.src=url.value;preview.hidden=false}else preview.hidden=true});
  });
}

async function render(v){
  A.title.textContent=v[0].toUpperCase()+v.slice(1);document.querySelectorAll('aside button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  if(v==='dashboard'){
    const [e,g,t,n,m]=await Promise.all(['events','gallery','team','news','memberships'].map(x=>api('/api/admin/'+x)));
    A.view.innerHTML=`<div class="grid">${[['Events',e.length],['Gallery',g.length],['Team',t.length],['News',n.length],['Memberships',m.length]].map(x=>`<div class="stat"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div><div class="panel"><h2>Content control</h2><p class="muted">Upload photos directly from your phone. Uploaded images can then be attached to gallery items, events, team profiles and news.</p></div>`;
  }else if(v==='content'||v==='contact'){
    const c=await api('/api/content');const keys=v==='content'?['hero_as','hero_en','hero_sub','identity','about_start','about_mission','about_vision']:['contact_address','contact_phone','contact_email','facebook','instagram','youtube','whatsapp'];
    A.view.innerHTML=`<div class="panel"><form id="contentForm" class="form">${keys.map(k=>`<label>${k}<input name="${k}" value="${esc(c[k])}"></label>`).join('')}<button class="primary">Save changes</button></form></div>`;
    $('#contentForm').onsubmit=async e=>{e.preventDefault();await api('/api/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});alert('Saved')};
  }else await crud(v);
}

const schemas={events:['name','date','time','venue','description','category','status','poster'],gallery:['album','caption','category','image'],team:['name','designation','bio','photo'],news:['title_as','title_en','date','category','author','image','body_as','body_en','published']};
async function crud(type){
  const rows=await api('/api/admin/'+type),fields=schemas[type],imageField=uploadFields[type];
  A.view.innerHTML=`<div class="panel"><h2>Add ${type}</h2><p class="muted">For photos, tap <strong>Choose & Upload Photo</strong> and select an image from your Android phone. The uploaded path is saved automatically.</p><form id="itemForm" class="form">${fields.map(f=>f===imageField?imageControl(f):normalField(f)).join('')}<button class="primary">Add item</button></form></div><div class="panel table-wrap"><table class="table"><thead><tr><th>ID</th><th>Primary info</th><th>Action</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.id}</td><td>${esc(r.name||r.title_as||r.caption||r.full_name||'—')}</td><td><button class="danger" onclick="del('${type}',${r.id})">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  const form=$('#itemForm');wireUploads(form);
  form.onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));if(type==='news'&&!data.published)data.published='0';await api('/api/'+type,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});render(type)};
}
async function del(t,id){if(confirm('Delete this item?')){await api('/api/'+t+'/'+id,{method:'DELETE'});render(t)}}
check();
