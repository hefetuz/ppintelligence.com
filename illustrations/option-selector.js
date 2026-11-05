const { Cam, circ, clamp, disposer, facing, fit, mk, pointer, prism, proj,
  put, register, rings, rrect, seg, solid, tdone, tset, tval, tween, unproj } = HL;

// Alternative plans in a slotted decision rack. The selected plan advances;
// neighbours yield less, with a distance-based stagger.
function mount({stage,svg,read},value) {
  const bag=disposer(),C=Cam(45,.5,1.9);
  fit(C,[[-47,-57,0],[47,57,0],[-47,57,36],[65,-57,36]],200,166);
  const P=proj(C),front=facing(C),root=mk('g',{},svg);
  let reach=value,active=-1;
  const [base,baseSeam]=rings(-44,-55,44,55,.15,1.1);
  const tray=solid(root);put(tray,prism(P,front,base,baseSeam,0,4));
  const guides=mk('path',{class:'nf lo'},root);
  guides.setAttribute('d',[-35,0,35].map(y=>seg(P(-35,y,4.1),P(35,y,4.1))).join(''));
  const plans=[-35,0,35].map((y,i)=>{
    const group=mk('g',{},root),body=solid(group);
    const marks=mk('path',{class:'nf lo'},group),pin=solid(group);
    return {y,i,group,body,marks,pin,shift:tween(0),last:NaN};
  });
  function draw(p,q){
    if(p.last===q)return;p.last=q;
    const offset=[-4,5,-1][p.i]+q,z=[7,13,8][p.i]+q*.32;
    const Q=(x,y,w)=>P(x+offset,y+p.y,w);
    const [ring,inner]=rings(-32,-13,32,13,.15,.75);
    put(p.body,prism(Q,front,ring,inner,z,z+1.7));
    p.marks.setAttribute('d',seg(Q(-16,-4,z+1.8),Q(20,-4,z+1.8))
      +seg(Q(-16,3,z+1.8),Q(8,3,z+1.8)));
    // A small recessed pull, positioned at the end of each plan.
    const R=(x,y,w)=>Q(x-24,y,w);
    put(p.pin,prism(R,front,rrect(-2.3,-2.3,2.3,2.3,.1,4),rrect(-1.6,-1.6,1.6,1.6,.1,4),z+1.7,z+1.95));
  }
  function accent(){plans.forEach((p,i)=>p.body.sil.classList.toggle('hi',i===(active<0?1:active)));}
  plans.forEach(p=>draw(p,0));accent();read.textContent='rest';
  const loop=register(stage,(_dt,now)=>{
    let moving=false;
    plans.forEach(p=>{draw(p,tval(p.shift,now));moving ||= !tdone(p.shift,now);});return moving;
  });
  bag.add(loop.unregister);
  function choose(next){
    if(next===active)return;
    const from=next<0?active:next,now=performance.now();active=next;
    plans.forEach((p,i)=>tset(p.shift,next<0?0:i===next?reach:-reach*.12/(1+Math.abs(i-next)),now,Math.abs(i-from)*45));
    accent();read.textContent=next<0?'rest':['Option one','Option two','Option three'][next];loop.wake();
  }
  function aim([sx,sy]){
    const [x,y]=unproj(C,sx,sy,12);
    if(x < -44 || x > 60 || y < -53 || y > 53)return choose(-1);
    choose(clamp(Math.round((y+35)/35),0,2));
  }
  bag.add(pointer(stage,{move:aim,down:aim,leave:()=>choose(-1)}));
  bag.add(()=>svg.replaceChildren());
  return {set:v=>{reach=clamp(v,8,22);if(active>=0){const a=active;active=-1;choose(a);}},destroy:bag.dispose};
}
hairline({
  name:'option-selector',
  means:'Three alternative plans slide from one rack, making room to examine a choice and its trade-offs.',
  rules:[1,2,3,4,5,6,7,8,9,10],range:[8,15,22],
  tour:[[221,128],[222,166],[172,185],null],mount,
});
