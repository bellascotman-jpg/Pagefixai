export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^[a-zA-Z0-9_-]{10,100}$/.test(key)) {
    return new Response('/* PageFix: missing or invalid experiment key */', { status: 400, headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
  }
  const script = `(function(){
  var script = document.currentScript;
  if (!script) return;
  var base = new URL(script.src).origin;
  var key = ${JSON.stringify(key)};
  var configUrl = base + '/api/experiments/public/' + encodeURIComponent(key);
  var storageKey = 'pagefix_exp_' + key;
  function send(eventType, variant, visitorId) {
    try { fetch(base + '/api/experiments/events', {method:'POST',mode:'cors',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({publicKey:key,visitorId:visitorId,variantKey:variant,eventType:eventType})}); } catch(e) {}
  }
  function visitor() {
    try { var id = localStorage.getItem('pagefix_visitor'); if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)); localStorage.setItem('pagefix_visitor', id); } return id; }
    catch(e) { return 'session_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  }
  function run(data) {
    var exp = data.experiment;
    if (!exp || !location.pathname.startsWith(exp.targetUrlPattern)) return;
    var assignment;
    try { assignment = localStorage.getItem(storageKey); } catch(e) {}
    if (assignment !== 'A' && assignment !== 'B') {
      assignment = Math.random() < 0.5 ? 'A' : 'B';
      try { localStorage.setItem(storageKey, assignment); } catch(e) {}
    }
    var node;
    try { node = document.querySelector(exp.selector); } catch(e) { return; }
    if (!node) return;
    var visitorId = visitor();
    node.textContent = assignment === 'A' ? exp.controlText : exp.variantText;
    node.setAttribute('data-pagefix-experiment', key);
    node.setAttribute('data-pagefix-variant', assignment);
    send('impression', assignment, visitorId);
    node.addEventListener('click', function(){ send('click', assignment, visitorId); }, {once:true});
    window.pagefixExperiments = window.pagefixExperiments || {};
    window.pagefixExperiments[key] = function(){ send('conversion', assignment, visitorId); };
    window.pagefixTrackConversion = function(experimentKey){
      var registry = window.pagefixExperiments || {};
      if (experimentKey && registry[experimentKey]) registry[experimentKey]();
      else Object.keys(registry).forEach(function(k){ registry[k](); });
    };
  }
  fetch(configUrl,{mode:'cors',credentials:'omit'}).then(function(r){return r.ok?r.json():null;}).then(function(d){if(d&&d.active)run(d);}).catch(function(){});
})();`;
  return new Response(script, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
}
