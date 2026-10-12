'use strict';
document.documentElement.classList.add('enhanced');
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
// One brief arrival movement; never hide content and respect reduced motion.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});
  $$('.section-head').forEach(section => sectionObserver.observe(section));
}
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
let toastTimeout;
function toast(message) {
  const target=$('#toast'); if(!target) return;
  target.textContent=message;target.classList.add('show');
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>target.classList.remove('show'),2600);
}
const menuButton=$('.menu-toggle'),navigation=$('#main-nav');
menuButton?.addEventListener('click',()=>{
  const open=menuButton.getAttribute('aria-expanded')!=='true';
  menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape') return;
  const story=$('.story-menu[open]');
  if(story){story.open=false;$('summary',story).focus();}
  else if(navigation?.classList.contains('open')){navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.focus();}
});
document.addEventListener('click',event=>{
  const story=$('.story-menu');if(story?.open&&!story.contains(event.target))story.open=false;
});

// Search and filters operate on the server-rendered, readable project catalog.
const projectCards=$$('[data-project-card]'), projectSearch=$('#project-search'), statusFilter=$('#status-filter');
let selectedCategory='all';
function filterProjects(){
  const query=(projectSearch?.value||'').toLocaleLowerCase().trim();
  const stage=statusFilter?.value||'all';
  let count=0;
  projectCards.forEach(card=>{
    const show=PortfolioLogic.matchesProject(card.dataset,selectedCategory,stage,query);
    card.hidden=!show;if(show)count++;
  });
  if($('#project-count'))$('#project-count').textContent=`${count} project${count===1?'':'s'}`;
  if($('#project-empty'))$('#project-empty').hidden=count!==0;
}
$$('[data-project-filter]').forEach(button=>button.addEventListener('click',()=>{
  selectedCategory=button.dataset.projectFilter;
  $$('[data-project-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  filterProjects();
}));
projectSearch?.addEventListener('input',filterProjects);statusFilter?.addEventListener('change',filterProjects);
$('#reset-projects')?.addEventListener('click',()=>{
  selectedCategory='all';projectSearch.value='';statusFilter.value='all';
  $$('[data-project-filter]').forEach(b=>{const active=b.dataset.projectFilter==='all';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  filterProjects();projectSearch.focus();
});
// The process uses accessible tabs, with keyboard focus following selection.
const processData=$('#process-data');
if(processData){
  const steps=JSON.parse(processData.textContent),tabs=$$('[data-process]');
  const selectProcess=index=>{
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    $('#process-index').textContent=`${String(index+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
    $('#process-title').textContent=steps[index][1];$('#process-description').textContent=steps[index][2];
    $('#process-panel').setAttribute('aria-labelledby',tabs[index].id);
  };
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>selectProcess(i));
    tab.addEventListener('keydown',event=>{
      let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
      event.preventDefault();selectProcess(next);tabs[next].focus();
    });
  });
}

// The enquiry stays in the browser until the visitor chooses an email action.
const enquiryForm=$('#enquiry-form');
if(enquiryForm){
  const params=new URLSearchParams(location.search);
  const field=name=>enquiryForm.elements.namedItem(name);
  if(params.get('type')==='partnership')field('type').value='partnership';
  if(params.get('model')){
    const candidate=params.get('model');if([...field('model').options].some(o=>o.value===candidate))field('model').value=candidate;
  }
  if(params.get('project'))field('description').value=`I would like to discuss a project related to ${params.get('project').slice(0,200)}.\n\nMy requirements: `;
  let draftText='';
  enquiryForm.addEventListener('submit',event=>{
    event.preventDefault();if(!enquiryForm.reportValidity())return;
    const data=Object.fromEntries(new FormData(enquiryForm));
    const typeText=field('type').selectedOptions[0].textContent;
    const draft=PortfolioLogic.makeEnquiry(data,typeText,enquiryForm.dataset.email);
    draftText=draft.text;
    $('#enquiry-text').value=draftText;
    $('#open-email-draft').href=draft.mailto;
    $('#enquiry-preview').hidden=false;
    $('#enquiry-status').textContent='Draft prepared. No message has been sent.';
    $('#enquiry-preview').scrollIntoView({behavior:motion(),block:'start'});
    $('#enquiry-text').focus({preventScroll:true});
  });
  $('#copy-enquiry').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(draftText);toast('Enquiry copied');$('#enquiry-status').textContent='Copied. Paste it into your email or messaging app.';}
    catch{$('#enquiry-text').focus();$('#enquiry-text').select();$('#enquiry-status').textContent='Text selected. Use your device’s Copy command.';}
  });
  $('#download-enquiry').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([draftText],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='project-enquiry.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('#enquiry-status').textContent='Text download prepared. No message has been sent.';
  });
}
$('#print-profile')?.addEventListener('click',()=>window.print());

// Gallery navigation respects the selected collection and native dialog focus.
const mediaData=$('#media-data');
if(mediaData){
  const media=JSON.parse(mediaData.textContent),dialog=$('#gallery-dialog'),mediaCards=$$('[data-media]');
  let visibleIndices=media.map((_,i)=>i),activeIndex=0,returnFocus=null;
  function renderImage(index){
    activeIndex=index;const item=media[index];
    $('#image-title').textContent=item.title;$('#large-image').src=(document.documentElement.dataset.basePath||'')+'/'+item.src;$('#large-image').alt=item.title;
    $('#image-caption').textContent=item.caption;
    $('#image-counter').textContent=`${visibleIndices.indexOf(index)+1} / ${visibleIndices.length}`;
  }
  function moveImage(direction){
    const next=PortfolioLogic.nextMedia(visibleIndices,activeIndex,direction);
    if(next!==null)renderImage(next);
  }
  mediaCards.forEach(card=>card.addEventListener('click',()=>{
    returnFocus=card;renderImage(Number(card.dataset.media));dialog.showModal();document.body.style.overflow='hidden';
  }));
  $('#close-image').addEventListener('click',()=>dialog.close());
  $('#previous-image').addEventListener('click',()=>moveImage(-1));$('#next-image').addEventListener('click',()=>moveImage(1));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();moveImage(event.key==='ArrowRight'?1:-1);}});
  dialog.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus();});
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
  $('#large-image').addEventListener('error',()=>{$('#image-caption').textContent='This image could not load. Please try another image or refresh the page.';});
  $$('[data-media-filter]').forEach(button=>button.addEventListener('click',()=>{
    const filter=button.dataset.mediaFilter;visibleIndices=[];
    $$('[data-media-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    mediaCards.forEach(card=>{card.hidden=filter!=='all'&&card.dataset.mediaCategory!==filter;if(!card.hidden)visibleIndices.push(Number(card.dataset.media));});
    $('#media-count').textContent=`${visibleIndices.length} visuals`;
  }));
}
