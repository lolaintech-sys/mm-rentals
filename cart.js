(function(){
  if(window.__mmrcReady) return; window.__mmrcReady=true;
  var SHELL='<button type="button" class="btn fab" data-fab hidden>Your quote <span class="count">0</span></button>'+
    '<div class="scrim" data-scrim hidden></div>'+
    '<div class="modal" data-modal hidden role="dialog" aria-label="Package details"><div class="dh"><h2 style="font-size:1.2rem">Customize your package</h2><button type="button" class="x" aria-label="Close">×</button></div><div class="mb"></div></div>'+
    '<div class="modal imodal" data-imodal hidden role="dialog" aria-modal="true" aria-labelledby="mmrc-ititle"><div class="dh"><h2 id="mmrc-ititle"></h2><button type="button" class="x" aria-label="Close">×</button></div><div class="ib"></div><div class="ifoot"></div></div>'+
    '<div class="modal alert" data-alert hidden role="alertdialog" aria-modal="true" aria-label="Outside our delivery area"><div class="ab"></div></div>'+
    '<aside class="drawer" data-drawer hidden aria-label="Your quote"><div class="dh"><h2 style="font-size:1.4rem">Your quote</h2><button type="button" class="x" aria-label="Close">×</button></div><div class="db"></div></aside>';
  function boot(){
  var dataEl=document.getElementById('mmrc-data');
  var D=window.MMRC_DATA||(dataEl&&JSON.parse(dataEl.textContent)); if(!D) return;
  var S=D.settings, DL=S.delivery;
  var root=document.createElement('div'); root.className='mmrc mmrc-shell'; root.innerHTML=SHELL; document.body.appendChild(root);
  function mounts(kind){return [].slice.call(document.querySelectorAll(kind?'[data-mmrc="'+kind+'"]':'[data-mmrc]'))}
  mounts().forEach(function(m){m.classList.add('mmrc')});
  function $all(sel){return [].slice.call(document.querySelectorAll(sel))}
  var KEY='mmrc-quote-v3', st={};
  try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){st={}}
  var items={}, pkgs={}; D.items.forEach(function(i){items[i.id]=i}); D.packages.forEach(function(p){pkgs[p.id]=p});
  // A variation with "uses" (e.g. "Full set - all sizes") is one of each listed variation: its stock is the fewest of those.
  D.items.forEach(function(i){(i.options||[]).forEach(function(o){if(o.uses&&o.uses.length)o.stock=Math.min.apply(null,o.uses.map(function(n){var x=i.options.filter(function(y){return y.name===n})[0];return x?(+x.stock||0):0}))})});
  function optPrices(i){return (i.options||[]).map(function(o){return +o.price||0}).filter(function(p){return p>0})}
  function basePrice(i){var p=optPrices(i);return p.length?Math.min.apply(null,p):i.price}
  function fromPrice(i){var p=optPrices(i);return p.length>1&&Math.min.apply(null,p)<Math.max.apply(null,p)}
  function showOptPrice(i,o){return o.price&&(fromPrice(i)||o.price!==basePrice(i))}
  var lines=(st.lines||[]).filter(function(l){return l.kind==='pkg'?pkgs[l.id]:items[l.id]});
  var ev={promo:st.promo||'',from:st.from||'',until:st.until||'',method:st.method||'Delivery',street:st.street||'',city:st.city||'',zip:st.zip||'',miles:st.miles==null?null:st.miles,milesFor:st.milesFor||''};
  var ui={cat:'all',q:'',open:false,sent:null,modal:null,item:null,looking:false,lookErr:''};
  var testMiles=(location.search.match(/[?&]miles=([\d.]+)/)||[])[1];
  var minDate=(function(){var d=new Date();d.setDate(d.getDate()+(S.lead_days||0));return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)})();

  function save(){try{localStorage.setItem(KEY,JSON.stringify({promo:ev.promo,lines:lines,from:ev.from,until:ev.until,method:ev.method,street:ev.street,city:ev.city,zip:ev.zip,miles:ev.miles,milesFor:ev.milesFor}))}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function money(n){return '$'+(Math.round(n*100)/100).toFixed(2)}
  function short(n){return '$'+(n%1?n.toFixed(2):n.toLocaleString('en-US'))}
  function toast(t){var el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=t;root.appendChild(el);setTimeout(function(){el.remove()},2600)}
  function pretty(d){if(!d)return '';var p=d.split('-');return new Date(+p[0],p[1]-1,+p[2]).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
  function slots(name){
    var bh=S.business_hours||{open:'08:00',close:'20:00'}, o=bh.open.split(':'), c=bh.close.split(':'), out=[];
    for(var m=+o[0]*60+ +o[1]; m<=+c[0]*60+ +c[1]; m+=30){var t=('0'+Math.floor(m/60)).slice(-2)+':'+('0'+m%60).slice(-2); out.push('<option value="'+t+'">'+clock(t)+'</option>')}
    return '<select name="'+name+'"><option value="">Choose a time</option>'+out.join('')+'</select>';
  }
  function clock(t){if(!t)return '';var p=t.split(':'),h=+p[0];return ((h%12)||12)+':'+p[1]+' '+(h<12?'am':'pm')}
  function addrStr(){return [ev.street,ev.city,'TX '+ev.zip].join(', ')}
  function count(){return lines.reduce(function(a,l){return a+(l.kind==='pkg'?1:l.qty)},0)}

  /* ---------- stock ---------- */
  function choiceOptions(c){ if(c.choices) return c.choices.map(function(a){return {name:a.name,add:a.add,item:a.item,photo:a.photo}}); if(c.options) return c.options; var it=items[c.item]; return (it&&it.options)||[] }
  function stockOf(id,opt){
    var it=items[id];
    if(it){ if(it.service) return Infinity; if(it.options&&it.options.length){var o=it.options.filter(function(o){return o.name===opt})[0]; return o?o.stock:0} return it.stock||0 }
    for(var k in pkgs){ var ch=pkgs[k].choices.filter(function(c){return c.item===id&&c.options})[0]; if(ch){var o=ch.options.filter(function(o){return o.name===opt})[0]; return o?o.stock:0} }
    return 0;
  }
  function usage(list){
    var u={}, alts=[];
    function add(id,opt,q){var k=id+'|'+(opt||''); u[k]=(u[k]||0)+q}
    list.forEach(function(l){
      if(l.kind==='item'){ var so=((items[l.id]||{}).options||[]).filter(function(o){return o.name===l.opt&&o.uses&&o.uses.length})[0]; if(so) so.uses.forEach(function(n){add(l.id,n,l.qty)}); else add(l.id,l.opt,l.qty); return }
      var p=pkgs[l.id];
      p.contents.forEach(function(c){ if(c.alt) alts.push(c); else add(c.item,'',c.qty) });
      p.choices.forEach(function(c){ var v=(l.sel||{})[c.key]; if(c.key==='arch'){var a=c.choices.filter(function(a){return a.name===v})[0]; if(a) add(a.item,'',1)} else add(c.item,v,c.qty) });
    });
    alts.forEach(function(c){ var k=c.item+'|'; if((u[k]||0)+c.qty<=stockOf(c.item,'')) add(c.item,'',c.qty); else add(c.alt.item,'',c.alt.qty) });
    return u;
  }
  function overflows(list){
    var u=usage(list), bad=[];
    for(var k in u){ var p=k.split('|'); if(u[k]>stockOf(p[0],p[1])) bad.push(k) }
    return bad;
  }
  function label(k){var p=k.split('|'),it=items[p[0]];return (it?it.name:p[0])+(p[1]?' ('+p[1]+')':'')}
  /* ---------- paused items: "Bookable again from" (back_on) set in the dashboard while Lola waits on an order ---------- */
  var today0=(function(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)})();
  function backOn(id){var it=items[id];return it&&it.back_on&&it.back_on>today0?it.back_on:''}
  function anyPaused(){return D.items.some(function(i){return backOn(i.id)})}
  function blocked(id){var b=backOn(id);return b&&ev.from&&ev.from<b?b:''}
  function mday(d){var p=d.split('-');return new Date(+p[0],p[1]-1,+p[2]).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
  function pausedTag(id){var b=backOn(id); if(!b) return ''; if(blocked(id)) return '<p class="tag paused">Not available for your dates · available from '+mday(b)+'</p>'; return ev.from?'':'<p class="tag paused">Available for events from '+mday(b)+'</p>'}
  /* Lines whose items (or package contents) can't be booked for the chosen start date. */
  function pausedIssues(){
    if(!ev.from) return [];
    return lines.map(function(l){
      var u=usage([l]),ids=[]; for(var k in u){var id=k.split('|')[0]; if(blocked(id)&&ids.indexOf(id)<0) ids.push(id)}
      if(!ids.length) return '';
      var first=ids.map(blocked).sort().pop();
      var what=l.kind==='pkg'?pkgs[l.id].name+' (it includes '+ids.map(function(id){return items[id].name}).join(', ')+')':items[l.id].name;
      return 'Not available for your dates: '+what+'. It\'s available for events from '+mday(first)+'. Remove it, or choose a start date on or after '+mday(first)+'.';
    }).filter(Boolean);
  }

  /* ---------- money ---------- */
  function linePrice(l){
    if(l.kind==='pkg'){var p=pkgs[l.id],add=0; p.choices.forEach(function(c){if(c.key==='arch'){var a=c.choices.filter(function(a){return a.name===(l.sel||{}).arch})[0]; if(a) add+=a.add}}); return p.price+add}
    return unitPrice(l)*l.qty*(perDay(l)?days():1);
  }
  function days(){
    if(!ev.from||!ev.until) return 1;
    var a=ev.from.split('-'),b=ev.until.split('-'), n=Math.round((Date.UTC(+b[0],b[1]-1,+b[2])-Date.UTC(+a[0],a[1]-1,+a[2]))/864e5);
    return Math.max(1,n);
  }
  function unitPrice(l){var it=items[l.id], o=(it.options||[]).filter(function(o){return o.name===l.opt})[0]; return (o&&o.price)||it.price}
  function perDay(l){return l.kind==='item'&&!items[l.id].service}
  function hasPkg(){return lines.some(function(l){return l.kind==='pkg'})}
  function deliveryFee(){
    if(ev.method!=='Delivery') return {fee:0,state:'pickup'};
    var m=ev.milesFor===addrStr()?ev.miles:null;
    if(testMiles&&!S.quote_endpoint) m=+testMiles;
    if(m==null) return {fee:null,state:'pending'};
    if(m>DL.max_miles) return {fee:null,state:'far',miles:m};
    var over=Math.max(0,m-DL.included_miles), extra=DL.rounding==='up'?Math.ceil(over):Math.floor(over);
    return {fee:(hasPkg()?0:DL.base_fee)+extra*DL.per_mile,state:'ok',miles:m,extra:extra};
  }
  function promoDef(){var c=(ev.promo||'').toUpperCase();return (S.promos||[]).filter(function(p){return p.code===c})[0]}
  /* {ok, msg} for the code entered, given the cart as it is now */
  function promoState(sub,d){
    if(!ev.promo) return null;
    var p=promoDef(); if(!p) return {ok:false,msg:'That code isn\'t valid.'};
    if(p.min_subtotal&&sub<p.min_subtotal) return {ok:false,p:p,msg:p.code+' is for rentals of '+short(p.min_subtotal)+' or more. Add '+money(p.min_subtotal-sub)+' to use it.'};
    if(p.type==='percent'){
      return {ok:true,p:p,msg:p.code+' applied: '+p.value+'% off'+(p.first_booking_only?'. It\'s for first bookings; we confirm it in your quote.':'.')};
    }
    if(p.type==='free_delivery'){
      if(hasPkg()) return {ok:false,p:p,msg:'Code '+p.code+' not applied: packages already include delivery within '+DL.included_miles+' miles.'};
      if(ev.method!=='Delivery') return {ok:false,p:p,msg:p.code+' is for free deliveries within '+p.max_miles+' miles of us. It isn\'t eligible for pickup rentals.'};
      if(d.state==='pending') return {ok:false,p:p,msg:'Enter your delivery address to apply '+p.code+'.'};
      if(d.state!=='ok'||d.miles>p.max_miles) return {ok:false,p:p,msg:p.code+' is for free deliveries within '+p.max_miles+' miles of us.'};
      return {ok:true,p:p,msg:p.code+' applied: free delivery and pickup.'};
    }
    return {ok:false,msg:'That code isn\'t valid.'};
  }
  function totals(){
    var rentals=0,services=0;
    lines.forEach(function(l){ var v=linePrice(l); if(l.kind==='item'&&items[l.id].service) services+=v; else rentals+=v });
    var d=deliveryFee(), sub=rentals+services, pr=promoState(sub,d), discount=0, waived=0;
    if(pr&&pr.ok&&pr.p.type==='percent') discount=Math.round(sub*pr.p.value)/100;
    if(pr&&pr.ok&&pr.p.type==='free_delivery'&&d.fee){ waived=d.fee; d=Object.assign({},d,{fee:0,waived:waived}) }
    var base=sub-discount+(d.fee||0), tax=Math.round(base*S.tax_rate*100)/100;
    return {rentals:rentals,services:services,discount:discount,promo:pr,delivery:d,tax:tax,total:base+tax};
  }
  function issues(){
    var out=pausedIssues(), t=totals();
    if(ev.method==='Pickup'){
      var no=lines.filter(function(l){return l.kind==='pkg'||!items[l.id].pickup}).map(function(l){return l.kind==='pkg'?pkgs[l.id].name:items[l.id].name});
      if(no.length) out.push('Delivery only: '+no.join(', ')+'. Choose delivery, or remove '+(no.length>1?'them':'it')+'.');
    }
    if(ev.method==='Delivery'&&!hasPkg()&&t.rentals<DL.min_rental_subtotal) out.push('Delivery needs a '+short(DL.min_rental_subtotal)+' rental minimum. Add '+money(DL.min_rental_subtotal-t.rentals)+' more, or choose pickup.');
    if(ev.method==='Delivery'&&t.delivery.state==='far') out.push(S.outside_area_short);
    if(hasPkg()&&days()>1) out.push('Packages are booked for one day: set your end date to '+pretty(ev.from)+' or the day after. For a longer package rental, contact us at hello@bookmicromoments.com or (936) 244-5270.');
    return out;
  }

  /* ---------- rendering ---------- */
  function eventBar(){
    return '<div class="evt">'+
      '<div class="seg" role="radiogroup" aria-label="Delivery or pickup">'+['Delivery','Pickup'].map(function(m){return '<button type="button" role="radio" aria-checked="'+(ev.method===m)+'" data-method="'+m+'">'+(m==='Delivery'?'Delivery':'I\'ll pick up')+'</button>'}).join('')+'</div>'+
      '<label>From<input type="date" data-ev="from" min="'+minDate+'" value="'+esc(ev.from)+'"></label>'+
      '<label>Until<input type="date" data-ev="until" min="'+esc(ev.from||minDate)+'" value="'+esc(ev.until)+'"></label>'+
      (ev.method==='Pickup'&&S.pickup_address?'<p class="pick"><b>Pickup location:</b> '+esc(S.pickup_address)+'</p>':'')+'</div>';
  }
  function optLbl(i){return i.option_label||((i.options||[]).some(function(o){return o.swatch})?'Color':'Option')}
  function chooseTxt(i){var l=optLbl(i).toLowerCase();return 'Choose '+(/^[aeiou]/.test(l)?'an ':'a ')+l}
  function itemCard(i){
    var opts=(i.options||[]).filter(function(o){return o.stock>0});
    var sel=opts.length>1?'<select aria-label="Option for '+esc(i.name)+'" data-opt><option value="">'+esc(chooseTxt(i))+'</option>'+opts.map(function(o){return '<option value="'+esc(o.name)+'">'+esc(o.name)+(showOptPrice(i,o)?' ('+short(o.price)+')':'')+'</option>'}).join('')+'</select>':(opts.length===1?'<p class="blurb">'+esc(opts[0].name)+'</p>':'');
    var n=(i.photos||[]).length;
    return '<article class="card" data-id="'+esc(i.id)+'">'+
      '<div class="ph"><button type="button" class="phb" data-open-item aria-label="Photos and details: '+esc(i.name)+'">'+(i.photo?'<img loading="lazy" src="'+esc(i.photo)+'" alt="'+esc(i.name)+'" onerror="this.remove()">':'')+
      (n>1?'<span class="pcount" aria-hidden="true">'+n+' photos</span>':'')+'</button></div>'+
      '<div class="body"><h3><button type="button" class="tbtn" data-open-item>'+esc(i.name)+'</button></h3>'+
      '<p class="price">'+(fromPrice(i)?'From ':'')+short(basePrice(i))+' <small>'+unitText(i)+'</small></p>'+
      (i.blurb?'<p class="blurb">'+esc(i.blurb)+'</p>':'')+
      (!i.pickup&&!i.service?'<p class="tag">Delivery only</p>':'')+pausedTag(i.id)+sel+
      '<div class="row"><span class="step"><button type="button" data-dec aria-label="Less">−</button><input type="number" inputmode="numeric" min="1" value="1" aria-label="Quantity of '+esc(i.name)+'"><button type="button" data-inc aria-label="More">+</button></span>'+
      '<button type="button" class="btn" data-add'+(blocked(i.id)?' disabled':'')+'>'+(blocked(i.id)?'Unavailable':'Add')+'</button></div></div></article>';
  }
  function unitText(i){var u=i.unit==='each'?'each':(i.unit==='per chair'?'per chair':'per '+i.unit); return i.service?esc(u):esc(u)+' · 1 day rental'}
  function pkgCard(p){
    return '<article class="card pkg" data-pkg="'+esc(p.id)+'">'+
      '<div class="ph">'+(p.photo?'<img loading="lazy" src="'+esc(p.photo)+'" alt="'+esc(p.name)+'" onerror="this.remove()">':'')+'</div>'+
      '<div class="body"><h3>'+esc(p.name)+'</h3>'+
      '<p class="price">'+short(p.price)+'</p>'+
      (p.separate_value>p.price?'<p class="blurb">If booked separately: '+short(p.separate_value)+'</p>':'')+
      '<p class="blurb">Delivery within '+DL.included_miles+' miles, setup and takedown included.</p>'+
      '<div class="row"><button type="button" class="btn" data-open-pkg>Choose colors &amp; add</button></div></div></article>';
  }
  function matches(m,x){
    var cols=(m.dataset.collections||'').split(',').map(function(c){return c.trim()}).filter(Boolean);
    var cats=(m.dataset.categories||'').split(',').map(function(c){return c.trim()}).filter(Boolean);
    if(!cols.length&&!cats.length) return true;
    return (cols.length&&(x.collections||[]).some(function(c){return cols.indexOf(c)>-1}))||(cats.length&&cats.indexOf(x.category)>-1);
  }
  function searchText(i){return (i.name+' '+(i.blurb||'')+' '+(i.options||[]).map(function(o){return o.name}).join(' ')).toLowerCase()}
  function renderList(m){
    var isCat=m.dataset.mmrc==='catalog', q=(m._q||'').trim().toLowerCase(), cur=m._cat||'all', groups=[];
    D.categories.forEach(function(c){
      if(isCat&&cur!=='all'&&cur!==c.id) return;
      var ps=D.packages.filter(function(p){return p.active!==false&&p.category===c.id&&matches(m,p)&&(!q||p.name.toLowerCase().indexOf(q)>-1)});
      var its=D.items.filter(function(i){return i.active!==false&&i.category===c.id&&matches(m,i)&&(!q||searchText(i).indexOf(q)>-1)});
      if(ps.length||its.length) groups.push({c:c,html:ps.map(pkgCard).join('')+its.map(itemCard).join('')});
    });
    var html=isCat?groups.map(function(g){return '<h3 class="sec-title">'+esc(g.c.name)+'</h3><div class="grid">'+g.html+'</div>'}).join('')
                  :(groups.length?'<div class="grid">'+groups.map(function(g){return g.html}).join('')+'</div>':'');
    var target=m;
    if(isCat){
      if(!m._built){
        var cats=D.categories.filter(function(c){return D.packages.some(function(p){return p.active!==false&&p.category===c.id&&matches(m,p)})||D.items.some(function(i){return i.active!==false&&i.category===c.id&&matches(m,i)})});
        m.innerHTML=(m.dataset.sidebar?'<div class="lay">'+sidebar()+'<div class="lmain">':'')+'<div class="bar"><div class="cats">'+(cats.length>1&&!m.dataset.sidebar?'<button type="button" class="cat" data-cat="all">All</button>'+cats.map(function(c){return '<button type="button" class="cat" data-cat="'+esc(c.id)+'">'+esc(c.name)+'</button>'}).join(''):'')+'</div><input class="search" type="search" placeholder="Search rentals" aria-label="Search rentals"></div><div class="mlist"></div>'+(m.dataset.sidebar?'</div></div>':'');
        m._built=1;
      }
      target=m.querySelector('.mlist');
      [].forEach.call(m.querySelectorAll('.cat'),function(b){b.setAttribute('aria-pressed',b.dataset.cat===cur)});
    }
    var body=html||'<p class="empty">'+(q?'Nothing matches that search.':'Nothing here right now.')+'</p>';
    if(m.dataset.sidebar&&!isCat){ m.innerHTML='<div class="lay">'+sidebar()+'<div class="lmain">'+body+'</div></div>'; return }
    target.innerHTML=body;
  }
  function navMatch(n,x){return x.active!==false&&((n.collections&&(x.collections||[]).some(function(c){return n.collections.indexOf(c)>-1}))||(n.categories&&n.categories.indexOf(x.category)>-1))}
  function navCount(n){return D.items.filter(function(i){return navMatch(n,i)}).length+D.packages.filter(function(p){return navMatch(n,p)}).length}
  function navHref(u){var m=window.MMRC_LINKMAP; return (m&&m[u])||u}
  function sidebar(){
    var here=location.pathname.replace(/\/$/,'')||'/', map=window.MMRC_LINKMAP||{};
    var items=(S.nav||[]).map(function(n){return {n:n,c:navCount(n)}}).filter(function(x){return x.c>0});
    return '<nav class="side" aria-label="Rental categories"><p class="side-h">Categories</p><ul>'+items.map(function(x){
      var on=here===x.n.url||(map[x.n.url]&&location.pathname.indexOf(map[x.n.url].replace(/^\.?\//,''))>-1);
      return '<li><a href="'+esc(navHref(x.n.url))+'"'+(on?' aria-current="page" class="on"':'')+'>'+esc(x.n.label)+'</a></li>'}).join('')+'</ul></nav>';
  }
  function renderCatalog(){mounts('list').concat(mounts('catalog')).forEach(renderList)}
  function renderTop(){mounts('dates').forEach(function(m){m.innerHTML=eventBar()})}

  function lineHtml(l,n){
    if(l.kind==='pkg'){
      var p=pkgs[l.id], sel=p.choices.map(function(c){var v=(l.sel||{})[c.key];var a=c.key==='arch'&&c.choices.filter(function(a){return a.name===v})[0];return esc(c.label)+': '+esc(v)+(a&&a.add?' (+'+short(a.add)+')':'')}).join('<br>');
      return '<div class="line"><img src="'+esc(p.photo)+'" alt="" onerror="this.style.visibility=\'hidden\'"><div><div class="nm">'+esc(p.name)+'</div><div class="op">'+sel+'</div><div class="op">'+money(linePrice(l))+'</div><button type="button" class="rm" data-rm="'+n+'">Remove</button></div><span></span></div>';
    }
    var i=items[l.id], lo=(i.options||[]).filter(function(o){return o.name===l.opt})[0];
    return '<div class="line"><img src="'+esc((lo&&lo.photo)||i.photo)+'" alt="" onerror="this.style.visibility=\'hidden\'">'+
      '<div><div class="nm">'+esc(i.name)+'</div>'+(l.opt?'<div class="op">'+esc(l.opt)+'</div>':'')+
      '<div class="op">'+money(unitPrice(l))+' × '+l.qty+(perDay(l)&&days()>1?' × '+days()+' days':'')+' = '+money(linePrice(l))+'</div>'+
      '<button type="button" class="rm" data-rm="'+n+'">Remove</button></div>'+
      '<span class="step"><button type="button" data-ldec="'+n+'" aria-label="Less">−</button><input type="number" min="1" value="'+l.qty+'" data-lq="'+n+'" aria-label="Quantity"><button type="button" data-linc="'+n+'" aria-label="More">+</button></span></div>';
  }
  function addressHtml(){
    if(ev.method!=='Delivery') return '<p class="note">'+esc(S.pickup_note)+'</p>';
    return '<div class="addr"><p class="legend">Delivery address</p>'+
      '<label>Street address<span class="ac"><input data-ev="street" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" placeholder="Start typing your address" value="'+esc(ev.street)+'"><span class="acl" role="listbox" hidden></span></span></label>'+
      '<div class="two"><label>City<input data-ev="city" autocomplete="address-level2" value="'+esc(ev.city)+'"></label>'+
      '<label>ZIP<input data-ev="zip" inputmode="numeric" autocomplete="postal-code" maxlength="10" value="'+esc(ev.zip)+'"></label></div></div>';
  }
  function totalsHtml(){
    var t=totals(), d=t.delivery, r='';
    r+='<div class="tr"><span>Rentals'+(hasPkg()?' and packages':'')+(days()>1?' ('+days()+'-day rental)':'')+'</span><span>'+money(t.rentals)+'</span></div>';
    if(t.services) r+='<div class="tr"><span>Setup services</span><span>'+money(t.services)+'</span></div>';
    if(t.discount) r+='<div class="tr disc"><span>Discount ('+esc(t.promo.p.code)+')</span><span>−'+money(t.discount)+'</span></div>';
    if(ev.method==='Pickup') r+='<div class="tr"><span>Pickup</span><span>'+money(0)+'</span></div>';
    else {
      var lbl='Delivery', val;
      if(d.state==='ok'){ lbl+=' ('+d.miles.toFixed(1)+' mi)'; val=d.waived?'<s>'+money(d.waived)+'</s> Free':money(d.fee) }
      else if(d.state==='far') val='Outside our area';
      else if(ui.looking) val='Checking…';
      else if(ui.lookErr) val='We\'ll confirm';
      else val=S.quote_endpoint?'Enter your address':'Shown once requests are on';
      r+='<div class="tr"><span>'+lbl+'</span><span>'+val+'</span></div>';
    }
    r+='<div class="tr"><span>Tax ('+(S.tax_rate*100).toFixed(2).replace(/0$/,'')+'%)</span><span>'+money(t.tax)+'</span></div>';
    r+='<div class="tr grand"><span>Estimated total with tax</span><span>'+money(t.total)+'</span></div>';
    var notes='';
    if(ev.method==='Delivery'){
      notes+='<p class="note">Delivery: '+short(DL.base_fee)+' covers the first '+DL.included_miles+' miles, then '+short(DL.per_mile)+' per mile. Packages include the first '+DL.included_miles+' miles.</p>';
      if(ui.lookErr) notes+='<p class="note">'+esc(ui.lookErr)+'</p>';
    }
    issues().forEach(function(x){notes+='<p class="warn">'+esc(x)+'</p>'});
    var pr=t.promo;
    notes+='<div class="promo">'+(ev.promo?
      '<p class="'+(pr&&pr.ok?'ok':'warn')+'">'+esc(pr?pr.msg:'')+' <button type="button" class="rm" data-promo-remove>Remove code</button></p>':
      '<label class="pl">Promo code<span class="prow"><input data-promo-input autocapitalize="characters" placeholder="Enter code"><button type="button" class="btn ghost" data-promo-apply>Apply</button></span></label>')+'</div>';
    return '<div class="tots" data-totals>'+r+notes+'</div>';
  }
  function formHtml(){
    var del=ev.method==='Delivery';
    return '<form novalidate data-form>'+
      '<div class="two"><label>First name<input name="first_name" autocomplete="given-name"></label><label>Last name<input name="last_name" autocomplete="family-name"></label></div>'+
      '<div class="two"><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><label>Email<input name="email" type="email" autocomplete="email"></label></div>'+
      (del?'<div class="two"><label>Event start time <span class="opt">(optional)</span><input name="start_time" type="time"></label>'+
        '<label>Preferred delivery window <span class="opt">(optional)</span><input name="delivery_window" placeholder="e.g. 9 to 11 am"></label></div>'+
        '<div class="two"><label>Setup location<select name="setup_location"><option value="">Choose</option><option>Indoor</option><option>Outdoor</option><option>Both</option></select></label>'+
        '<label>Setup surface <span class="opt">(optional)</span><input name="setup_surface" placeholder="Grass, patio, concrete…"></label></div>'+
        '<label>Delivery instructions <span class="opt">(optional)</span><input name="delivery_notes" placeholder="Gate code, parking, stairs"></label>'
       :'<div class="two"><label>Preferred pickup time <span class="opt pd-from">('+esc(pretty(ev.from)||'start date')+')</span>'+slots('pickup_time')+'</label>'+
        '<label>Preferred return time <span class="opt pd-until">('+esc(pretty(ev.until)||'end date')+')</span>'+slots('return_time')+'</label></div>'+(S.business_hours?'<p class="note">Pickups and returns: '+esc(S.business_hours.label)+'.</p>':''))+
      '<div class="two"><label>What are you celebrating? <span class="opt">(optional)</span><input name="occasion"></label>'+
      '<label>Guest count <span class="opt">(optional)</span><input name="guests" type="number" min="1" inputmode="numeric"></label></div>'+

      '<label>Notes <span class="opt">(optional)</span><textarea name="notes" rows="3" placeholder="Colors, timing, anything else"></textarea></label>'+
      '<label class="check"><input type="checkbox" name="terms"><span>I agree to Micro Moments Co. <a href="'+esc(S.terms_url)+'" target="_blank" rel="noopener">Rental Terms &amp; Conditions</a></span></label>'+
      '<label class="check"><input type="checkbox" name="marketing"><span>Send me news about new rentals and offers</span></label>'+
      '<p class="note">'+esc(S.terms_note)+'</p><p class="err" data-err role="alert"></p>'+
      '<button class="btn" type="submit">Request My Rentals</button></form>';
  }
  function renderCart(){
    var fab=root.querySelector('[data-fab]');
    fab.querySelector('.count').textContent=count(); fab.hidden=!lines.length&&!ui.sent;
    var d=root.querySelector('[data-drawer]'), s=root.querySelector('[data-scrim]');
    d.hidden=!ui.open; scrim(); lock();
    if(mounts('quote').length) fab.hidden=true;
    var targets=mounts('quote'); if(ui.open) targets.push(d.querySelector('.db'));
    targets.forEach(function(b){
      var keep={}, f=b.querySelector('[data-form]');
      if(f) [].forEach.call(f.elements,function(el){if(el.name) keep[el.name]=el.type==='checkbox'?el.checked:el.value});
      b.innerHTML=cartBody();
      var f2=b.querySelector('[data-form]');
      if(f2) [].forEach.call(f2.elements,function(el){if(el.name&&keep[el.name]!=null){if(el.type==='checkbox')el.checked=keep[el.name];else el.value=keep[el.name]}});
    });
  }
  function cartBody(){
    if(ui.sent) return '<div class="msg">'+ui.sent+'</div>';
    if(!lines.length) return '<p class="empty">Your quote is empty. Add a few pieces to get started.</p>';
    var noPick=ev.method==='Pickup'?lines.filter(function(l){return l.kind==='pkg'||!items[l.id].pickup}):[];
    if(noPick.length){
      var names=noPick.map(function(l){return l.kind==='pkg'?pkgs[l.id].name:items[l.id].name});
      var pk=noPick.some(function(l){return l.kind==='pkg'});
      return eventBar()+lines.map(lineHtml).join('')+
        '<div class="stopbox" role="alert"><p><b>'+(pk?'Packages':'Some items')+' can\'t be picked up.</b> '+esc(names.join(', '))+(names.length>1?' are':' is')+' delivered, set up and taken down by our team.</p>'+
        '<p>Switch to delivery to continue, or remove '+(names.length>1?'them':'it')+' to pick up the rest.</p>'+
        '<button type="button" class="btn" data-method="Delivery">Switch to delivery</button></div>';
    }
    return eventBar()+lines.map(lineHtml).join('')+addressHtml()+totalsHtml()+formHtml();
  }
  function refreshTotals(){$all('.mmrc [data-totals]').forEach(function(el){el.outerHTML=totalsHtml()})}

  function renderModal(){
    var m=root.querySelector('[data-modal]'); m.hidden=!ui.modal; scrim(); lock();
    if(!ui.modal) return;
    var p=pkgs[ui.modal.id], sel=ui.modal.sel;
    var add=0; p.choices.forEach(function(c){if(c.key==='arch'){var a=c.choices.filter(function(a){return a.name===sel.arch})[0];if(a)add+=a.add}});
    var keys=p.choices.map(function(c){return c.key});
    if(ui.modal.open===undefined) ui.modal.open=keys[0];
    var ch=p.choices.map(function(c,idx){
      var opts=choiceOptions(c).filter(function(o){ if(c.key==='arch') return stockOf(o.item,'')>=1&&!blocked(o.item); return o.stock==null||o.stock>0 });
      if(sel[c.key]!=null&&!opts.some(function(o){return o.name===sel[c.key]})) delete sel[c.key]; if(sel[c.key]==null&&opts.length===1) sel[c.key]=opts[0].name;
      var cur=opts.filter(function(o){return o.name===sel[c.key]})[0]||{}, open=ui.modal.open===c.key, done=ui.modal.picked&&ui.modal.picked[c.key];
      var thumb=cur.photo?'<img src="'+esc(cur.photo)+'" alt="">':(cur.swatch?'<span class="sw" style="background:'+esc(cur.swatch)+'"></span>':'');
      var head='<button type="button" class="chead" data-open-choice="'+esc(c.key)+'" aria-expanded="'+open+'">'+
        '<span class="step-n">'+(idx+1)+'</span><span class="cht"><b>'+esc(c.label)+'</b>'+(c.qty>1?' <span class="opt">(for '+c.qty+')</span>':'')+
        '<br><span class="chosen">'+(cur.name?esc(cur.name)+(cur.add?' (+'+short(cur.add)+')':''):'<span class="need-t">Choose one</span>')+'</span></span>'+
        (!open&&thumb?'<span class="cthumb">'+thumb+'</span>':'')+'<span class="chg">'+(open?'':'Change')+'</span></button>';
      if(!open) return '<div class="ch closed">'+head+'</div>';
      return '<div class="ch">'+head+
        (cur.photo?'<img class="chimg" src="'+esc(cur.photo)+'" alt="'+esc(c.label+': '+cur.name)+'">':'')+
        '<div class="tiles" role="radiogroup" aria-label="'+esc(c.label)+'">'+opts.map(function(o){
          var on=o.name===sel[c.key];
          return '<button type="button" class="tile" role="radio" aria-checked="'+on+'" data-choice="'+esc(c.key)+'" data-val="'+esc(o.name)+'" title="'+esc(o.name)+'">'+
            (o.photo?'<img src="'+esc(o.photo)+'" alt="" loading="lazy">':(o.swatch?'<span class="sw" style="background:'+esc(o.swatch)+'"></span>':''))+
            '<span class="tl">'+esc(o.name)+(o.add?' +'+short(o.add):'')+'</span></button>'}).join('')+'</div>'+
        '<button type="button" class="btn ghost nextc" data-next-choice="'+esc(c.key)+'">'+(idx<keys.length-1?'Next: '+esc(p.choices[idx+1].label):'Done')+'</button></div>';
    }).join('');
    m.querySelector('.mb').innerHTML=
      (p.photo?'<img class="mimg" src="'+esc(p.photo)+'" alt="'+esc(p.name)+'">':'')+
      '<h2>'+esc(p.name)+'</h2><p class="price">'+short(p.price+add)+(p.separate_value>p.price?' <small>If booked separately: '+short(p.separate_value+add)+'</small>':'')+'</p>'+
      '<p class="legend">What\'s included</p><ul class="inc">'+p.includes.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'+
      '<div class="choices">'+ch+'</div>'+
      '<p class="note">Colors only list what we have enough of for this size. Need something else? Ask in the notes.</p>'+
      '<p class="note">Packages are a one-day rental: your end date can be the same day or the day after.</p>'+
      '<button type="button" class="btn" data-add-pkg>Add to quote · '+short(p.price+add)+'</button>';
  }
  /* ---------- item detail popup: gallery, full description, options, add to quote ---------- */
  function itemOpts(it){return (it.options||[]).filter(function(o){return o.stock>0})}
  function itemPics(it,o){
    var out=[]; [o&&o.photo].concat(it.photos&&it.photos.length?it.photos:[it.photo]).forEach(function(u){if(u&&out.indexOf(u)<0)out.push(u)}); return out;
  }
  function renderItem(){
    var m=root.querySelector('[data-imodal]'); m.hidden=!ui.item; scrim(); lock();
    if(!ui.item) return;
    var it=items[ui.item.id], opts=itemOpts(it);
    if(!opts.some(function(o){return o.name===ui.item.opt})) ui.item.opt=opts.length===1?opts[0].name:'';
    var o=opts.filter(function(o){return o.name===ui.item.opt})[0], pics=itemPics(it,o), unit=(o&&o.price)||it.price, qty=ui.item.qty;
    var lbl=it.option_label||(opts.some(function(o){return o.swatch})?'Color':'Option');
    var gal='<div class="gal"><div class="gtrack" data-gtrack tabindex="0" aria-label="Photos of '+esc(it.name)+'">'+pics.map(function(u,n){return '<img src="'+esc(u)+'" alt="'+esc(it.name+(pics.length>1?', photo '+(n+1)+' of '+pics.length:''))+'"'+(n?' loading="lazy"':'')+'>'}).join('')+'</div>'+
      (pics.length>1?'<button type="button" class="gnav gprev" data-gstep="-1">‹</button><button type="button" class="gnav gnext" data-gstep="1">›</button><span class="gcount" aria-hidden="true"><span data-gnum>1</span> / '+pics.length+'</span>':'')+'</div>'+
      (pics.length>1?'<div class="gthumbs">'+pics.map(function(u,n){return '<button type="button" class="gthumb" data-gthumb="'+n+'" aria-label="Photo '+(n+1)+' of '+pics.length+'" aria-current="'+(n===0)+'"><img src="'+esc(u)+'" alt=""></button>'}).join('')+'</div>':'');
    var choose=opts.length>1?'<div class="iopts"><p class="legend">'+esc(lbl)+': <span class="chosen">'+(ui.item.opt?esc(ui.item.opt):'<span class="need-t">'+esc(chooseTxt(it))+'</span>')+'</span></p>'+
      '<div class="tiles" role="radiogroup" aria-label="'+esc(lbl)+'">'+opts.map(function(x){var on=x.name===ui.item.opt;
        return '<button type="button" class="tile" role="radio" aria-checked="'+on+'" data-iopt="'+esc(x.name)+'" title="'+esc(x.name)+'">'+
          (x.photo?'<img src="'+esc(x.photo)+'" alt="">':(x.swatch?'<span class="sw" style="background:'+esc(x.swatch)+'"></span>':''))+
          '<span class="tl">'+esc(x.name)+(showOptPrice(it,x)?' '+short(x.price):'')+'</span></button>'}).join('')+'</div></div>'
      :(opts.length===1?'<p class="legend">'+esc(lbl)+': <span class="chosen">'+esc(opts[0].name)+'</span></p>':'');
    m.querySelector('#mmrc-ititle').textContent=it.name;
    m.querySelector('.ib').innerHTML='<div class="igrid"><div>'+gal+'</div><div class="iinfo">'+
      '<p class="price">'+short(unit)+' <small>'+unitText(it)+'</small></p>'+
      (!it.pickup&&!it.service?'<p class="tag">Delivery only</p>':'')+pausedTag(it.id)+choose+
      '<div class="idesc">'+(it.description||(it.blurb?'<p>'+esc(it.blurb)+'</p>':''))+'</div></div></div>';
    m.querySelector('.ifoot').innerHTML='<span class="step"><button type="button" data-iqd="-1" aria-label="Less">−</button><input type="number" inputmode="numeric" min="1" value="'+qty+'" data-iqty aria-label="Quantity of '+esc(it.name)+'"><button type="button" data-iqd="1" aria-label="More">+</button></span>'+
      (blocked(it.id)?'<button type="button" class="btn" data-add-item disabled>Not available for your dates</button>':'<button type="button" class="btn" data-add-item>Add to quote · '+short(unit*qty)+'</button>');
    var tr=m.querySelector('[data-gtrack]');
    tr.addEventListener('scroll',function(){clearTimeout(tr._t);tr._t=setTimeout(function(){gallerySync(m)},60)},{passive:true});
  }
  function gallerySync(m){
    var tr=m.querySelector('[data-gtrack]'); if(!tr) return; var n=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));
    var num=m.querySelector('[data-gnum]'); if(num) num.textContent=n+1;
    [].forEach.call(m.querySelectorAll('[data-gthumb]'),function(b){b.setAttribute('aria-current',+b.dataset.gthumb===n)});
  }
  function galleryGo(n,step){
    var m=root.querySelector('[data-imodal]'), tr=m.querySelector('[data-gtrack]'), k=tr.children.length;
    if(step) n=(Math.round(tr.scrollLeft/tr.clientWidth)+step+k)%k;
    tr.scrollTo({left:n*tr.clientWidth,behavior:'smooth'});
  }
  function itemQty(q){
    if(!ui.item) return; ui.item.qty=Math.max(1,q|0||1);
    var it=items[ui.item.id], o=itemOpts(it).filter(function(o){return o.name===ui.item.opt})[0], m=root.querySelector('[data-imodal]');
    m.querySelector('[data-iqty]').value=ui.item.qty; if(!blocked(it.id)) m.querySelector('[data-add-item]').textContent='Add to quote · '+short(((o&&o.price)||it.price)*ui.item.qty);
  }
  function openItem(card,from){
    var s=card.querySelector('[data-opt]'), q=card.querySelector('.row input');
    ui.item={id:card.dataset.id,opt:s?s.value:'',qty:Math.max(1,(q&&q.value|0)||1),from:from};
    renderItem(); root.querySelector('[data-imodal] .x').focus();
  }
  function closeItem(){var f=ui.item&&ui.item.from; ui.item=null; renderItem(); if(f&&f.isConnected) f.focus({preventScroll:true})}
  function scrim(){root.querySelector('[data-scrim]').hidden=!ui.open&&!ui.modal&&!ui.item}
  function lock(){document.documentElement.classList.toggle('mmrc-lock',!!(ui.item||ui.modal||ui.open))}

  function render(){renderTop();renderCatalog();renderCart();renderModal();renderItem()}

  function showOutside(){
    var a=root.querySelector('[data-alert]');
    a.querySelector('.ab').innerHTML='<h2>'+esc(S.outside_area_title)+'</h2><p>'+esc(S.outside_area_text)+'</p>'+
      '<div class="arow"><button type="button" class="btn" data-alert-pickup>Switch to pickup</button><button type="button" class="btn ghost" data-alert-close>Change the address</button></div>';
    a.hidden=false; root.querySelector('[data-scrim]').hidden=false; a.querySelector('button').focus();
  }
  function closeAlert(){root.querySelector('[data-alert]').hidden=true; scrim()}

  /* ---------- actions ---------- */
  function tryLines(next,okMsg){
    // Lola (Nov 17): never block a quantity. Requests over what she owns arrive flagged "Short" in the Availability column.
    lines=next; save(); renderCart(); if(okMsg) toast(okMsg); return true;
  }
  function addItem(id,opt,qty){
    qty=Math.max(1,qty|0); var next=lines.map(function(l){return Object.assign({},l)});
    var l=next.filter(function(l){return l.kind==='item'&&l.id===id&&l.opt===opt})[0];
    if(l) l.qty+=qty; else next.push({kind:'item',id:id,opt:opt||'',qty:qty});
    if(tryLines(next,'Added to your quote')) return true;
    {
      // add as many as fit
      for(var q=qty-1;q>0;q--){var n2=lines.map(function(l){return Object.assign({},l)});var l2=n2.filter(function(l){return l.kind==='item'&&l.id===id&&l.opt===opt})[0]; if(l2) l2.qty+=q; else n2.push({kind:'item',id:id,opt:opt||'',qty:q}); if(!overflows(n2).length){lines=n2;save();renderCart();toast('Added '+q+'. Need more? Ask in the notes.');return true}}
      return false;
    }
  }
  function setLine(n,q){
    var next=lines.map(function(l){return Object.assign({},l)}); if(!next[n]) return;
    next[n].qty=Math.max(1,q|0||1);
    if(!tryLines(next)) renderCart();
  }
  function lookup(){
    if(ev.method!=='Delivery'||!ev.street||!ev.city||!/^\d{5}/.test(ev.zip)) {refreshTotals();return}
    var a=addrStr(); if(ev.milesFor===a&&ev.miles!=null){refreshTotals();return}
    if(!S.quote_endpoint){refreshTotals(); if(testMiles&&+testMiles>DL.max_miles) showOutside(); return}
    ui.looking=true; ui.lookErr=''; refreshTotals();
    fetch(S.quote_endpoint+'?action=distance&address='+encodeURIComponent(a)).then(function(r){return r.json()}).then(function(j){
      ui.looking=false; if(j&&j.ok){ev.miles=j.miles;ev.milesFor=a;save(); if(j.miles>DL.max_miles) showOutside()} else ui.lookErr='We couldn\'t find that address. Check it, or send your request and we\'ll confirm delivery.';
      refreshTotals();
    }).catch(function(){ui.looking=false;ui.lookErr='We couldn\'t check the distance right now. Send your request and we\'ll confirm delivery.';refreshTotals()});
  }

  /* ---------- address suggestions ---------- */
  var acTimer=null, acSeq=0;
  function acBox(inp){return inp.parentNode.querySelector('.acl')}
  function acHide(inp){var b=acBox(inp);if(b){b.hidden=true;b.innerHTML=''} inp.setAttribute('aria-expanded','false'); inp._ac=null}
  function acSuggest(inp){
    var q=inp.value.trim(); clearTimeout(acTimer);
    if(!S.quote_endpoint||q.length<5||!/\d/.test(q)){acHide(inp);return}
    acTimer=setTimeout(function(){
      var my=++acSeq;
      fetch(S.quote_endpoint+'?action=suggest&q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){
        if(my!==acSeq||!inp.isConnected||inp.value.trim()!==q) return;
        var list=(j&&j.ok&&j.results)||[]; if(!list.length){acHide(inp);return}
        inp._ac=list; var b=acBox(inp);
        b.innerHTML=list.map(function(a,i){return '<button type="button" role="option" class="aco" data-ac="'+i+'">'+esc(a.label)+'</button>'}).join('');
        b.hidden=false; inp.setAttribute('aria-expanded','true');
      }).catch(function(){acHide(inp)});
    },350);
  }
  function acPick(inp,a){
    ev.street=a.street; if(a.city) ev.city=a.city; if(a.zip) ev.zip=a.zip; save(); acHide(inp);
    $all('.mmrc [data-ev=street]').forEach(function(x){x.value=ev.street});
    $all('.mmrc [data-ev=city]').forEach(function(x){x.value=ev.city});
    $all('.mmrc [data-ev=zip]').forEach(function(x){x.value=ev.zip});
    if(!a.exact) inp.focus(); else { lookup(); if(!a.city){var cf=inp.closest('.mmrc').querySelector('[data-ev=city]'); if(cf) cf.focus()} }
  }

  function summary(f,t){
    var out=lines.map(function(l){
      if(l.kind==='pkg'){var p=pkgs[l.id];return p.name+' = '+money(linePrice(l))+'\n   '+p.choices.map(function(c){return c.label+': '+(l.sel||{})[c.key]}).join('\n   ')}
      var i=items[l.id]; return l.qty+' × '+i.name+(l.opt?' ('+l.opt+')':'')+(perDay(l)&&days()>1?', '+days()+' days':'')+' = '+money(linePrice(l));
    });
    var d=t.delivery, del=ev.method==='Pickup'?'Pickup at '+(S.pickup_address||''):('Delivery to '+addrStr()+': '+(d.state==='ok'?money(d.fee)+' ('+d.miles.toFixed(1)+' mi)':'to confirm'));
    if(t.delivery.waived) del+=' (was '+money(t.delivery.waived)+', waived with '+t.promo.p.code+')';
    return out.join('\n')+'\n\nRentals: '+money(t.rentals)+(t.services?'\nSetup services: '+money(t.services):'')+(t.discount?'\nDiscount ('+t.promo.p.code+'): -'+money(t.discount):'')+'\n'+del+'\nTax: '+money(t.tax)+'\nEstimated total with tax: '+money(t.total)+
      '\n\nRental period: '+pretty(ev.from)+' to '+pretty(ev.until)+' ('+days()+(days()>1?' days':' day')+')'+'\nName: '+f.name+'\nPhone: '+f.phone+'\nEmail: '+f.email+
      (f.pickup_time?'\nPreferred pickup: '+pretty(ev.from)+' at '+clock(f.pickup_time):'')+(f.return_time?'\nPreferred return: '+pretty(ev.until)+' at '+clock(f.return_time):'')+(f.start_time?'\nEvent start: '+f.start_time:'')+(f.delivery_window?'\nDelivery window: '+f.delivery_window:'')+(f.setup_location?'\nSetup location: '+f.setup_location:'')+(f.setup_surface?'\nSurface: '+f.setup_surface:'')+(f.delivery_notes?'\nDelivery instructions: '+f.delivery_notes:'')+
      (f.occasion?'\nOccasion: '+f.occasion:'')+(f.guests?'\nGuests: '+f.guests:'')+(f.promo?'\nPromo code: '+f.promo:'')+(f.notes?'\nNotes: '+f.notes:'')+'\nMarketing emails: '+(f.marketing?'yes':'no');
  }
  function submit(form){
    var err=form.querySelector('[data-err]'), f={};
    [].forEach.call(form.elements,function(el){if(!el.name)return; f[el.name]=el.type==='checkbox'?el.checked:String(el.value).trim()});
    var miss=[];
    if(!ev.from) miss.push('start date'); if(!ev.until) miss.push('end date');
    if(ev.method==='Delivery'){if(!ev.street)miss.push('street address');if(!ev.city)miss.push('city');if(!ev.zip)miss.push('ZIP')}
    f.name=((f.first_name||'')+' '+(f.last_name||'')).trim();
    if(!f.first_name)miss.push('first name'); if(!f.last_name)miss.push('last name'); if(!f.phone)miss.push('phone'); if(!f.email)miss.push('email');
    if(ev.method==='Delivery'&&!f.setup_location) miss.push('setup location');
    if(ev.method==='Pickup'){if(!f.pickup_time)miss.push('pickup time');if(!f.return_time)miss.push('return time')}
    if(miss.length){err.textContent='Please add your '+miss.join(', ')+'.';return}
    if(ev.until<ev.from){err.textContent='The end date is before the start date.';return}
    if(ev.from<minDate){err.textContent='The earliest start date we can take online is '+pretty(minDate)+'. For sooner, call or text us.';return}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)){err.textContent='Please check your email address.';return}
    if(!f.terms){err.textContent='Please agree to the Rental Terms & Conditions.';return}
    if(ev.method==='Delivery'&&totals().delivery.state==='far'){showOutside();return}
    var iss=issues(); if(iss.length){err.textContent=iss[0];return}
    var t=totals(); f.promo=t.promo&&t.promo.ok?t.promo.p.code:(ev.promo?ev.promo+' (not applied)':''); f.from=ev.from; f.until=ev.until; f.method=ev.method; if(ev.method==='Pickup'){ f.pickup_address=S.pickup_address||''; f.pickup_when=pretty(ev.from)+' at '+clock(f.pickup_time); f.return_when=pretty(ev.until)+' at '+clock(f.return_time); } f.street=ev.street; f.city=ev.city; f.zip=ev.zip;
    var src=null; try{src=JSON.parse(localStorage.getItem('mm-src-v1')||'null'); if(src&&Date.now()-src.t>90*864e5)src=null}catch(e){}
    var payload={submitted:new Date().toISOString(),page:location.href,form:f,source:src?{channel:src.c,detail:src.d,landing:src.l}:{channel:'Direct',detail:'',landing:''},
      lines:lines.map(function(l){var name=l.kind==='pkg'?pkgs[l.id].name:items[l.id].name;return {kind:l.kind,id:l.id,option:l.opt||'',choices:l.sel||null,qty:l.qty||1,amount:linePrice(l),text:(l.kind==='pkg'?name+' ['+pkgs[l.id].choices.map(function(c){return (l.sel||{})[c.key]}).join(', ')+']':l.qty+' × '+name+(l.opt?' ('+l.opt+')':'')+(perDay(l)&&days()>1?', '+days()+' days':''))+' = '+money(linePrice(l))}}),
      totals:{rentals:t.rentals,services:t.services,discount:t.discount,delivery_waived:t.delivery.waived||0,delivery:t.delivery.fee,miles:t.delivery.miles||null,tax:t.tax,total:t.total},summary:summary(f,t),
      usage:(function(){var u=usage(lines),out=[];for(var k in u){var p=k.split('|'),own=stockOf(p[0],p[1]);if(isFinite(own))out.push({key:k,name:label(k),qty:u[k],owned:own})}return out})()};
    var btn=form.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Sending…'; err.textContent='';
    function done(){
      /* GA4: one generate_lead per quote request, sent only after the quote handler answers ok.
         Uses the GA4 tag Squarespace already loads. form_name rental_quote tells it apart from the
         inquiry and proposal forms. value = estimated total with tax. No personal data. */
      try{ if(typeof window.gtag==='function') window.gtag('event','generate_lead',{form_name:'rental_quote',value:Math.round(t.total*100)/100,currency:'USD',fulfillment:ev.method==='Pickup'?'pickup':'delivery'}) }catch(e){}
      var td=new Date(),today=td.getFullYear()+'-'+('0'+(td.getMonth()+1)).slice(-2)+'-'+('0'+td.getDate()).slice(-2);
      ui.sent='<strong>Thank you, '+esc(f.name.split(' ')[0])+'!</strong><br>Your request for '+esc(pretty(ev.from))+(ev.until!==ev.from?' to '+esc(pretty(ev.until)):'')+' is in. Estimated total: '+money(t.total)+'.<br>'+(ev.from===today
        ?'Same-day request received! We offer same-day pickup and delivery when items and our schedule allow. We\'re checking your order now and will confirm at '+esc(f.email)+' or by phone as soon as possible.'
        :'We\'ll confirm availability and email your finalized quote to '+esc(f.email)+' within the same business day'+(S.business_hours?' ('+esc(S.business_hours.label)+')':'')+'.');
      lines=[];save();render();
    }
    if(S.quote_endpoint){
      fetch(S.quote_endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)})
        .then(function(r){return r.json()}).then(function(j){if(j&&j.ok) done(); else throw 0})
        .catch(function(){btn.disabled=false;btn.textContent='Request My Rentals';err.innerHTML='Something went wrong sending your request.'+(S.fallback_email?' <a href="mailto:'+esc(S.fallback_email)+'?subject='+encodeURIComponent('Rental quote request')+'&body='+encodeURIComponent(payload.summary)+'">Email it to us instead</a>.':' Please try again.')});
    } else {
      console.log('[mmrc] preview mode, request not sent:',payload);
      ui.sent='<strong>Preview mode.</strong> Nothing was sent because quote requests aren\'t turned on yet. This is what you would receive:<pre style="white-space:pre-wrap;font-size:.8rem;margin-top:10px">'+esc(payload.summary)+'</pre>';
      lines=[];save();render();
    }
  }

  document.addEventListener('mousedown',function(e){
    var o=e.target.closest&&e.target.closest('.aco'); if(!o) return;
    e.preventDefault(); var inp=o.closest('.ac').querySelector('input'); if(inp&&inp._ac) acPick(inp,inp._ac[+o.dataset.ac]);
  });
  document.addEventListener('focusout',function(e){var t=e.target; if(t.dataset&&t.dataset.ev==='street') setTimeout(function(){acHide(t)},150)});
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.hasAttribute&&e.target.hasAttribute('data-promo-input')){e.preventDefault();ev.promo=(e.target.value||'').trim().toUpperCase();save();refreshTotals();return}
    var t=e.target; if(!t.dataset||t.dataset.ev!=='street'||!t._ac) return;
    var b=acBox(t), opts=[].slice.call(b.querySelectorAll('.aco')), cur=opts.findIndex(function(o){return o.classList.contains('on')});
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault(); if(cur>-1)opts[cur].classList.remove('on'); cur=e.key==='ArrowDown'?Math.min(opts.length-1,cur+1):Math.max(0,cur-1); opts[cur].classList.add('on')}
    else if(e.key==='Enter'&&cur>-1){e.preventDefault(); acPick(t,t._ac[cur])}
    else if(e.key==='Escape'){acHide(t)}
  });
  document.addEventListener('click',function(e){
    var t=e.target.closest('button'); if(!t||!t.closest('.mmrc')) return;
    var c=t.closest('.card');
    if(t.hasAttribute('data-alert-pickup')){closeAlert();ev.method='Pickup';save();renderTop();renderCart();return}
    if(t.hasAttribute('data-alert-close')){closeAlert();var st=document.querySelector('.mmrc [data-ev=street]');if(st)st.focus();return}
    if(t.hasAttribute('data-promo-apply')){var pi=t.parentNode.querySelector('[data-promo-input]');ev.promo=(pi.value||'').trim().toUpperCase();save();refreshTotals();return}
    if(t.hasAttribute('data-promo-remove')){ev.promo='';save();refreshTotals();return}
    if(t.dataset.method){ev.method=t.dataset.method;save();renderTop();renderCart();lookup();return}
    if(t.classList.contains('cat')){var cm=t.closest('[data-mmrc]');cm._cat=t.dataset.cat;renderList(cm);return}
    if(c&&t.hasAttribute('data-open-item')){openItem(c,t);return}
    if(ui.item&&t.closest('[data-imodal]')){
      if(t.dataset.iopt!=null){var ib=root.querySelector('[data-imodal] .ib'),y2=ib.scrollTop;ui.item.opt=t.dataset.iopt;renderItem();ib.scrollTop=y2;var sel=root.querySelector('[data-imodal] [data-iopt][aria-checked="true"]');if(sel)sel.focus({preventScroll:true});return}
      if(t.dataset.gthumb!=null){galleryGo(+t.dataset.gthumb);return}
      if(t.dataset.gstep!=null){galleryGo(0,+t.dataset.gstep);return}
      if(t.dataset.iqd!=null){itemQty(ui.item.qty+(+t.dataset.iqd));return}
      if(t.hasAttribute('data-add-item')){if(itemOpts(items[ui.item.id]).length>1&&!ui.item.opt){toast(chooseTxt(items[ui.item.id])+' first');var tg=root.querySelector('[data-imodal] .iopts');if(tg){tg.classList.add('need');tg.scrollIntoView({block:'nearest'})}return}var iq=root.querySelector('[data-imodal] [data-iqty]');ui.item.qty=Math.max(1,iq.value|0||1);if(addItem(ui.item.id,ui.item.opt||'',ui.item.qty))closeItem();return}
      if(t.classList.contains('x')){closeItem();return}
    }
    if(c&&(t.hasAttribute('data-inc')||t.hasAttribute('data-dec'))){var inp=c.querySelector('input');inp.value=Math.max(1,(inp.value|0)+(t.hasAttribute('data-inc')?1:-1));return}
    if(c&&t.hasAttribute('data-add')){var s=c.querySelector('[data-opt]'),it=items[c.dataset.id];if(s&&!s.value){s.classList.add('need');s.focus();toast(chooseTxt(it)+' first');return}var only=(it.options||[]).filter(function(o){return o.stock>0});addItem(c.dataset.id,s?s.value:(only[0]&&only[0].name)||'',c.querySelector('input').value);return}
    if(c&&t.hasAttribute('data-open-pkg')){ui.modal={id:c.dataset.pkg,sel:{}};renderModal();root.querySelector('[data-modal] .x').focus();return}
    if(t.dataset.choice!=null&&t.dataset.val!=null&&ui.modal){var mm=root.querySelector('[data-modal]'),y=mm.scrollTop;ui.modal.sel[t.dataset.choice]=t.dataset.val;ui.modal.picked=ui.modal.picked||{};ui.modal.picked[t.dataset.choice]=1;renderModal();mm.scrollTop=y;return}
    if(t.dataset.openChoice!=null&&ui.modal){ui.modal.open=ui.modal.open===t.dataset.openChoice?null:t.dataset.openChoice;renderModal();var oc=root.querySelector('[data-modal] .ch:not(.closed)');if(oc)oc.scrollIntoView({block:'nearest'});return}
    if(t.dataset.nextChoice!=null&&ui.modal){var ks=pkgs[ui.modal.id].choices.map(function(c){return c.key}),ix=ks.indexOf(t.dataset.nextChoice);ui.modal.picked=ui.modal.picked||{};ui.modal.picked[t.dataset.nextChoice]=1;ui.modal.open=ks[ix+1]||null;renderModal();var nc=root.querySelector('[data-modal] .ch:not(.closed)')||root.querySelector('[data-add-pkg]');if(nc)nc.scrollIntoView({block:'nearest'});return}
    if(t.hasAttribute('data-add-pkg')){var miss=pkgs[ui.modal.id].choices.filter(function(c){return ui.modal.sel[c.key]==null})[0];if(miss){ui.modal.open=miss.key;renderModal();toast('Choose your '+miss.label.toLowerCase()+' first');var oc2=root.querySelector('[data-modal] .ch:not(.closed)');if(oc2)oc2.scrollIntoView({block:'nearest'});return}var next=lines.concat([{kind:'pkg',id:ui.modal.id,sel:Object.assign({},ui.modal.sel),qty:1}]);if(tryLines(next,'Package added to your quote')){ui.modal=null;renderModal()}return}
    if(t.hasAttribute('data-fab')){ui.open=true;if(ui.sent&&lines.length)ui.sent=null;renderCart();root.querySelector('[data-drawer] .x').focus();return}
    if(t.classList.contains('x')){if(t.closest('[data-modal]')){ui.modal=null;renderModal()}else{ui.open=false;if(ui.sent)ui.sent=null;renderCart()}return}
    if(t.dataset.rm!=null){lines.splice(+t.dataset.rm,1);save();renderCart();return}
    if(t.dataset.linc!=null){setLine(+t.dataset.linc,lines[+t.dataset.linc].qty+1);return}
    if(t.dataset.ldec!=null){setLine(+t.dataset.ldec,lines[+t.dataset.ldec].qty-1);return}
  });
  document.addEventListener('change',function(e){
    if(!e.target.closest||!e.target.closest('.mmrc')) return;
    var k=e.target.dataset.ev, el=e.target;
    if(el.dataset.choice!=null){ui.modal.sel[el.dataset.choice]=el.value;renderModal();return}
    if(el.hasAttribute('data-iqty')){itemQty(el.value);return}
    if(el.hasAttribute('data-opt')){el.classList.remove('need');var cd=el.closest('.card'),it=items[cd.dataset.id],o=(it.options||[]).filter(function(o){return o.name===el.value})[0],im=cd.querySelector('.ph img');if(o&&o.photo&&im)im.src=o.photo;else if(im)im.src=it.photo;return}
    if(k){ev[k]=el.value.trim();
      if(k==='from'&&ev.from&&(!ev.until||ev.until<ev.from)) ev.until=ev.from;
      save();
      if(k==='from'||k==='until'){$all('.mmrc [data-ev=from]').forEach(function(x){x.value=ev.from});$all('.mmrc [data-ev=until]').forEach(function(x){x.value=ev.until;x.min=ev.from||minDate});$all('.mmrc .pd-from').forEach(function(x){x.textContent='('+(pretty(ev.from)||'start date')+')'});$all('.mmrc .pd-until').forEach(function(x){x.textContent='('+(pretty(ev.until)||'end date')+')'})}
      if(k==='street'||k==='city'||k==='zip') lookup();
      if(k==='from'||k==='until') renderCart();
      if(k==='from'&&anyPaused()){renderCatalog();renderItem();renderModal()}
      return}
    if(el.dataset.lq!=null) setLine(+el.dataset.lq,el.value);
  });
  document.addEventListener('input',function(e){
    if(!e.target.closest||!e.target.closest('.mmrc')) return;
    if(e.target.classList.contains('search')){var sm=e.target.closest('[data-mmrc]');sm._q=e.target.value;renderList(sm);return}
    var k=e.target.dataset.ev;if(k==='street'||k==='city'||k==='zip'){ev[k]=e.target.value.trim();save(); if(k==='street') acSuggest(e.target)}});
  document.addEventListener('submit',function(e){if(!e.target.matches('.mmrc [data-form]'))return;e.preventDefault();submit(e.target)});
  root.querySelector('[data-scrim]').addEventListener('click',function(){closeAlert();ui.open=false;ui.modal=null;ui.item=null;renderCart();renderModal();renderItem()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ui.item){closeItem();return} if(ui.item&&(e.key==='ArrowLeft'||e.key==='ArrowRight')&&e.target.closest&&e.target.closest('[data-gtrack]')){e.preventDefault();galleryGo(0,e.key==='ArrowLeft'?-1:1);return} if(e.key==='Escape'&&(ui.open||ui.modal)){if(ui.modal){ui.modal=null;renderModal()}else{ui.open=false;renderCart()}}});
  render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
