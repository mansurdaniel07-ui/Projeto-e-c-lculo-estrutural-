/* D. Compósitos – núcleo comum dos projetos (index.html e filamentadora.html).
   Tudo que é igual em qualquer tipo de projeto fica aqui, para existir em todos automaticamente:
   perfis e peso do aço, plano de corte das varas, catálogo de tipos de projeto (menu inicial),
   carimbo da folha A4, PDF, salvar arquivo, gravação de vídeo, anexos (foto/PDF), voz, Claude.
   Cada tipo de projeto só traz a sua "configuração" + "gerador de peças". */
(function(){
  'use strict';
  const DC={versao:'nucleo-1'};

  /* ===== aço: perfis, peso e corte ===== */
  const AÇO=7.85; // kg/dm³
  const vg=v=>String(v).replace('.',',');
  DC.kgm=function(p){ // kg por metro de barra (placa: a × b, o "comprimento" da peça é a espessura)
    let A;
    if(p.tipo==='placa')return p.a*p.b*AÇO/1000;
    if(p.tipo==='red')A=Math.PI*(p.a-p.t)*p.t;
    else if(p.tipo==='cant')A=p.t*(2*p.a-p.t);
    else if(p.tipo==='chapa')A=p.a*p.t;
    else if(p.tipo==='macico')A=Math.PI*p.a*p.a/4;
    else A=2*p.t*(p.a+p.b)-4*p.t*p.t;
    return A*AÇO/1000;
  };
  DC.perfNome=function(p){
    if(p.tipo==='placa')return 'Chapa '+p.a+'×'+p.b+' · esp. '+vg(p.t);
    if(p.tipo==='red')return 'Tubo redondo Ø'+vg(p.a)+'×'+vg(p.t);
    if(p.tipo==='cant')return 'Cantoneira '+vg(p.a)+'×'+vg(p.a)+'×'+vg(p.t);
    if(p.tipo==='chapa')return 'Barra chata '+vg(p.a)+'×'+vg(p.t);
    if(p.tipo==='macico')return 'Ferro redondo Ø'+vg(p.a);
    return (p.a===p.b?'Tubo quadrado ':'Tubo retangular ')+vg(p.a)+'×'+vg(p.b)+'×'+vg(p.t);
  };
  /* plano de corte: peças em varas de "barra" mm com perda "kerf" mm → {bars:[{livre,pcs}], emendas} */
  DC.cortar=function(lens,barra,kerf){
    const pcs=[];let emendas=0;
    for(const l of lens){if(l>barra){const n=Math.floor(l/barra);emendas++;for(let i=0;i<n;i++)pcs.push(barra);const r=l-n*barra;if(r>0)pcs.push(r);}else pcs.push(l);}
    pcs.sort((a,b)=>b-a);const bars=[];
    for(const p of pcs){let ok=false;for(const b of bars){const k=b.pcs.length?kerf:0;if(b.livre>=p+k){b.livre-=p+k;b.pcs.push(p);ok=true;break;}}if(!ok)bars.push({livre:barra-p,pcs:[p]});}
    return{bars,emendas};
  };
  /* chapa: kg de uma chapa de área (mm²) e espessura (mm) */
  DC.kgChapa=(areaMM2,esp)=>areaMM2*esp*AÇO/1e6;
  /* seções da lista de material universal (mesma ordem em tela, pedido e PDF) */
  DC.SECOES=['Estrutura','Chapas','Mecânicos','Acionamento','Comando e elétrica','Compósito'];

  /* ===== texto e nomes de arquivo ===== */
  DC.norm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  DC.slug=s=>DC.norm(s||'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  DC.hoje=()=>new Date().toISOString().slice(0,10);
  DC.nomeArquivo=nome=>(DC.slug(nome)||'projeto')+'_'+DC.hoje();
  DC.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  DC.lerJSON=t=>{const raw=String(t).trim().replace(/^```(json)?/,'').replace(/```$/,'').trim();return JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));};

  /* ===== catálogo de tipos de projeto (tela inicial) =====
     pagina: onde abre · preset: configuração pronta · emBreve: aparece no menu, ainda não abre */
  DC.TIPOS=[
    {id:'livre',nome:'+ Projeto novo',desc:'Fale, escreva ou mande foto/PDF e o assistente monta',destaque:true},
    {id:'fil',nome:'Filamentadora de tanques',desc:'3D animado, editável, vídeo e folhas',pagina:'filamentadora.html',destaque:true},
    {id:'branco',nome:'Em branco (desenhar)',desc:'Desenhar à mão',preset:'branco'},
    {id:'piscina',nome:'Piscina',desc:'Gabarito',preset:'piscina'},
    {id:'tanque',nome:'Tanque retangular',desc:'Gabarito',preset:'tanque'},
    {id:'cilindro',nome:'Tanque cilíndrico',desc:'Gabarito · mandril que gira',preset:'cilindro'},
    {id:'mesa',nome:'Mesa',desc:'Estrutura',preset:'mesa'},
    {id:'molde',nome:'Berço de molde',desc:'Estrutura',preset:'molde'},
    {id:'escada',nome:'Escada',desc:'Estrutura',preset:'escada'},
    {id:'corrimao',nome:'Corrimão',desc:'Estrutura',preset:'corrimao'},
    {id:'capota',nome:'Capota em arco',desc:'Estrutura',preset:'capota'},
    {id:'filamentadora',nome:'Filamentadora · estrutura e corte',desc:'Máquina (estrutura)',preset:'filamentadora'},
    {id:'gradeamento',nome:'Gradeamento de molde',desc:'Rodízios, reforço e virador',emBreve:true},
    {id:'moldeTrilho',nome:'Molde escalável sobre trilho',desc:'Molde que corre em trilho',emBreve:true},
    {id:'bercoBarco',nome:'Berço de barco',desc:'Apoio do casco',emBreve:true},
    {id:'palco',nome:'Palco',desc:'Estrutura modular',emBreve:true},
    {id:'torre',nome:'Torre',desc:'Estrutura treliçada',emBreve:true},
    {id:'grade',nome:'Grade',desc:'Grade e portão',emBreve:true},
    {id:'motorizacao',nome:'Motorização',desc:'Pulsos/mm, velocidades',emBreve:true},
    {id:'cnc',nome:'CNC router',desc:'Máquina',emBreve:true},
    {id:'laminadora',nome:'Mesa laminadora',desc:'Máquina',emBreve:true},
    {id:'tubo',nome:'Máquina de tubo',desc:'Máquina',emBreve:true},
    {id:'calcMat',nome:'Cálculo de material',desc:'Resina, manta e tecido (dcompositos.pages.dev)',emBreve:true}
  ];
  /* monta os cartões da tela inicial; abrir(tipo) é chamado ao tocar num tipo pronto */
  DC.cartoesInicio=function(el,abrir){
    const prontos=DC.TIPOS.filter(t=>!t.emBreve),breve=DC.TIPOS.filter(t=>t.emBreve);
    const card=t=>`<div class="it${t.destaque?' dest':''}${t.emBreve?' breve':''}" data-k="${t.id}"><b>${DC.esc(t.nome)}</b><span>${DC.esc(t.desc)}</span>${t.emBreve?'<i class="emb">em breve</i>':''}</div>`;
    el.innerHTML=prontos.map(card).join('')+'<div class="iniSep">Próximos módulos</div>'+breve.map(card).join('');
    el.querySelectorAll('.it').forEach(e=>e.onclick=()=>{const t=DC.TIPOS.find(x=>x.id===e.dataset.k);
      if(t.emBreve){e.classList.add('pisca');setTimeout(()=>e.classList.remove('pisca'),900);return;}
      if(t.pagina&&!location.pathname.endsWith(t.pagina)){location.href=t.pagina;return;}abrir(t);});
  };

  /* ===== folha A4 deitada (300 dpi) e carimbo ===== */
  DC.FW=3508;DC.FH=2480;DC.MG=70;
  DC.txt=function(c,t,x,y,sz,cor,al,b){c.font=(b?'700 ':'')+sz+"px 'IBM Plex Sans',Barlow,Arial,sans-serif";c.fillStyle=cor||'#222';c.textAlign=al||'left';c.fillText(t,x,y);};
  /* op: {empresa, projeto, cliente, folha, total, titulo} */
  DC.carimbo=function(c,op){
    const FW=DC.FW,FH=DC.FH,MG=DC.MG;
    c.fillStyle='#fff';c.fillRect(0,0,FW,FH);c.strokeStyle='#222';c.lineWidth=4;c.strokeRect(MG,MG,FW-2*MG,FH-2*MG);
    if(op.titulo)DC.txt(c,op.titulo,MG+40,MG+80,42,'#222','left',true);
    const TW=1050,x=FW-MG-TW,y=FH-MG-260;c.lineWidth=3;c.strokeStyle='#222';c.strokeRect(x,y,TW,260);c.fillStyle='#F98202';c.fillRect(x,y,22,260);
    DC.txt(c,String(op.empresa||'D. Compósitos').toUpperCase().slice(0,30),x+50,y+62,44,'#2C2A2E','left',true);
    DC.txt(c,String(op.projeto||'Projeto').slice(0,50),x+50,y+118,32,'#222','left',true);
    DC.txt(c,((op.cliente?'Cliente: '+op.cliente+' · ':'')+'Medidas em mm · sem escala').slice(0,64),x+50,y+168,26,'#555');
    DC.txt(c,'Data: '+new Date().toLocaleDateString('pt-BR'),x+50,y+218,26,'#555');
    DC.txt(c,'Folha '+op.folha+'/'+op.total,x+TW-30,y+218,28,'#222','right',true);
  };
  /* folha nova com carimbo → contexto 2D (o canvas fica em c.canvas) */
  DC.folha=function(op){const cv=document.createElement('canvas');cv.width=DC.FW;cv.height=DC.FH;const c=cv.getContext('2d');DC.carimbo(c,op);return c;};
  /* cota alinhada entre dois pontos da folha */
  DC.cota=function(c,A,B,t,lado){const o=lado||40;c.strokeStyle='#c05a10';c.fillStyle='#c05a10';c.lineWidth=2;
    const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L*o,ny=dx/L*o,a=[A[0]+nx,A[1]+ny],b=[B[0]+nx,B[1]+ny];
    c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(a[0]+nx*.2,a[1]+ny*.2);c.moveTo(B[0],B[1]);c.lineTo(b[0]+nx*.2,b[1]+ny*.2);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
    const ar=(p,q)=>{const ux=(q[0]-p[0])/L,uy=(q[1]-p[1])/L;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+ux*16-uy*6,p[1]+uy*16+ux*6);c.lineTo(p[0]+ux*16+uy*6,p[1]+uy*16-ux*6);c.closePath();c.fill();};
    ar(a,b);ar(b,a);c.save();c.translate((a[0]+b[0])/2+nx*.35,(a[1]+b[1])/2+ny*.35);let ang=Math.atan2(dy,dx);if(ang>Math.PI/2||ang<-Math.PI/2)ang+=Math.PI;c.rotate(ang);
    c.font="700 26px 'IBM Plex Sans',Arial";c.textAlign='center';c.fillText(t,0,8);c.restore();};

  /* ===== planificação de chapa =====
     pts: polígono 3D plano (mm) → {pts2:[[u,v]], lados:[mm], area:mm², larg, alt}
     (a chapa é girada para o próprio plano e encostada em 0,0, maior lado deitado) */
  DC.planificar=function(pts){
    const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],nr=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
    let n=[0,0,0];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}
    n=nr(n);let im=0,lm=0;for(let i=0;i<pts.length;i++){const l=Math.hypot(...sub(pts[(i+1)%pts.length],pts[i]));if(l>lm){lm=l;im=i;}}
    const u=nr(sub(pts[(im+1)%pts.length],pts[im])),v=nr(crs(n,u));
    let p2=pts.map(p=>{const d=sub(p,pts[im]);return[dot(d,u),dot(d,v)];});
    const mnx=Math.min(...p2.map(p=>p[0])),mny=Math.min(...p2.map(p=>p[1]));p2=p2.map(p=>[p[0]-mnx,p[1]-mny]);
    const lados=p2.map((p,i)=>{const q=p2[(i+1)%p2.length];return Math.round(Math.hypot(q[0]-p[0],q[1]-p[1]));});
    let A=0;for(let i=0;i<p2.length;i++){const a=p2[i],b=p2[(i+1)%p2.length];A+=a[0]*b[1]-b[0]*a[1];}
    return{pts2:p2,lados,area:Math.abs(A)/2,larg:Math.round(Math.max(...p2.map(p=>p[0]))),alt:Math.round(Math.max(...p2.map(p=>p[1])))};
  };
  /* casca curva feita de faixas (cilindro, capota): desenvolve num retângulo comprimento × soma das larguras */
  DC.desenvolver=function(faixas){
    if(faixas.length<2||!faixas.every(p=>p.length===4))return null;
    const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],len=v=>Math.hypot(...v);let L=null,dir=null,W=0;
    for(const p of faixas){const e=[0,1,2,3].map(i=>sub(p[(i+1)%4],p[i])),l=e.map(len),k=l[0]>=l[1]?0:1;
      if(Math.abs(l[k]-l[k+2])>2)return null;const d=e[k].map(v=>v/l[k]);
      if(L==null){L=l[k];dir=d;}else if(Math.abs(l[k]-L)>2||Math.abs(d[0]*dir[0]+d[1]*dir[1]+d[2]*dir[2])<0.999)return null;
      W+=(l[k+1]+l[(k+3)%4])/2;}
    L=Math.round(L);W=Math.round(W);
    return{pts2:[[0,0],[L,0],[L,W],[0,W]],lados:[L,W,L,W],area:L*W,larg:L,alt:W,desenvolvida:true};
  };
  /* assinatura para juntar chapas iguais na lista */
  DC.assinaturaChapa=pl=>pl.lados.slice().sort((a,b)=>a-b).join('x')+'|'+Math.round(pl.area/100);
  /* desenha a chapa planificada cotada dentro da caixa x,y,w,h */
  DC.desenhaChapa=function(c,pl,x,y,w,h){
    const k=Math.min((w-160)/(pl.larg||1),(h-160)/(pl.alt||1)),ox=x+(w-pl.larg*k)/2,oy=y+(h+pl.alt*k)/2,P=p=>[ox+p[0]*k,oy-p[1]*k];
    c.fillStyle='rgba(180,184,188,.35)';c.strokeStyle='#2C2A2E';c.lineWidth=3;c.beginPath();pl.pts2.forEach((p,i)=>{const q=P(p);i?c.lineTo(...q):c.moveTo(...q);});c.closePath();c.fill();c.stroke();
    const cx=pl.pts2.reduce((s,p)=>s+p[0],0)/pl.pts2.length,cy=pl.pts2.reduce((s,p)=>s+p[1],0)/pl.pts2.length;
    if(pl.pts2.length>8){const A=P([0,0]),B=P([pl.larg,0]),C2=P([pl.larg,pl.alt]);DC.cota(c,A,B,pl.larg+'',36);DC.cota(c,B,C2,pl.alt+'',36);return;}
    pl.pts2.forEach((p,i)=>{const q=pl.pts2[(i+1)%pl.pts2.length],A=P(p),B=P(q),m=P([(p[0]+q[0])/2,(p[1]+q[1])/2]),C=P([cx,cy]);
      const nx=-(B[1]-A[1]),ny=B[0]-A[0],fora=(m[0]-C[0])*nx+(m[1]-C[1])*ny>0?1:-1;
      const ret=pl.pts2.length===4&&pl.lados[0]===pl.lados[2]&&pl.lados[1]===pl.lados[3];if(ret&&i>1)return;
      if(pl.lados[i]>=5)DC.cota(c,A,B,pl.lados[i]+'',fora*50);});
  };

  /* ===== bibliotecas por CDN (carregadas só quando precisa) ===== */
  const carregadas={};
  DC.script=src=>carregadas[src]=carregadas[src]||new Promise((ok,err)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>{delete carregadas[src];err(new Error('não carregou '+src.split('/').pop()));};document.head.appendChild(s);});
  const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  DC.libPDF=async()=>{if(window.pdfjsLib)return window.pdfjsLib;await DC.script(PDFJS+'pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';return window.pdfjsLib;};
  DC.canvasBlob=(c,t,q)=>new Promise(r=>c.toBlob(r,t||'image/jpeg',q||0.85));
  /* folhas (canvas A4) → PDF (Blob) */
  DC.pdf=async function(folhas){
    if(!window.jspdf)await DC.script('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    folhas.forEach((cv,i)=>{if(i)pdf.addPage('a4','landscape');pdf.addImage(cv.toDataURL('image/jpeg',0.9),'JPEG',0,0,297,210);});
    return pdf.output('blob');
  };

  /* ===== anexos: fotos e páginas de PDF viram JPEG (máx. 1600 px) ===== */
  DC.reduzir=async function(blob){const img=await createImageBitmap(blob),k=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement('canvas');
    c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);return DC.canvasBlob(c);};
  /* files → [{nome,blob}]; aviso(txt) mostra andamento */
  DC.lerAnexos=async function(files,aviso){
    const out=[];aviso=aviso||(()=>{});
    for(const f of files){
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){aviso('Lendo PDF…');
        const lib=await DC.libPDF(),doc=await lib.getDocument({data:await f.arrayBuffer()}).promise,n=Math.min(doc.numPages,4);
        for(let i=1;i<=n;i++){const pg=await doc.getPage(i),v0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(3,1600/Math.max(v0.width,v0.height))});
          const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;const cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,c.width,c.height);
          await pg.render({canvasContext:cx,viewport:vp}).promise;out.push({nome:f.name+' p.'+i,blob:await DC.canvasBlob(c)});}
        if(doc.numPages>4)aviso('PDF com '+doc.numPages+' páginas: vou mandar as 4 primeiras.');
      }else if(f.type.startsWith('image/'))out.push({nome:f.name,blob:await DC.reduzir(f)});
      else throw new Error('mande PDF ou foto ('+f.name+')');
    }
    return out;
  };

  /* ===== recursos: Claude, voz, leitura em voz alta, downloads =====
     dentro do claude.ai vêm da página; fora, da ponte (dc-ponte.js) */
  let REC=null;
  DC.recursos=()=>REC=REC||(async()=>{const r={};for(const k of['sample','dictation','tts','downloads']){try{r[k]=await (window.claude&&window.claude.use(k));}catch(e){r[k]=null;}}return r;})();
  /* salva um arquivo; devolve o texto para mostrar ao usuário */
  DC.salvar=async function(nome,blob){
    const{downloads}=await DC.recursos();
    if(downloads){try{await downloads.save({filename:nome,data:blob});return{ok:true,msg:'Salvo: '+nome};}
      catch(e){return{ok:false,msg:e&&e.code==='declined'?'Cancelado.':'Não salvou ('+((e&&(e.code||e.message))||'erro')+').'};}}
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);
    return{ok:true,msg:'Salvo: '+nome};
  };
  /* ditado ligado a um campo de texto: liga(campo,{mic,onFim}) */
  DC.ditado=async function(campo,op){
    const{dictation}=await DC.recursos();op=op||{};const mic=op.mic;let REC_=false,base='';
    const teclado=()=>{campo.focus();op.aviso&&op.aviso('Toque no microfone do teclado do celular e fale.');};
    if(!dictation){mic.onclick=teclado;return null;}
    dictation.onPartial(({text})=>{campo.value=base+text;});
    dictation.onFinal(({text})=>{base=base+text+' ';campo.value=base;});
    dictation.onState(({state})=>{REC_=state==='listening';mic.classList.toggle('rec',REC_);if(op.rotulo)mic.textContent=REC_?op.rotulo[1]:op.rotulo[0];if(!REC_&&op.onFim)op.onFim();});
    mic.onclick=()=>{if(REC_){dictation.stop().catch(()=>{});return;}op.antes&&op.antes();base=campo.value?campo.value.replace(/\s*$/,' '):'';
      dictation.start().catch(e=>{if(e&&e.code==='not_granted')mic.onclick=teclado;teclado();});};
    return dictation;
  };

  /* ===== vídeo: grava o canvas do 3D (mp4 se o navegador aceitar, senão webm) ===== */
  DC.gravador=function(canvas){
    if(!canvas.captureStream||!window.MediaRecorder)throw new Error('Este navegador não grava vídeo. Tente no Chrome.');
    const mime=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime)throw new Error('Este navegador não grava vídeo.');
    const parts=[],rec=new MediaRecorder(canvas.captureStream(30),{mimeType:mime,videoBitsPerSecond:8e6});
    rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data);};
    const fim=new Promise(r=>rec.onstop=r);rec.start(250);
    return{ext:mime.includes('mp4')?'mp4':'webm',async parar(){rec.stop();await fim;return new Blob(parts,{type:mime.split(';')[0]});}};
  };

  /* ===== peças com nome: apagar/mostrar pelo nome (usado pelo Claude e pelo toque) ===== */
  /* acha os nomes de uma lista que combinam com o pedido ("gabarito 2", "todos os raios"…) */
  DC.achaNomes=function(pedidos,nomes){
    const out=new Set();
    for(const q of[].concat(pedidos||[])){const nq=DC.norm(q).trim();if(!nq)continue;
      const ex=nomes.filter(n=>DC.norm(n)===nq);if(ex.length){ex.forEach(n=>out.add(n));continue;}
      /* frase inteira dentro do nome ("gabarito 2" → "Gabarito 2 – anel", não "Gabarito 1 – raio 2") */
      const fr=new RegExp('(^|[^a-z0-9])'+nq.replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'\\s+')+'s?($|[^a-z0-9])');
      const fx=nomes.filter(n=>fr.test(DC.norm(n)));if(fx.length){fx.forEach(n=>out.add(n));continue;}
      const pal=nq.split(/[^a-z0-9]+/).filter(w=>w&&!/^(o|a|os|as|de|da|do|das|dos|e|todos?|todas?|peca|pecas)$/.test(w));
      nomes.filter(n=>{const nn=DC.norm(n);return pal.length&&pal.every(w=>/^\d+$/.test(w)?new RegExp('(^|\\D)'+w+'(\\D|$)').test(nn):nn.includes(w.replace(/s$/,'')));}).forEach(n=>out.add(n));}
    return[...out];
  };

  /* ===== tela de abertura (marca) enquanto o app carrega ===== */
  (function(){
    const st=document.createElement('style');st.textContent="#dcSplash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#17181b;transition:opacity .45s}#dcSplash.fim{opacity:0;pointer-events:none}#dcSplash .m{text-align:center;font-family:'Barlow Semi Condensed','Barlow Condensed',Arial,sans-serif;color:#f2efe9}#dcSplash .m b{display:block;font-size:44px;letter-spacing:.04em;font-weight:700}#dcSplash .m b i{font-style:normal;color:#F98202}#dcSplash .m span{display:block;margin-top:6px;font:500 13px 'IBM Plex Sans',Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#9a9ea4}#dcSplash .bar{width:160px;height:3px;margin:22px auto 0;background:#2c2e33;border-radius:2px;overflow:hidden}#dcSplash .bar:after{content:'';display:block;height:100%;width:40%;background:#F98202;animation:dcB 1s ease-in-out infinite}@keyframes dcB{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}";
    document.head.appendChild(st);
    const mostra=()=>{if(document.getElementById('dcSplash'))return;const d=document.createElement('div');d.id='dcSplash';d.innerHTML='<div class="m"><b><i>D.</i> Compósitos</b><span>Projetos de estruturas</span><div class="bar"></div></div>';document.body.appendChild(d);
      const t0=Date.now(),tira=()=>setTimeout(()=>{d.classList.add('fim');setTimeout(()=>d.remove(),500)},Math.max(0,700-(Date.now()-t0)));
      if(document.readyState==='complete')tira();else window.addEventListener('load',tira);setTimeout(tira,6000);};
    if(document.body)mostra();else document.addEventListener('DOMContentLoaded',mostra);
  })();
  window.DC=DC;
})();
