/* Yahshua Marketing — shared behavior for service-area pages:
   theme persistence (shared key with the home page), nav border, reveals. */
(function(){
  var root=document.documentElement;
  try{
    var s=localStorage.getItem('ye-theme');
    if(s==='light'||s==='dark') root.setAttribute('data-theme',s);
    else root.removeAttribute('data-theme');
  }catch(e){}

  function current(){
    var a=root.getAttribute('data-theme');
    if(a==='light'||a==='dark') return a;
    return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }

  var tcEl=document.getElementById('tc');
  function tc(){ if(tcEl) tcEl.setAttribute('content',current()==='dark'?'#020202':'#FFFFFF'); }
  tc();

  var btn=document.getElementById('toggle');
  if(btn) btn.addEventListener('click',function(){
    var n=current()==='dark'?'light':'dark';
    root.setAttribute('data-theme',n);
    try{localStorage.setItem('ye-theme',n);}catch(e){}
    tc();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',tc);

  var nav=document.getElementById('nav');
  function solid(){ if(nav) nav.classList.toggle('solid',window.scrollY>8); }
  solid();
  window.addEventListener('scroll',solid,{passive:true});

  // phone links break out of an embedding frame so the dialer opens
  [].forEach.call(document.querySelectorAll('a[href^="tel:"]'),function(a){
    a.setAttribute('target','_top');
  });

  var items=[].slice.call(document.querySelectorAll('.rv'));
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(function(el){el.classList.add('in');});
    return;
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  },{rootMargin:'0px 0px -8% 0px',threshold:.12});
  items.forEach(function(el){io.observe(el);});
})();
