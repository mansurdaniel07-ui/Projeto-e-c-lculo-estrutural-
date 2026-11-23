/* D. Compósitos – ponte para rodar fora do Claude.
   Dentro da página do Claude (claude.ai) não faz nada: o app usa os recursos de lá.
   Fora dele, cria window.claude.use(...) com os mesmos nomes que o app já usa:
   'sample'    → conversa com o Claude pela função do servidor /api/claude (a chave fica só no servidor)
   'dictation' → voz pelo navegador (Web Speech API, pt-BR)
   'tts'       → leitura em voz alta (speechSynthesis, pt-BR)
   'downloads' → download normal; no celular, compartilhar o arquivo quando der */
(function(){
  if(window.claude&&typeof window.claude.use==='function')return;
  const API='/api/claude';
  const erro=(code,msg)=>{const e=new Error(msg||code);e.code=code;return e};
  let pronto=null;
  async function servidorPronto(){
    if(pronto!==null)return pronto;
    try{const r=await fetch(API,{cache:'no-store'});pronto=r.ok&&(await r.json()).pronto===true}catch(e){pronto=false}
    return pronto;
  }
  async function base64(blob){
    const b=new Uint8Array(await blob.arrayBuffer());let s='';
    for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));
    return btoa(s);
  }
  /* sample(texto ou mensagens, {modelTier:'complex'|'default', images:[Blob]}) → {text} */
  async function sample(entrada,op){
    op=op||{};
    const msgs=(typeof entrada==='string'?[{role:'user',content:entrada}]:entrada).map(m=>({role:m.role,content:m.content}));
    const imgs=(op.images||[]).slice(0,8);
    if(imgs.length){
      const ult=msgs[msgs.length-1],blocos=[];
      for(const b of imgs){const mt=/^image\/(jpeg|png|gif|webp)$/.test(b.type||'')?b.type:'image/jpeg';
        blocos.push({type:'image',source:{type:'base64',media_type:mt,data:await base64(b)}});}
      blocos.push({type:'text',text:String(ult.content)});ult.content=blocos;
    }
    let r;
    try{r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({nivel:op.modelTier==='complex'?'complexo':'simples',messages:msgs})});}
    catch(e){throw erro('sem_internet','Sem conexão com a internet.')}
    if(!r.ok){let j={};try{j=await r.json()}catch(e){}throw erro(j.code||'erro',j.message||('Erro '+r.status))}
    const rd=r.body.getReader(),dec=new TextDecoder();let buf='',txt='',fim=null;
    for(;;){
      const{value,done}=await rd.read();if(done)break;
      buf+=dec.decode(value,{stream:true});let i;
      while((i=buf.indexOf('\n\n'))>=0){
        const ev=buf.slice(0,i);buf=buf.slice(i+2);
        const d=ev.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('');
        if(!d)continue;let j;try{j=JSON.parse(d)}catch(e){continue}
        if(j.type==='message_start')txt='';
        else if(j.type==='content_block_delta'&&j.delta&&j.delta.type==='text_delta')txt+=j.delta.text;
        else if(j.type==='message_delta'&&j.delta&&j.delta.stop_reason)fim=j.delta.stop_reason;
        else if(j.type==='error'){const t=j.error&&j.error.type;throw erro(t==='overloaded_error'||t==='rate_limit_error'?'rate_limited':'erro',j.error&&j.error.message)}
      }
    }
    if(fim==='refusal'&&!txt.trim())throw erro('recusado','O pedido foi recusado. Tente com outras palavras.');
    return{text:txt};
  }
  sample.limits=async()=>({images:true});

  function dictation(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;
    let rec=null,ativo=false,cbP=()=>{},cbF=()=>{},cbS=()=>{};
    return{
      onPartial(f){cbP=f},onFinal(f){cbF=f},onState(f){cbS=f},
      start(){return new Promise((ok,no)=>{
        try{
          rec=new SR();rec.lang='pt-BR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
          rec.onstart=()=>{ativo=true;cbS({state:'listening'});ok()};
          rec.onresult=e=>{let parc='';
            for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)cbF({text:r[0].transcript.trim()});else parc+=r[0].transcript}
            if(parc)cbP({text:parc})};
          let ultErro=null;
          rec.onerror=e=>{ultErro=e.error;if(!ativo)no(erro(e.error==='not-allowed'||e.error==='service-not-allowed'?'not_granted':'erro',e.error))};
          rec.onend=()=>{ativo=false;cbS({state:'idle',error:ultErro})};
          rec.start();
        }catch(e){no(erro('erro',e.message))}
      })},
      stop(){try{rec&&rec.stop()}catch(e){}return Promise.resolve()}
    };
  }

  function tts(){
    if(!('speechSynthesis' in window))return null;
    let voz=null;const acha=()=>{const v=speechSynthesis.getVoices();voz=v.find(x=>/pt[-_]BR/i.test(x.lang))||v.find(x=>/^pt/i.test(x.lang))||null};
    acha();try{speechSynthesis.addEventListener('voiceschanged',acha)}catch(e){}
    return{
      speak(t,op){return new Promise(ok=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t));
        u.lang=(op&&op.language)||'pt-BR';if(voz)u.voice=voz;u.onend=u.onerror=()=>ok();speechSynthesis.speak(u)})},
      stop(){speechSynthesis.cancel();return Promise.resolve()}
    };
  }

  const downloads={async save({filename,data}){
    let blob=data;
    if(typeof data==='string')blob=data.startsWith('data:')?await (await fetch(data)).blob():new Blob([data],{type:'text/plain'});
    else if(!(data instanceof Blob))blob=new Blob([data]);
    const celular=matchMedia('(pointer:coarse)').matches;
    if(celular&&navigator.canShare){
      try{const f=new File([blob],filename,{type:blob.type||'application/octet-stream'});
        if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:filename});return}}
      catch(e){if(e&&e.name==='AbortError')throw erro('declined')}
    }
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);
  }};

  window.claude={use:async nome=>{
    if(nome==='sample')return(await servidorPronto())?sample:null;
    if(nome==='dictation')return dictation();
    if(nome==='tts')return tts();
    if(nome==='downloads')return downloads;
    return null;
  }};
})();
