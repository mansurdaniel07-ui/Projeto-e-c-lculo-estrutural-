/* Função do servidor (Cloudflare Pages Function): repassa o pedido do app para a API da Anthropic.
   A chave fica SÓ aqui, no secret ANTHROPIC_API_KEY do projeto no Cloudflare. Nunca vai para o app. */
const MODELO={complexo:'claude-sonnet-5-5',simples:'claude-haiku-5-5'};
const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export async function onRequestGet({env}){return json({pronto:!!env.ANTHROPIC_API_KEY})}

export async function onRequestPost({request,env}){
  if(!env.ANTHROPIC_API_KEY)return json({code:'sem_chave',message:'A chave da API ainda não foi colocada no servidor.'},503);
  const origem=request.headers.get('origin');
  try{if(origem&&new URL(origem).host!==new URL(request.url).host)return json({code:'origem',message:'Origem não permitida.'},403)}catch(e){return json({code:'origem'},403)}
  if((+request.headers.get('content-length')||0)>20e6)return json({code:'grande',message:'Anexos grandes demais (máximo 20 MB).'},413);
  let b;try{b=await request.json()}catch(e){return json({code:'invalido',message:'Pedido inválido.'},400)}
  const nivel=b&&b.nivel==='complexo'?'complexo':'simples';
  const msgs=(Array.isArray(b&&b.messages)?b.messages:[]).slice(-30).map(m=>{
    const role=m&&m.role==='assistant'?'assistant':'user';
    if(typeof m.content==='string')return{role,content:m.content.slice(0,200000)};
    const content=(Array.isArray(m.content)?m.content:[]).slice(0,10).map(c=>
      c&&c.type==='image'&&c.source&&c.source.type==='base64'&&/^image\/(jpeg|png|gif|webp)$/.test(c.source.media_type)&&typeof c.source.data==='string'
        ?{type:'image',source:{type:'base64',media_type:c.source.media_type,data:c.source.data}}
        :{type:'text',text:String(c&&c.text||'').slice(0,200000)}).filter(c=>c.type==='image'||c.text);
    return{role,content};
  }).filter(m=>m.content.length);
  if(!msgs.length||msgs[0].role!=='user')return json({code:'invalido',message:'Pedido vazio.'},400);
  const corpo={model:MODELO[nivel],max_tokens:nivel==='complexo'?32000:4000,stream:true,messages:msgs,
    output_config:{effort:nivel==='complexo'?'medium':'low'}};
  const cab={'x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'};
  if(nivel==='complexo'){corpo.fallbacks='default';cab['anthropic-beta']='server-side-fallback-2026-07-01'}
  let r;
  try{r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:cab,body:JSON.stringify(corpo)})}
  catch(e){return json({code:'erro',message:'Não consegui falar com a Anthropic.'},502)}
  if(!r.ok){
    let t='';try{t=(await r.json()).error.message}catch(e){}
    const lim=r.status===429||r.status===529;
    return json({code:lim?'rate_limited':r.status===401?'chave_invalida':'erro',message:lim?'Muitos pedidos seguidos, espere um pouco.':(t||'Erro '+r.status)},lim?429:502);
  }
  return new Response(r.body,{headers:{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-store'}});
}
