(() => {
  const bus=document.createElement('a');bus.href='#multi-sensor';bus.textContent='RS485 bus';document.querySelector('nav .links a[href="#connect"]').after(bus);
  const nav=document.querySelector('nav'),toggle=nav.querySelector('.menu-toggle'),links=[...nav.querySelectorAll('.links a')];
  new ResizeObserver(()=>document.documentElement.style.setProperty('--nav-height',nav.getBoundingClientRect().height+'px')).observe(nav);
  document.querySelectorAll('.wiring-scroll').forEach((region,i)=>{region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',i?'RS485 bus diagram, scroll horizontally to explore':'Connection diagram, scroll horizontally to explore');const hint=document.createElement('p');hint.className='diagram-hint';hint.textContent='Swipe the diagram, or focus it and use the arrow keys, to see every connection.';region.after(hint);});
  const plotLabel=document.createElement('p');plotLabel.className='plot-caption';plotLabel.textContent='Time: 0–200 ms · relative amplitude';document.querySelector('#fault-plot').before(plotLabel);
  const close=()=>{nav.dataset.open='false';toggle.setAttribute('aria-expanded','false');};
  toggle.onclick=()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.dataset.open=String(open);};
  nav.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
  links.forEach(a=>a.addEventListener('click',()=>{close();const target=document.querySelector(a.hash);if(target){target.tabIndex=-1;target.focus({preventScroll:true});}}));
  const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!visible)return;links.forEach(a=>{if(a.hash==='#'+visible.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -55% 0px',threshold:0});
  links.forEach(a=>{const target=document.querySelector(a.hash);if(target)observer.observe(target);});
  const strip=document.createElement('div');strip.className='resource-strip';strip.innerHTML='<div><strong>Ready for a closer look?</strong><p>Explore each device, compare sample signals or take the wiring guide to the bench.</p></div><a class="guide-link" href="#explore">Explore the hardware →</a>';document.querySelector('#film .wrap').append(strip);
})();
